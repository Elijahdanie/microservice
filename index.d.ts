import Bull, { Job, QueueOptions } from 'bull';

interface JobRequest {
    path: string;
    data: any;
  }

declare class Service {
  queue: Bull.Queue;
  handlers: {
    [path: string]: (job: JobRequest) => Promise<any>;
  };

  constructor(name: string, config?: QueueOptions);

  registerHandler(path: string, handler: (job: JobRequest) => Promise<any>): Promise<void>;

  send(path: string, data: any, options?: Bull.JobOptions): Promise<void>;
}

export = Service;
