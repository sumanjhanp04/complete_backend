import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class AutomationService {
  constructor(@InjectQueue('jobQueue2') private jobQueue: Queue) {}

  async addJob(data: any): Promise<string> {
    const job = await this.jobQueue.add('jobName', data, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
    return job.id;
  }

  async addDelayedJob(data: any, delay: number): Promise<string> {
    const job = await this.jobQueue.add('delayedJob', data, {
      delay, // Delay in milliseconds
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
    return job.id;
  }

  async addPriorityJob(data: any, priority: number): Promise<string> {
    const job = await this.jobQueue.add('priorityJob', data, {
      priority,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
    return job.id;
  }

  // async addScheduledJob(data: any, cronExpression: string): Promise<string> {
  //   const job = await this.jobQueue.add('scheduledJob', data, {
  //     repeat: { cron: cronExpression },
  //     attempts: 3,
  //     backoff: {
  //       type: 'fixed',
  //       delay: 5000,
  //     },
  //   });
  //   return job.id;
  // }

  async removeJob(jobId: string) {
    const job = await this.jobQueue.getJob(jobId);
    if (job) {
      await job.remove();
    } else {
      throw new Error(`Job with ID ${jobId} not found`);
    }
  }

  async pauseQueue() {
    await this.jobQueue.pause();
  }

  async resumeQueue() {
    await this.jobQueue.resume();
  }

  async rescheduleJob(
    jobId: string,
    newData: any,
    newDelay?: number,
    newCronExpression?: string,
  ): Promise<string> {
    const job = await this.jobQueue.getJob(jobId);
    if (job) {
      // Remove the existing job
      await job.remove();

      // Re-add the job with new data and schedule
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
        options.repeat = { cron: newCronExpression };
      }

      const newJob = await this.jobQueue.add(job.name, newData, options);
      return newJob.id;
    } else {
      throw new Error(`Job with ID ${jobId} not found`);
    }
  }

  async getJobsInfo() {
    const jobs = {
      active: await this.jobQueue.getJobs(['active']),
      waiting: await this.jobQueue.getJobs(['waiting']),
      completed: await this.jobQueue.getJobs(['completed']),
      failed: await this.jobQueue.getJobs(['failed']),
    };
    return jobs;
  }
}
