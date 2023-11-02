const Queue = require('bull');
const EventHandler = require('./event');
const fs = require('fs');
const { v4 } = require('uuid');
const RabbitMq = require('./rabbitmq');


let serviceHandlerPromises = [];

let eventRegisterPromises = [];

/**
 * This abstracts a service that can send, receive and process data
 */
class Service {

    /**
     * The queue that will be used to send and receive data
     */
    queue;

    /**
     * The handlers that will be used to process data
     */
    handlers;

    /**
     * The handlers that will be used to process data
     * that are local to the service
     * These are handlers that are not registered
     * with the event handler
     */
    eventFunctions = {};

    /**
     * The event handlers that will be used to process data
     */
    eventHandler;

    /**
     * The root key of the service
     * This is used to identify the service
     *  with template mrn-application-service
     */
    rootKey;

    instance;

    container;

    defaultContainer = {};

    /**
     * The name of the service
     */
    serviceName;

    queueOptions = {
        server: {
            host: 'localhost',
            port: 6379
        },
        defaultJobOptions: {
            attempts: 2,
            removeOnComplete: true,
            removeOnFail: true
        }
    }

    constructor(container, config) {
        this.handlers = {};
        if (!container) {
            console.log("WARNING: no container provided, using default container, attach container to service to use dependency injection, default container may not keep track of your dependencies");
        }
        this.container = container;

        if (!config) {
            config = this.getConfig();
            if (!config) {
                throw new Error('No config provided, run mrn init to create a config file');
            }
        }

        this.serviceName = config.service ? config.service : this.getServiceName();

        if (Service.instance && Service.instance.serviceName === this.serviceName) {
            console.error(`WARNING: only one instance of ${this.serviceName}'s Service can be running in a single node instance`);
            return;
        }

        if (Service.instance) {
            console.error(`WARNING: only one instance of Service can be running in a single node instance`);
            return;
        }
        this.rootKey = `mrn:${config.application}:${this.serviceName}`;
        const Broker = config.broker === 'bull' ? Queue : RabbitMq;
        this.queue = new Broker(this.serviceName, config.queue ? config.queue : this.queueOptions);
        this.eventHandler = new EventHandler(config.queue ? config.queue : this.queueOptions, Broker);

        this.queue.process(async (job, done) => {
            const { path, data, IsEventCall, id, sender, isResponse } = job.data;

            if (isResponse) {
                await this.eventHandler.handleResponse(id, data);
                done();
                return;
            }

            try {
                const handler = this.handlers[path];

                // if it is not a response call, and there is a handler
                if (!isResponse && handler && !IsEventCall) {
                    if (handler.isDecorator) {
                        let result = null;
                        if(handler.callback){
                            result = await handler.callback(data);
                        } else {
                            if (!handler.target && this.container) {
                                handler.target = this.container.get(handler.classType);
                            }
                            if(!handler.target && !this.container){
                                handler.target = new handler.classType();
                            }
                            result = await handler.target[handler.functionName](...(Object.values(data)));
                        }
                        if (sender) {
                            let queue = this.eventHandler.fetchService(sender);
                            await queue.add({ data: result, id, isResponse: true }, this.queueOptions.defaultJobOptions);
                        }
                    } else {
                        result = await handler.callback(data);

                        // send response back to the sender
                        if (sender) {
                            let queue = this.eventHandler.fetchService(sender);
                            await queue.add({ data: result, id, isResponse: true }, this.queueOptions.defaultJobOptions);
                        }
                    }
                    await this.eventHandler.Invoke(job.data);
                }
                // if it is an event call
                else if (!isResponse && IsEventCall) {
                    if (this.eventFunctions[path]) {
                        for (let j = 0; j < this.eventFunctions[path].length; j++) {
                            this.eventFunctions[path][j](data);
                        }
                    }
                }
                done();
            } catch (error) {
                console.log(error);
                done(error);
            }
        })
        this.sync();
    }


    /**
     * Sync the service with the event handler
     * This will register all the handlers and events
     * with the event handler
     */
    async sync() {

        await this.eventHandler.init(this.rootKey);

        await Promise.all(serviceHandlerPromises.map(async (promise) => {
            await promise();
        }));

        await Promise.all(eventRegisterPromises.map(async (promise) => {
            await promise();
        }));

        //resolve the manifest here
        await this.eventHandler.resolveManifest();
    }

    /**
     * Returns the config file
     * @returns the config file
     */
    getConfig() {
        let path = __dirname.split('/');
        let configPath = `${path.slice(0, path.length - 2).join('/')}/mrn.config.json`;

        if (fs.existsSync(configPath)) {
            let file = require(configPath);
            return file;
        }

        return null;
    }

