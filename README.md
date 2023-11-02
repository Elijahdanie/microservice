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
$ mrn init --application <name>
```
edit the redis configuration to point to your redis server

## 2. Import and create Service

Import the createService function and call it to create a service
To make use of the decorators, you'll need to provide a dependency manager like typdi in the createService function
```typescript
import {createService} from 'microservice-redis-net';
import Container from 'typedi';

// example
const exampleService = createService (Container);
```

You can also pass in a config object if the config file is not in the root directory
```typescript
import {createService} from 'microservice-redis-net';
import Container from 'typedi'

// example
const exampleService = createService (Container, {
    application: "example",
    service: "example-service",
    broker: 'redi' | 'rabbitmq',
    queue: {
        server: {
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
$ npx mrn pull
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

// can as well make a custom call
import { Service } from 'microservice-redis-net';
Service.instance.call(exampleSubscribe, {data: "example data"});

// Can also invoke with the type function exampleSubscribe
// invoke the event Subscribed
Service.instance.Invoke(exampleSubscribe, {data: "example data"});

// or subscribe via the type function exampleSubscribe
Service.instance.hook(exampleSubscribe, (args)=>{
    console.log('recieved job', args);
    return {status: "ok"};
});
```
Using the types generated from the cli tool gives you access to parameters for the functions

You can also specify an event from the auto generated code in the subscribe function
```typescript
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
- This package is still in beta and not very stable for production environment, it might undergo few changes in future iterations

- If you're using typescript, you need to enable the experimentalDecorators and emitDecoratorMetadata compiler options in your tsconfig.json file.

- Run mrn init to generate a config file so you can manage your configuration in one place

- Run mrn pull to generate a client file to invoke functions

- To make use of the decorators efficiently, you'll need to use a dependency injection manager, this package supports typedi

