
const Service = require('../index');

const logger = new Service('logger');

(async ()=>{
    await logger.subscribe('createUser', async (data)=>{
        console.log("logged user created", data.name);
    });
    await logger.subscribe('sendMail', async (data)=>{
        console.log("logged mail sent to", data.to);
    });
    await logger.subscribe('broadcast', async (data)=>{
        console.log("logger recieved on broadcast", data);
    });
})()

