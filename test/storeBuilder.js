const Service = require('../index');

const storeBuilder = new Service('storeBuilder');

(async ()=>{

    await storeBuilder.subscribe('broadcast', async (data)=>{
        console.log("store Builder recieved on broadcast", data);
    });

    await storeBuilder.subscribe('createUser', async (data)=>{
        console.log("Building store for", data.name);

        setTimeout(async() => {
            await storeBuilder.send('email','sendMail', {
                to: data.email,
                subject: "Welcome to our service",
                body: "Your store is ready"
            });
        }, 10000);
        // send mail
    });
})()
