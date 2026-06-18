import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('jobQueue2')
export class AutomationProcessor extends WorkerHost {
  private logger = new Logger(AutomationProcessor.name);
  async process(job: Job<any, any, string>): Promise<any> {


    // Perform the job task
    if (job.name === 'jobName') {
      this.logger.log('Handling jobName:', job.data);
    } else if (job.name === 'delayedJob') {
      this.logger.log('Handling delayedJob:', job.data);
    } else if (job.name === 'priorityJob') {
      this.logger.log('Handling priorityJob:', job.data);
    } else if (job.name === 'scheduledJob') {
      this.logger.log('Handling scheduledJob:', job.data);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has been completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.log(`Job ${job.id} has failed with ${err.message}`);
  }
}
