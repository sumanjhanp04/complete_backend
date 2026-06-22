import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class AutomationService {

  /*
  |--------------------------------------------------------------------------
  | Inject BullMQ Queue
  |--------------------------------------------------------------------------
  |
  | NestJS injects the queue named "jobQueue2"
  |
  */
  constructor(
    @InjectQueue('jobQueue2')
    private jobQueue: Queue,
  ) { }

  /*
  |--------------------------------------------------------------------------
  | Add Normal Job
  |--------------------------------------------------------------------------
  |
  | Creates a job immediately.
  |
  */
  async addJob(data: any): Promise<string> {
    const job = await this.jobQueue.add(
      'jobName',
      data,
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    );

    return job.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Add Delayed Job
  |--------------------------------------------------------------------------
  |
  | Executes after specified delay.
  |
  */
  async addDelayedJob(
    data: any,
    delay: number,
  ): Promise<string> {

    const job = await this.jobQueue.add(
      'delayedJob',
      data,
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    );

    return job.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Add Priority Job
  |--------------------------------------------------------------------------
  |
  | Lower number = Higher Priority
  |
  | priority: 1 => Highest
  | priority: 10 => Lower
  |
  */
  async addPriorityJob(
    data: any,
    priority: number,
  ): Promise<string> {

    const job = await this.jobQueue.add(
      'priorityJob',
      data,
      {
        priority,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    );

    return job.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Job
  |--------------------------------------------------------------------------
  |
  | Delete job by Job ID
  |
  */
  async removeJob(jobId: string) {

    const job = await this.jobQueue.getJob(jobId);

    if (job) {
      await job.remove();
      return {
        success: true,
        message: `Job ${jobId} removed`,
      };
    }

    throw new Error(
      `Job with ID ${jobId} not found`,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Pause Queue
  |--------------------------------------------------------------------------
  |
  | No jobs will execute
  |
  */
  async pauseQueue() {
    await this.jobQueue.pause();

    return {
      message: 'Queue paused',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Resume Queue
  |--------------------------------------------------------------------------
  |
  | Start processing jobs again
  |
  */
  async resumeQueue() {
    await this.jobQueue.resume();

    return {
      message: 'Queue resumed',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Reschedule Job
  |--------------------------------------------------------------------------
  |
  | 1. Find Job
  | 2. Remove Job
  | 3. Recreate Job
  |
  */
  async rescheduleJob(
    jobId: string,
    newData: any,
    newDelay?: number,
    newCronExpression?: string,
  ): Promise<string> {

    const job = await this.jobQueue.getJob(jobId);

    if (!job) {
      throw new Error(
        `Job with ID ${jobId} not found`,
      );
    }

    await job.remove();

    const options: any = {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    };

    if (newDelay) {
      options.delay = newDelay;
    }

    if (newCronExpression) {
      options.repeat = {
        cron: newCronExpression,
      };
    }

    const newJob = await this.jobQueue.add(
      job.name,
      newData,
      options,
    );

    return newJob.id;
  }

  /*
  |--------------------------------------------------------------------------
  | Get Queue Information
  |--------------------------------------------------------------------------
  |
  | Returns:
  | Active Jobs
  | Waiting Jobs
  | Completed Jobs
  | Failed Jobs
  |
  */
  async getJobsInfo() {

    return {
      active: await this.jobQueue.getJobs([
        'active',
      ]),

      waiting: await this.jobQueue.getJobs([
        'waiting',
      ]),

      completed: await this.jobQueue.getJobs([
        'completed',
      ]),

      failed: await this.jobQueue.getJobs([
        'failed',
      ]),
    };
  }
}