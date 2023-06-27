const Service = require('../index');

const emailService = new Service('email');

(async ()=>{
    await emailService.subscribe('createUser', async (data)=>{
        console.log("sending welcome mail on created User", data.name);
        // send mail
    });

    await emailService.registerHandler('sendMail', async (data)=>{
        console.log("sending regular mail to", data.to);
        // send mail
    });

    await emailService.subscribe('broadcast', async (data)=>{
        console.log("emailService recieved on broadcast", data);
    });
})()
