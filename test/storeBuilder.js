const {createService} = require('../index');

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
            await getMail(10, data);
        }, 1000);
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
    
    async function getMail(count, data){
        const result = await storeBuilder.send('email','getMail', {
            to: data.email,
            subject: "Welcome to our service",
            body: "Your store is ready"
        });
        console.log("result", result, count);
        if(count === 0) return;
        count--;
        await getMail(count, data);
    }
})()
