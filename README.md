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

## 2. Configuration

With the cli tool you can run the follow command on the terminal to generate a config file.
```bash
$ mrn init <application-name>
```
edit the redis configuration to point to your redis server

## 2. Import and create Service

```typescript
import {createService} from 'microservice-redis-net';

// example 
createService ();
```

yopu can also pass in a config object
```typescript
import {createService} from 'microservice-redis-net';

// example
createService ({
    application: "example",
    service: "example-service",
    queue:{
        redis:{
            host: "localhost",
            port: 6379
        }
    }
});
```

Bind the decorators to your class methods
```typescript
import {createService, registerFunction, subscribeFunction} from 'microservice-redis-net';

createService ();

class ExampleService {

    @registerFunction
    async exampleFunction (id: string, name: string, created: boolean){
        console.log('recieved job', id, name, created);
        return {status: "ok"};
    }

    @subscribeFunction
    async exampleSubscribe (args){
        console.log('recieved job', args);
        return {status: "ok"};
    }
}
```

## 3. Invoke functions
 using mrn-cli run the following command to generate a client

```bash
$ mrn pull
```

Import the client and invoke the function
```typescript

import example, {exampleSubscribe} from './mrn-application/example';

// call service function
exmple.exampleFunction({data: "example data"})
    .then((result) => {
        console.log('result', result);
    })
    .catch((err) => {
        console.log('error', err);
    });

// invoke the event Subscribed
example.Invoke(exampleSubscribe, {data: "example data});


// can also specify an event from the auto generated code
class ExampleService {

    @subscribeFunction(exampleSubscribe)
    async hookEVent(args: any){
        console.log('recieved job', job);
        return {status: "ok"};
    }
}
```


## Other Features
If you're not making use of decoratorsm, the following apis are also available
to you

```typescript
import {createService} from 'microservice-redis-net';

const service = createService ();

service.registerFunction(async function exampleFunction(id:string, user:any)=>{
    console.log('recieved job', job);
    return {status: "ok"};
});
// register a function with a route
service.registerHandler('route', async (args)=>{
    console.log('recieved job', args;
    return {status: "ok"};
});
// subscribe to an event or function
service.subscribe('event_route', async (args)=>{
    console.log('recieved job', args);
    return {status: "ok"};
});
//send a job to the service
await service.send('service', 'route', {data: "exampledata"});
//invoke event
await service.invokeEvent('event_route', {data: "exampledata"});
```

## NOTE
- If you're using typescript, you need to enable the experimentalDecorators and emitDecoratorMetadata compiler options in your tsconfig.json file.

- Run mrn init to generate a config file so you can manage your configuration in one place

- Run mrn pull to generate a client file to invoke functions
