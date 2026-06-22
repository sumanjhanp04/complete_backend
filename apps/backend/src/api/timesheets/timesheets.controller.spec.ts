import { Test, TestingModule } from '@nestjs/testing';
import { TimeSheetsController } from './timesheets.controller';
import { TimeSheetsService } from './timesheets.service';

/*
|--------------------------------------------------------------------------
| TimesheetsController Unit Test
|--------------------------------------------------------------------------
|
| This file tests the TimesheetsController.
| It ensures that the controller is properly created
| and available in the NestJS testing module.
|
|--------------------------------------------------------------------------
*/

describe('TimesheetsController', () => {
  // Controller instance that will be tested
  let controller: TimeSheetsController;

  /*
  |--------------------------------------------------------------------------
  | Setup Before Each Test
  |--------------------------------------------------------------------------
  |
  | Runs before every test case.
  | Creates a testing module and loads:
  | - TimesheetsController
  | - TimesheetsService
  |
  |--------------------------------------------------------------------------
  */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // Register controller to test
      controllers: [TimeSheetsController],

      // Register required service dependency
      providers: [TimeSheetsService],
    }).compile();

    // Get controller instance from testing module
    controller = module.get<TimeSheetsController>(TimeSheetsController);
  });

  /*
  |--------------------------------------------------------------------------
  | Test Case: Controller Should Exist
  |--------------------------------------------------------------------------
  |
  | Checks whether the controller was successfully
  | created by NestJS.
  |
  |--------------------------------------------------------------------------
  */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});