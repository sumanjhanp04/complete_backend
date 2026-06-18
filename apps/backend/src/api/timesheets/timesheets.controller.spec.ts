import { Test, TestingModule } from '@nestjs/testing';
import { TimeSheetsController } from './timesheets.controller';
import { TimeSheetsService } from './timesheets.service';

describe('TimesheetsController', () => {
  let controller: TimeSheetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSheetsController],
      providers: [TimeSheetsService],
    }).compile();

    controller = module.get<TimeSheetsController>(TimeSheetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
