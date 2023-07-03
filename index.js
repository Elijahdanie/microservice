const Queue = require('bull');
const EventHandler = require('./event');

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
     * The event handlers that will be used to process data
     */
    eventHandler;

    /**
     * The name of the service
     */
    servicName;

    defaultOptions = {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true
    }

    constructor(name, config){
        this.handlers = {};
        this.servicName = name;
        this.queue = new Queue(name, config);
        this.eventHandler = new EventHandler(config, this.defaultOptions);
        this.queue.process(async (job, done)=>{
            const {path, data, IsEventCall} = job.data;
            const handler = this.handlers[path];
            if(handler){
                // fire event here
                handler(data);
                done();
            }
            if(!IsEventCall){
                await this.eventHandler.Invoke(job.data);
            }
        })
    }

    /**
     * Register a handler for a path
     * @param path 
     * @param handler 
     */
    async registerHandler(path, handler){
        this.handlers[path] = handler;
    }

    async subscribe(path, callback){
        this.handlers[path] = callback;
        this.eventHandler.registerEvent(path, this.servicName);
    }

    async invokeEvent(path, eventArgs){
        await this.eventHandler.Invoke({path, data: eventArgs});
    }

    /**
     * Send data to a service
     */
    async send(service, path, data, options){
        let queue =  this.eventHandler.fetchService(service);
        await queue.add({path, data}, options ? options : this.defaultOptions);
    }

    serviceFunction = (target, name, descriptor) => {
        const paramNames = Service.getParameterNames(original);
        this.registerHandler(name, descriptor.value);
        console.log(paramNames);
        // name is the name of the function
        // paramNames are the names of the parameters
    
        // need a reference to a redisStore
        return descriptor;
    }

    static getParameterNames(func) {
        const match = func.toString().match(/^async\s*\w+\s*\((.*?)\)/);
        if (match && match[1]) {
            return match[1].split(',').map(param => param.trim());
        }
        return [];
    }
}

// export Service as default and serviceFunction as a named export
module.exports = Service; 