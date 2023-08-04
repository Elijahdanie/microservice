import Bull, { Job, QueueOptions } from 'bull';

interface JobRequest {
    func: string;
    data: any;
}

  interface ServiceConfig {
    application: string,
    service?: string,
    queue?: QueueOptions
  }

  //declare a decorator


declare class Service {
  queue: Bull.Queue;
  static instance: Service;
  // handlers: {
  //   [path: string]: (job: JobRequest) => Promise<any>;
  // };

  constructor(config?: ServiceConfig);

  /**
   * register a handler for a function
   * @param path 
   * @param handler 
   */
  registerHandler(func: string, handler: (...args) => any): Promise<void>;

  registerFunction(handler: (...args) => any): Promise<void>;
  
  invokeEvent(func: string, data: any): Promise<Job<any>>;

  Invoke <T>(route: new()=>T, data: T): Promise<void>;

  subscribe(func: string, handler: (data: any) => Promise<any>): Promise<void>;

  send(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;

  sendDecorator(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;

  subscribe <T>(route: new()=>T, callback: (data: T) => Promise<void>): Promise<void>;

  call <T>(service: string, route: new()=>T, data: T): Promise<void>;
}

declare function serviceFunction(
  target: any,
  name: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;

declare function subscribeFunction<T>(instance: new ()=>T): (target: any, name: string, descriptor: PropertyDescriptor) => PropertyDescriptor;



/**
 * set sync to true if you're using decorators
 * @param sync 
 * @param config 
 */
declare function createService(container: any, config?: ServiceConfig): Service;
export {Service, createService, serviceFunction, subscribeFunction};