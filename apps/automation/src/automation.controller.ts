import { Controller, Get, Param } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller()
export class AutomationController {
  constructor(private readonly jobsService: AutomationService) {}

  @Get('add')
  async addJob() {
    // await this.jobsService.addJob({ data: "name" });
    const data = [];

    data.push(await this.jobsService.addDelayedJob({ data: 'delayed' }, 5000));
    data.push(await this.jobsService.addDelayedJob({ data: 'delayed' }, 15000));
    return data;
  }

  @Get('remove/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.jobsService.removeJob(jobId);
  }

  @Get('resch/:id')
  async rescheduleJob(@Param('id') jobId: string) {
    return await this.jobsService.rescheduleJob(
      jobId,
      { data: 're scheduled' },
      10000,
    );
  }
  // @Post('add-delayed')
  // async addDelayedJob(@Body() body: { data: any; delay: number }) {
  //   await this.jobsService.addDelayedJob(body.data, body.delay);
  // }

  // @Post('add-priority')
  // async addPriorityJob(@Body() body: { data: any; priority: number }) {
  //   await this.jobsService.addPriorityJob(body.data, body.priority);
  // }

  // @Post('add-scheduled')
  // async addScheduledJob(@Body() body: { data: any; cronExpression: string }) {
  //   await this.jobsService.addScheduledJob(body.data, body.cronExpression);
  // }
  @Get('/')
  async getJobs() {
    return await this.jobsService.getJobsInfo();
  }
}