    /**
     * Returns the service name
     * @returns the service name
     */
    getServiceName() {
        let path = __dirname.split('/');
        return path[path.length - 3];
    }

    /**
     * Register a handler for a path
     * @param path 
     * @param handler 
     */
    async registerDecorator(path, func, target) {
        if (this.handlers.hasOwnProperty(func)) {
            console.error('A handler for this function already exists');
            return;
        }
        this.handlers[path] = {
            // callback: func,
            functionName: func,
            classType: target.constructor,
            isDecorator: true
        };
    }

    /**
     * Register a function for a path
     * @param path
     * @param func
     */
    async registerHandler(path, func) {
        if (this.handlers.hasOwnProperty(path)) {
            console.error(`A handler for this function "${path}" already exists`);
            return;
        }
        this.handlers[path] = {
            callback: func,
            isDecorator: false
        };
    }

    /**
     * Registers a function
     * @param {*} func 
     * @returns 
     */
    async registerFunction(func) {
        if (func.name) {
            if (this.handlers.hasOwnProperty(func.name)) {
                console.error(`A handler for this function ${func.name} already exists`);
                return;
            }
            this.handlers[func.name] = {
                callback: func,
                isDecorator: true
            };
        }
        else {
            throw new Error('Register a named function');
        }
    }

    /**
     * Subscribe to an event
     * @param {*} path
     * @param {*} callback
     * @param {*} isDecorator
     * @returns
     */
    async subscribe(path, callback) {
        if (!this.eventFunctions[path]) {
            this.eventFunctions[path] = [];
        }
        this.eventFunctions[path].push(callback);
        this.eventHandler.registerEvent(path, this.serviceName);
    }

    async hook(route, callback) {
        const type = route.name;
        await this.subscribe(type, callback);
    }

    call(service, route, data, IsCallback=false) {
        return IsCallback ? this.send(service, route.name, data) : this.sendNoCallback(service, route.name, data);
    }

    /**
     * Invoke an event
     * @param {*} path
     * @param {*} eventArgs
     */
    async invokeEvent(path, eventArgs) {
        await this.eventHandler.Invoke({ path, data: eventArgs });
    }

    async Invoke(route, eventArgs) {
        await this.eventHandler.Invoke({ path: route.name, data: eventArgs });
    }

    /**
     * Send data to a service
     */
    async send(service, path, data, options) {
        let queue = await this.eventHandler.fetchService(service);
        let id = v4();
        await queue.add({ path, data, id, sender: this.serviceName }, options ? options : this.queueOptions.defaultJobOptions);
        return await this.processCallback(id);
    }

    async sendNoCallback(service, path, data, options) {
        let queue = await this.eventHandler.fetchService(service);
        let id = v4();
        await queue.add({ path, data, id}, options ? options : this.queueOptions);
    }

    processCallback(id) {
        return new Promise(async (resolve, reject) => {
            await this.eventHandler.registerCallbackStack(id, (data) => {
                resolve(data);
            });
        });
    }

    /**
     * Send data to a service
     * @param {*} service
     * @param {*} path
     * @param {*} data
     * @param {*} options
     */
    async sendDecorator(service, path, data, options) {
        let queue = this.eventHandler.fetchService(service);
        await queue.add({ path, data, isDecorator: true, sender: this.serviceName }, options ? options : this.queueOptions.defaultJobOptions);
    }

    static getParameterNames(func) {
        const match = func.toString().match(/^async\s*\w+\s*\((.*?)\)/);
        if (match && match[1]) {
            return match[1].split(',').map(param => param.trim());
        }
        return [];
    }
}

const serviceFunction = (target, name, descriptor) => {
    serviceHandlerPromises.push(async () => {
        const paramNames = Service.getParameterNames(descriptor.value);
        Service.instance.registerDecorator(name, descriptor.value.name, target);
        let methodKey = `${Service.instance.rootKey}:${name}`;

        Service.instance.eventHandler.registerRouteDefinitions(methodKey, paramNames)
    });
    return descriptor;
}

const subscribeFunction = (instance) => {
    return (target, name, descriptor) => {
        eventRegisterPromises.push(async () => {
            if (instance) {
                Service.instance.subscribe(instance.name, descriptor.value);
            }
            else {
                Service.instance.subscribe(name, descriptor.value);
            }
        });
        return descriptor;
    }
}

const createService = (container, config) => {
    if (Service.instance) {
        return Service.instance;
    }
    Service.instance = new Service(container, config);
    return Service.instance;
}

//export default Service;

module.exports = {
    Service,
    createService,
    serviceFunction,
    subscribeFunction,
};
