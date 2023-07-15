const {createService} = require('../index');

class getMail {
    to = "";
    subject = "";
    body = "";
}

(async ()=>{

    const storeBuilder = await createService({
        service: 'storeBuilder',
        application: 'mrn-application'
    });

    await storeBuilder.subscribe('broadcast', async (data)=>{
        console.log("store Builder recieved on broadcast", data);
    });

    await storeBuilder.subscribe('createUser', async (data)=>{
        console.log("Building store for", data.name);

        setTimeout(async() => {
            await vgetMail(10, data);
        }, 2000);
        // send mail
    });

    async function sendMail(count, data){
        const result = await storeBuilder.send('email','sendMail', {
            to: data.email,
            subject: "Welcome to our service",
            body: "Your store is ready"
        });
        console.log("result", result);
        if(count === 0) return;
        await sendMail(count--, data);
    }
    
    async function vgetMail(count, data){
        storeBuilder.call('email', getMail, {
            to: data.email,
            subject: "Welcome to our service",
            body: "Your store is ready"
        });
        console.log("rapidly finnishings");
        if(count === 0) return;
        count--;
        await vgetMail(count, data);
    }
})()
