import Queue from 'bull';

export default class Service {

    queue: Queue.Queue;
    handlers: {
        [x:string]: (job: JobRequest)=>Promise<any>
    }

    constructor(name: string){
        this.queue = new Queue(name);
        this.queue.process(async (job: Queue.Job<JobRequest>)=>{
            const handler = this.handlers[job.data.path];
            if(handler){
                return handler(job.data);
            }
        })
    }

    /**
     * Register a handler for a path
     * @param path 
     * @param handler 
     */
    async registerHandler(path: string, handler: (job: JobRequest)=>Promise<any>){
        this.handlers[path] = handler;
    }

    /**
     * Send data to a service
     * @param service 
     * @param path 
     * @param data 
     */
    async sendData(service: string, path: string, data: any){
        let queue = new Queue(service);
        await queue.add({path, data});
    }
}


export interface JobRequest {
    path: string;
    data: any
}
