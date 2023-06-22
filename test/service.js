const exec = require('child_process').exec;

const Service = require('../index');

const service = new Service('test');

//start redis server
exec('redis-server');

(async ()=>{
    await service.registerHandler('test', async (data)=>{
        console.log("processed data", data);
    });
    
    await service.sendData('test', 'test', {test: true});
})()

