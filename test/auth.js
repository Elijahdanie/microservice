const {createService} = require('../index');
const http = require('http');
const authService = createService(null, {
    service: 'auth',
    application: 'mrn-application'
});

class createUser {
    name = "";
    email = "";
    password = "";
}

authService.subscribe('broadcast', async (data)=>{
    console.log("Auth recieved on broadcast", data);
});

http.createServer(async (req, res) => {
    switch(req.url){
        case '/register':
            // get request body
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                let userdata = JSON.parse(body);
                await authService.Invoke(createUser, userdata);
                res.end("User Created");
            });
            break;
        case '/broadcast':
            await authService.invokeEvent('broadcast', 'Hello World');
            res.end("Broadcasted");
            break;
        default:
            res.end("Not Found");
    }
}).listen(3001, ()=>{
    console.log("Server started at 3001");
});