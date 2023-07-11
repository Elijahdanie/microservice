import Bull, { Job, QueueOptions } from 'bull';

interface JobRequest {
    func: string;
    data: any;
  }

declare class Service {
  queue: Bull.Queue;
  handlers: {
    [path: string]: (job: JobRequest) => Promise<any>;
  };

  constructor(name: string, config?: QueueOptions);

  /**
   * register a handler for a function
   * @param path 
   * @param handler 
   */
  registerHandler(func: string, handler: (data: any) => Promise<any>): Promise<void>;
  
  invokeEvent(func: string, data: any): Promise<Job<any>>;

  subscribe(func: string, handler: (data: any) => Promise<any>): Promise<void>;
  
  send(service: string, func: string, data: any, options?: Bull.JobOptions): Promise<void>;
}

export = Service;
