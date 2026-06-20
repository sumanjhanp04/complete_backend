import { Controller, Get, Param } from '@nestjs/common';
import { AutomationService } from './automation.service';

/*
|--------------------------------------------------------------------------
| Automation Controller
|--------------------------------------------------------------------------
| Handles HTTP requests related to automation jobs.
| It calls methods from AutomationService.
|--------------------------------------------------------------------------
*/

@Controller()
export class AutomationController {
  /*
  |--------------------------------------------------------------------------
  | Dependency Injection
  |--------------------------------------------------------------------------
  | NestJS automatically injects AutomationService here.
  |--------------------------------------------------------------------------
  */
  constructor(private readonly jobsService: AutomationService) {}

  /*
  |--------------------------------------------------------------------------
  | GET /add
  |--------------------------------------------------------------------------
  | Creates two delayed jobs:
  | 1. Runs after 5 seconds
  | 2. Runs after 15 seconds
  |--------------------------------------------------------------------------
  |
  | Example:
  | http://localhost:3000/add
  |
  */
  @Get('add')
  async addJob() {
    const data = [];

    // Add job that will execute after 5 seconds
    data.push(
      await this.jobsService.addDelayedJob(
        { data: 'delayed' },
        5000,
      ),
    );

    // Add job that will execute after 15 seconds
    data.push(
      await this.jobsService.addDelayedJob(
        { data: 'delayed' },
        15000,
      ),
    );

    return data;
  }

  /*
  |--------------------------------------------------------------------------
  | GET /remove/:id
  |--------------------------------------------------------------------------
  | Removes a job from queue using Job ID.
  |--------------------------------------------------------------------------
  |
  | Example:
  | http://localhost:3000/remove/123
  |
  */
  @Get('remove/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.jobsService.removeJob(jobId);
  }

  /*
  |--------------------------------------------------------------------------
  | GET /resch/:id
  |--------------------------------------------------------------------------
  | Reschedules an existing job.
  |--------------------------------------------------------------------------
  |
  | Steps:
  | 1. Remove old job
  | 2. Create new job
  | 3. New delay = 10 seconds
  |
  | Example:
  | http://localhost:3000/resch/123
  |
  */
  @Get('resch/:id')
  async rescheduleJob(@Param('id') jobId: string) {
    return await this.jobsService.rescheduleJob(
      jobId,
      {
        data: 're scheduled',
      },
      10000,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | GET /
  |--------------------------------------------------------------------------
  | Returns information about all jobs in queue.
  |--------------------------------------------------------------------------
  |
  | Example:
  | http://localhost:3000/
  |
  */
  @Get('/')
  async getJobs() {
    return await this.jobsService.getJobsInfo();
  }

  /*
  |--------------------------------------------------------------------------
  | Future APIs (Currently Commented)
  |--------------------------------------------------------------------------
  |
  | POST /add-delayed
  | POST /add-priority
  | POST /add-scheduled
  |
  | These can be enabled later.
  |--------------------------------------------------------------------------
  */

  // @Post('add-delayed')
  // async addDelayedJob(@Body() body: { data: any; delay: number }) {
  //   await this.jobsService.addDelayedJob(body.data, body.delay);
  // }

  // @Post('add-priority')
  // async addPriorityJob(@Body() body: { data: any; priority: number }) {
  //   await this.jobsService.addPriorityJob(body.data, body.priority);
  // }

  // @Post('add-scheduled')
  // async addScheduledJob(
  //   @Body() body: {
  //     data: any;
  //     cronExpression: string;
  //   },
  // ) {
  //   await this.jobsService.addScheduledJob(
  //     body.data,
  //     body.cronExpression,
  //   );
  // }
}