import Redis from "ioredis";

const { Socket } = require('socket.io-client');
const {v4} = require('uuid');

var CLIENTMAP = {}

var localSocketId = v4();

var SOCKETS = {}

class LocusSocket {

    socket = null;

    originServer = "";

    remoteServer = "";

    originClient = "";

    events = {};

    constructor(socket, originServer, clientSocketId) {
        this.socket = socket;
        this.originServer = originServer;
        this.originClient = socket ? socket.id : clientSocketId;
        SOCKETS[this.originClient] = this;
    }

    emit = (eventName, data) =>{
        if(!this.socket){
            CLIENTMAP[this.originServer].emit('transit', {
                eventName,
                data,
                originClient: this.originClient
            });
        } else {
            this.socket.emit(eventName, data);
        }
    }

    connectForeign = (remoteServer) => {
        this.remoteServer = remoteServer;
        CLIENTMAP[remoteServer].emit('swarmHandShake', {
            client: this.originClient,
            originServer: this.originServer
        });
    }

    disconnect = (silent) => {
        if(this.socket){
            this.socket.disconnect(silent);
        } else {
            CLIENTMAP[this.remoteServer].emit('looseHandShake', {
                client: this.originClient,
                originServer: this.originServer
            });
        }
    }

    onForeign = (payload) =>{
        const {eventName, data} = payload;
        this.events[eventName](data);
    }

    on = (eventName, callback) => {
        if(!this.socket){
            this.events[eventName] = callback;
        } else {
            this.socket.on(eventName, async data =>{
                if(!this.remoteServer){
                    await callback(data);
                } else {
                    // we need to call the remote foreign socket
                    CLIENTMAP[this.originServer].emit('transitEvent', {
                        eventName,
                        data,
                        originClient: this.originClient
                    });
                }
            });
        }
    }
}

const SwarmLocal = (socket) => {    
    const locustSocket = new LocusSocket(socket, localSocketId, null);
    return locustSocket;
}

const SwarmForeign = (originServer, client) => {    
    const locustSocket = new LocusSocket(null, originServer, client);
    return locustSocket;
}

const InitSwarm = async (application, url, io, onConnection, auth) => {
    const redisInstance = new Redis();
    const instanceKey = `${application}:instances`;
    const listOfServers = await redisInstance.smembers(instanceKey);

    // generate clients

    const localDataInfo = `${url}|${localSocketId}`;
    await redisInstance.sadd(instanceKey, localDataInfo);

    await Promise.all(listOfServers.map(async (data)=> await addNewInstance(data, localDataInfo)));

    io.on("connection", async (socket)=>{

        let token = socket.handshake.query.token;

        if(token && token !== 'serverConnection') {
            if(auth(token)){
                const lsocket = SwarmLocal(socket);
                onConnection(lsocket);
            } else {
                socket.disconnect();
            }
            return;
        }

        // server connection
        socket.on('serverInstance', async data=>{
            await addNewInstance(data, null);
        });

        //server connection
        socket.on('swarmHandShake', async data =>{
            const {client, originServer} = data;
            // generate a foreign socket and connect it.
            let foreignSock = SwarmForeign(originServer, client);
            await onConnection(foreignSock);
        });
    });

    // broadcast your own presence to them
}

const addNewInstance = async (data, localData)=> {
    let parsed = data.split('|');
    let url = parsed[0];
    let key = parsed[1];

    if(key !== localSocketId){
        const client = new Socket(url);
        client.connect();
        client.on('connected', data=>{
            CLIENTMAP[key] = client;
            client.on('transit', onMessageClient);
            client.on('transitEvent', OnTransitEvent);

            if(localData)
                client.emit('serverInstance', localData);
        });

        client.on('disconnected', data=>{
            delete CLIENTMAP[key];
        });
    }
}

const onMessageClient = async (payload) => {
    const {eventName, data, originClient } = payload;
    SOCKETS[originClient]?.emit(eventName, data);
}

const OnTransitEvent = async (payload) => {
    const {eventName, data, originClient } = payload;
    SOCKETS[originClient]?.onForeign({
        eventName, data
    })
}

module.exports = InitSwarm;