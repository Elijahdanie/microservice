const ioredis = require('ioredis');
const Queue = require('bull');
const fs = require('fs');

class EventHandler {

    redisDb;
    services = {};
    redisConfig;
    defaultOptions;
    manifest;
    callbackStacks = {};


    constructor(config, options){
        this.defaultOptions = options;
        this.redisConfig = config;
        this.redisDb = new ioredis(this.redisConfig);
        this.manifest = {}
    }

    async Invoke(job){
        const {path, data} = job;
        // get the list of services that are listening to this event
        const services = await this.redisDb.smembers(path);
        // for each service, send the data
        for(const service of services){
            let serviceQueue = this.fetchService(service);
            await serviceQueue.add({path, data, IsEventCall: true}, this.defaultOptions);
        }
        
    }

    getHierachy(identifier){
        // identifier type is "mrn-app-service-method"
        const parts = identifier.split(':');
        return {
            application: parts[1],
            service: parts[2],
            method: parts[3]
        }
    }

    checkValueExists(key, value){
        return this.redisDb.sismember(key, value);
    }

    async init(identifier){
        const { application, service } = this.getHierachy(identifier);

        let methods = await this.redisDb.smembers(identifier);
        await this.redisDb.del(identifier);
        await Promise.all(methods.map(async (method)=>{
            let methodKey = `${identifier}:${method}`;
            //console.log('deleting', methodKey);
            //delete
            await this.redisDb.del(methodKey);
        }));

        await this.redisDb.sadd(`mrn:${application}`, service);
        //console.log('finnished initializing');
    }

    async registerRouteDefinitions(methodName, paramNames){
        //console.log('registering route', methodName);
        const {application,service, method} = this.getHierachy(methodName);

        const serviceKey = `mrn:${application}:${service}`;
        await this.redisDb.sadd(`${serviceKey}`, method);
        // clear previous
        await this.redisDb.del(methodName);

        await this.redisDb.set(methodName, JSON.stringify(paramNames));
    }

    fetchService(service){
        if(!this.services[service]){
            this.services[service] = new Queue(service, this.redisConfig);
        }
        return this.services[service];
    }

    async registerEvent(eventName, service){

        if(!this.manifest[eventName]){
            this.manifest[eventName] = [];
        }

        this.manifest[eventName].push(service);
        
        await this.redisDb.sadd(eventName, service);
    }

    async resolveManifest(service){
        
        let manifestKey = `${service}-manifest`
        let manfifestFile = await this.redisDb.get(manifestKey);

        if(manfifestFile) {
            let savedManifest = JSON.parse(manfifestFile);
            let manifestKeys = Object.keys(this.manifest);
            await Promise.all(Object.keys(savedManifest).map(async eventName=>{
                if(!manifestKeys.includes(eventName)){
                    await this.redisDb.srem(eventName, service);
                }
            }));
        }

        await this.redisDb.set(manifestKey, JSON.stringify(this.manifest));
    }

    async registerCallbackStack(id, callback){
        if(!this.callbackStacks[id]){
            this.callbackStacks[id] = callback;
        }
    }

    async handleResponse(id, data){
        if(this.callbackStacks[id]){
            let callback = this.callbackStacks[id];
            callback(data);
            delete this.callbackStacks[id];
        }
    }
}

module.exports = EventHandler;