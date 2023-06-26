# microservice-redis-net

[![npm version](https://badge.fury.io/js/microservice-redis-net.svg)](https://www.npmjs.com/package/microservice-redis-net)

# USAGE

This is a simple microservice library that uses redis pub/sub to allow services to communicate with each other in a simple way.
A service can have multiple functions registered to it, and a function can have multiple,services registered to it.
Service run on a single redis instance, so you can have multiple services running on different machines, and they will all be able to communicate with each other.
A service runs on a single process so you cannot have multiple services running on the same process

## 1. Install

```bash
$ npm install microservice-redis-net
```

## 2. Import

```typescript
import Service from 'microservice-redis-net';
```

## 3. Register Handler
Register a function on a service to recieve jobs sent to that function.
```typescript

const reciever = new Service("reciever");

// register handler
reciever.registerHandler("/email", async (job: JobRequest)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});

```

## 4. Send Job
You can send a data to a specific function on a service
```typescript
const sender = new Service("sender");

// send job
sender.send("reciever", "/email", {
    to: "example@email.com",
    subject: "Hello",
    body: "Hello World"
})
```

## 5. Subscribe to Function
You can subscribe to a function and recieve all jobs sent to that function.
```typescript
const subscriber = new Service("subscriber");

// subscribe to job
subscriber.subscribe("/email", (job: JobRequest)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});
```

## 6. Invoke Function
This invokes the function "/email" and sends the data for all subscribers to recieve,
if you want to send a job to a specific service use the send function.
```typescript
subscriber.invoke("/email", {
    to: "example@email.com",
    subject: "Hello",
    body: "Hello World"
});
