const Queue = require('bull');


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
     * The name of the service
     */
    servicName;

    constructor(name, config){
        this.handlers = {};
        this.servicName = name;
        this.queue = new Queue(name, config);
        this.queue.process(async (job)=>{
            const handler = this.handlers[job.data.path];
            if(handler){
                return handler(job.data);
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

     /**
     * Send data to a service
     * @param service 
     * @param path 
     * @param data 
     */
     async send(path, data, options){
        await this.queue.add({path, data}, options);
    }
}

module.exports = Service;