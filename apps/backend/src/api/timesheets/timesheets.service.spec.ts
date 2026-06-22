import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetsService } from './timesheets.service';

/*
|--------------------------------------------------------------------------
| TimesheetsService Unit Test
|--------------------------------------------------------------------------
|
| This file tests the TimesheetsService.
|
| Purpose:
| - Verify service creation
| - Test business logic methods
| - Ensure dependencies are loaded correctly
|
|--------------------------------------------------------------------------
*/

describe('TimesheetsService', () => {
  /*
  |--------------------------------------------------------------------------
  | Service Instance
  |--------------------------------------------------------------------------
  |
  | This variable stores the service object that
  | will be tested throughout the test suite.
  |
  |--------------------------------------------------------------------------
  */
  let service: TimesheetsService;

  /*
  |--------------------------------------------------------------------------
  | Setup Before Each Test
  |--------------------------------------------------------------------------
  |
  | Runs before every test case.
  |
  | Creates a NestJS Testing Module and registers:
  | - TimesheetsService
  |
  |--------------------------------------------------------------------------
  */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        /*
        |--------------------------------------------------------------------------
        | Service Under Test
        |--------------------------------------------------------------------------
        */
        TimesheetsService,
      ],
    }).compile();

    /*
    |--------------------------------------------------------------------------
    | Get Service Instance
    |--------------------------------------------------------------------------
    |
    | Retrieve the service from NestJS dependency
    | injection container.
    |
    |--------------------------------------------------------------------------
    */
    service = module.get<TimesheetsService>(
      TimesheetsService,
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Test Case: Service Should Exist
  |--------------------------------------------------------------------------
  |
  | Verifies that NestJS successfully creates
  | the service instance.
  |
  |--------------------------------------------------------------------------
  */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});