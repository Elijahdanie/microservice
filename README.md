# microservice-redis-net

[![npm version](https://badge.fury.io/js/microservice-redis-net.svg)](https://www.npmjs.com/package/microservice-redis-net)

# USAGE

A simple wrapper around redis pub/sub to allow for easy microservice communication.

To autogenerate code from services install the cli tool
```bash
$ npm install mrn-cli
```

## 1. Install

```bash
$ npm install microservice-redis-net
$ yarn add microservice-redis-net
```

## 2. Import

```typescript
import Service from 'microservice-redis-net';
```

## 3. Register Handler
Register a route on a service to recieve jobs sent to that route.
```typescript

const emailService = new Service("email");

// register handler by string route
emailService.registerHandler("/email", async (args)=>{
    console.log('recieved job', args);
    return {status: "ok"};
});

// register hander by named function
emailService.registerFunction(async function email (args)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});

// register by decorator
import {serviceFunction} from 'microservice-redis-net';

class Emailer {

    @serviceFunction
    email(args){
        console.log('recieved job', job);
        return {status: "ok"};
    }
}

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
subscriber.subscribe("/email", (args)=>{
    console.log('recieved job', args);
    return {status: "ok"};
});

// subscribe using decorator
import {subscribeFunction} from 'microservice-redis-net';

class Subscriber {

    @subscribeFunction
    email(args){
        console.log('recieved job', job);
        return {status: "ok"};
    }
}
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