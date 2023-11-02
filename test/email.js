const {createService} = require('../index');

let artifialPromise = (data)=>{
    return new Promise((resolve, reject)=>{
        setTimeout(() => {
            resolve(data);
        }, 3000);
    })
}

(async ()=>{
    const emailService = await createService(null,{
        service: 'email',
        application: 'mrn-application',
    });

    await emailService.subscribe('createUser', async (data)=>{
        console.log("sending welcome mail on created User", data.name);
        // send mail
    });

    await emailService.registerFunction(async function sendMail (data){
        await artifialPromise(data);
        console.log("sending regular mail to", data.to);
        // send mail
    });

    await emailService.registerFunction(async function getMail (data){
        await artifialPromise(data);
        console.log("result");
        // find a way to send a response back to the caller
        return 'mail found';
    });

    await emailService.subscribe('broadcast', async (data)=>{
        console.log("emailService recieved on broadcast", data);
    });
})()
