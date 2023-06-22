

# USAGE

## 1. Install

```bash
$ npm install microservice-redis-net
```

## 2. Import

```typescript
const Service  = require('microservice-redis-net');

const service = new Service("service-name");

// register handler
service.registerHandler("/email", async (job: JobRequest)=>{
    // do something
});

//send message
service.send("service-name", "/email", {
    to: "example@email.com",
    subject: "Hello",
    body: "Hello World"
})

```