const Queue = require('bull');
const EventHandler = require('./event');
const fs = require('fs');
const {v4} = require('uuid');

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

    serviceHandlerPromises = [];

    eventRegisterPromises = [];

    /**
     * The name of the service
     */
    serviceName;

    queueOptions = {
        redis: {
            host: 'localhost',
            port: 6379
        },
        JobOptions: {
            attempts: 2,
            removeOnComplete: true,
            removeOnFail: true
        }
    }

    constructor(config) {

        this.handlers = {};

        if (!config) {
            config = this.getConfig();
            if (!config) {
                throw new Error('No config provided, run mrn init to create a config file');
            }
        }

        this.serviceName = config.service ? config.service : this.getServiceName();

        if (Service.instance && Service.instance.serviceName === this.serviceName) {
            // console.log('An instance for this service is already running');
            console.error(`WARNING: only one instance of ${this.serviceName}'s Service can be running in a single node instance`);
            return;
        }

        if (Service.instance) {
            console.error(`WARNING: only one instance of Service can be running in a single node instance`);
            return;
        }
        this.rootKey = `mrn:${config.application}:${this.serviceName}`;
        this.queue = new Queue(this.serviceName, config.queue ? config.queue : this.queueOptions);
        this.eventHandler = new EventHandler(config, this.queueOptions.JobOptions);

        this.queue.process(async (job, done) => {
            const { path, data, IsEventCall, id, sender, isResponse } = job.data;
            
            // check if it is a response call
            if(isResponse){
                await this.eventHandler.handleResponse(id, data);
                done();
                return;
            }

            try {
                const handler = this.handlers[path];

                // if it is not a response call, and there is a handler
                if (!isResponse && handler && !IsEventCall) {
                    if(handler.isDecorator){
                        const result = await handler.callback(...(Object.values(data)));

                        // send response back to the sender
                        let queue = this.eventHandler.fetchService(sender);
                        await queue.add({ result, data: result, id, isResponse: true }, this.defaultOptions);
                    } else {
                        const result = await handler.callback(data);

                        // send response back to the sender
                        let queue = this.eventHandler.fetchService(sender);
                        await queue.add({ result, data: result, id, isResponse: true }, this.defaultOptions);   
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
                // we need to do something here
                done(error);
            }
        })
        this.sync();
        //console.log('constructor')
    }


    /**
     * Sync the service with the event handler
     * This will register all the handlers and events
     * with the event handler
     */
    async sync() {

        await this.eventHandler.init(this.rootKey);

        await Promise.all(this.serviceHandlerPromises.map(async (promise) => {
            await promise();
        }));

        await Promise.all(this.eventRegisterPromises.map(async (promise) => {
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
    async registerDecorator(path, func) {
        if (this.handlers.hasOwnProperty(func.name)) {
            console.error('A handler for this function already exists');
            return;
        }
        this.handlers[path] = {
            callback: func,
            isDecorator: true
        };
    }

    /**
     * Register a function for a path
     * @param path
     * @param func
     */
    async registerHandler(path, func) {
        console.log(path, func);
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

    /**
     * Invoke an event
     * @param {*} path
     * @param {*} eventArgs
     */
    async invokeEvent(path, eventArgs) {
        await this.eventHandler.Invoke({ path, data: eventArgs });
    }

    /**
     * Send data to a service
     */
    async send(service, path, data, options) {
        let queue = this.eventHandler.fetchService(service);
        let id = v4();
        await queue.add({ path, data, id, sender: this.serviceName }, options ? options : this.defaultOptions);
        return await this.processCallback(id);
    }

    processCallback(id){
        return new Promise(async (resolve, reject) => {
            await this.eventHandler.registerCallbackStack(id, (data)=>{
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
        await queue.add({ path, data, isDecorator: true }, options ? options : this.defaultOptions);
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
    Service.instance.serviceHandlerPromises.push(async () => {

        const paramNames = Service.getParameterNames(descriptor.value);

        Service.instance.registerDecorator(name, descriptor.value);
        let methodKey = `${Service.instance.rootKey}:${name}`;

        Service.instance.eventHandler.registerRouteDefinitions(methodKey, paramNames)
    });
    return descriptor;
}

const subscribeFunction = (instance) => {
    return (target, name, descriptor) => {
        //console.log(instance.name, 'SUBSCRIBE');
        Service.instance.eventRegisterPromises.push(async () => {
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

const createService = (config) => {
    Service.instance = new Service(config);
    return Service.instance;
}

// export Service as default and serviceFunction as a named export
module.exports = {
    createService,
    serviceFunction,
    subscribeFunction,
};