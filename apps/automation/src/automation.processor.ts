import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/*
|--------------------------------------------------------------------------
| Processor Registration
|--------------------------------------------------------------------------
|
| Listen to queue: jobQueue2
|
| Any job added to jobQueue2 can be processed here.
|
|--------------------------------------------------------------------------
*/
@Processor('jobQueue2')
export class AutomationProcessor extends WorkerHost {

  /*
  |--------------------------------------------------------------------------
  | NestJS Logger
  |--------------------------------------------------------------------------
  |
  | Used for printing logs in terminal.
  |
  |--------------------------------------------------------------------------
  */
  private logger = new Logger(AutomationProcessor.name);

  /*
  |--------------------------------------------------------------------------
  | Main Job Handler
  |--------------------------------------------------------------------------
  |
  | Automatically called whenever a job reaches this worker.
  |
  |--------------------------------------------------------------------------
  */
  async process(job: Job<any, any, string>): Promise<any> {

    // Print job details
    this.logger.log(`Processing Job ID: ${job.id}`);
    this.logger.log(`Job Name: ${job.name}`);
    this.logger.log(`Job Data: ${JSON.stringify(job.data)}`);

    /*
    |--------------------------------------------------------------------------
    | Job Type : jobName
    |--------------------------------------------------------------------------
    */
    if (job.name === 'jobName') {
      this.logger.log(`Handling jobName`);
      this.logger.log(job.data);

      // business logic here
    }

    /*
    |--------------------------------------------------------------------------
    | Job Type : delayedJob
    |--------------------------------------------------------------------------
    */
    else if (job.name === 'delayedJob') {
      this.logger.log(`Handling delayedJob`);
      this.logger.log(job.data);

      // delayed task logic here
    }

    /*
    |--------------------------------------------------------------------------
    | Job Type : priorityJob
    |--------------------------------------------------------------------------
    */
    else if (job.name === 'priorityJob') {
      this.logger.log(`Handling priorityJob`);
      this.logger.log(job.data);

      // priority task logic here
    }

    /*
    |--------------------------------------------------------------------------
    | Job Type : scheduledJob
    |--------------------------------------------------------------------------
    */
    else if (job.name === 'scheduledJob') {
      this.logger.log(`Handling scheduledJob`);
      this.logger.log(job.data);

      // cron/scheduled task logic here
    }

    /*
    |--------------------------------------------------------------------------
    | Unknown Job
    |--------------------------------------------------------------------------
    */
    else {
      this.logger.warn(`Unknown Job Type: ${job.name}`);
    }

    return {
      success: true,
      jobId: job.id,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Job Completed Event
  |--------------------------------------------------------------------------
  |
  | Runs automatically after successful execution.
  |
  |--------------------------------------------------------------------------
  */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Job ${job.id} has been completed successfully`,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Job Failed Event
  |--------------------------------------------------------------------------
  |
  | Runs automatically when a job throws an error.
  |
  |--------------------------------------------------------------------------
  */
  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} failed: ${err.message}`,
    );
  }
}