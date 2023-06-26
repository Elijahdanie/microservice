const exec = require('child_process').exec;

const Service = require('../index');

const emailService = new Service('email');

(async ()=>{
    await emailService.registerHandler('sendMail', async (data)=>{
        console.log("got Mail", data);
    });
})()

