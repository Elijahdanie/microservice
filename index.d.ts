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
   * register a handler for a function with a string key
   * @param path 
   * @param handler 
   */
  registerHandler(func: string, handler: (...args: any) => any): Promise<void>;


  /**
   * register a handler via named function
   * @param path
   * @param handler
   */
  registerFunction(handler: (...args: any) => any): Promise<void>;
  
  /**
   * Invokes an event and passes argument data
   * @param func
   * @param data
   */
  invokeEvent(func: string, data: any): Promise<Job<any>>;

  /**
   * Invokes an event and passes argument data by type T
   * @param route
   * @param data
   */
  Invoke <T>(route: new()=>T, data: T): Promise<void>;

  /**
   * Subscribes to a function via string key
   * @param func
   * @param handler
   */
  subscribe(func: string, handler: (data: any) => Promise<any>): Promise<void>;

  /**
   * Sends a message to a service via string key
   * @param service
   * @param func
   * @param data
   * @param options
   */
  send(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;

  sendDecorator(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;

  subscribe <T>(route: new()=>T, callback: (data: T) => Promise<void>): Promise<void>;

  call <T>(service: string, route: new()=>T, data: T, isCallback?: boolean): Promise<void>;
}

declare function serviceFunction(
  target: any,
  name: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor;

declare function subscribeFunction<T>(instance: new ()=>T): (target: any, name: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

declare function createService(container: any, config?: ServiceConfig): Service;

export {Service, createService, serviceFunction, subscribeFunction};