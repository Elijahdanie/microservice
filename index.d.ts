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

  declare const _default: Service;

declare class Service {
  queue: Bull.Queue;
  instance: Service;
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

  subscribe(func: string, handler: (data: any) => Promise<any>): Promise<void>;

  send(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;

  sendDecorator(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;
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
declare function createService(config?: ServiceConfig): Service;
export default _default;
export as namespace module;
export {createService, serviceFunction, subscribeFunction};
