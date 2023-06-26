const ioredis = require('ioredis');
const Queue = require('bull');

class EventHandler {

    redisDb;
    services = {};
    redisConfig;
    defaultOptions;
    constructor(config, options){
        this.defaultOptions = options;
        this.redisConfig = config;
        this.redisDb = new ioredis(this.redisConfig);
    }

    async Invoke(job){
        const {path, data} = job;
        // get the list of services that are listening to this event
        const services = await this.redisDb.smembers(path);
        console.log(services, 'services GOTTEN', path);
        // for each service, send the data
        for(const service of services){
            let serviceQueue = this.fetchService(service);
            await serviceQueue.add({path, data, IsEventCall: true}, this.defaultOptions);
        }
        
    }

    fetchService(service){
        if(!this.services[service]){
            this.services[service] = new Queue(service, this.redisConfig);
        }
        return this.services[service];
    }

    async registerEvent(eventName, service){
        //console.log(eventName, service);
        await this.redisDb.sadd(eventName, service);
    }
}

module.exports = EventHandler;