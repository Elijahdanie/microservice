const exec = require('child_process').exec;

const Service = require('../index');

const logger = new Service('logger');

(async ()=>{
    await logger.subscribe('sendMail', async (data)=>{
        console.log("logged mail", data);
    });

    await logger.send('email', 'sendMail',{
        to: 'youremail@email.com',
        subject: 'Hello',
        text: 'Hello world',
        html: '<b>Hello world</b>'
    });
    console.log("sent mail");
})()

