const Queue = require('bull');


class Service {

    queue;
    handlers;

    constructor(name, config){
        this.handlers = {};
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
    async sendData(service, path, data, options){
        let queue = new Queue(service);
        await queue.add({path, data}, options);
    }
}

module.exports = Service;