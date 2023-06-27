# microservice-redis-net

# microservice-redis-net

[![npm version](https://badge.fury.io/js/microservice-redis-net.svg)](https://www.npmjs.com/package/microservice-redis-net)

# USAGE

This is a simple microservice library that uses redis pub/sub to allow services to communicate with each other in a simple way.
Preferable to have all your services connected to a single redis instance, so you can have multiple services running on different machines, and they will all be able to communicate with each other.
You can only register handlers for one service on a single node instance, so you cannot have multiple services running on the same node instance.

## 1. Install

```bash
$ npm install microservice-redis-net
```

## 2. Import

```typescript
import Service from 'microservice-redis-net';
```

## 3. Register Handler
Register a route on a service to recieve jobs sent to that route.
```typescript

const emailService = new Service("email");

// register handler
emailService.registerHandler("/email", async (job: JobRequest)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});

```

## 4. Send Job to Route
You can send a data to a specific route on a service
```typescript
const sender = new Service("sender");

// send job
sender.send("reciever", "/email", {
    to: "example@email.com",
    subject: "Hello",
    body: "Hello World"
})
```

## 5. Subscribe to Route
You can subscribe to a route and recieve all jobs sent to that route.
```typescript
const subscriber = new Service("subscriber");

// subscribe to job
subscriber.subscribe("/email", (job: JobRequest)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});
```

## 6. Invoke Event
You can invoke an event on a service, and all subscribers to that event will recieve the data.
```typescript
const storeBuilder = new Service("builder");

// invoke event
storeBuilder.invokeEvent("builtStore", {
    storeId: "1234",
    storeName: "My Store"
})

const emailService = new Service("email");

// subscribe to event
emailService.subscribe("builtStore", (data: any)=>{
    console.log('recieved event on builtStore', data);
    // send email to store owner
});
```
```
