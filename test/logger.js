
const {createService} = require('../index');


(async ()=>{

    const logger = await createService(null,{
        service: 'logger',
        application: 'mrn-application'
    });

    await logger.subscribe('createUser', async (data)=>{
        //console.log("logged user created", data.name);
    });
    await logger.subscribe('sendMail', async (data)=>{
        console.log("logged mail sent to", data.to);
        //await artifialPromise(data);
    });
    await logger.subscribe('broadcast', async (data)=>{
        console.log("logger recieved on broadcast", data);
    });
})()

