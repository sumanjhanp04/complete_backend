/**
 * ---------------------------------------------------------
 * NestJS Testing Utilities
 * ---------------------------------------------------------
 * Used to create a testing module similar to AppModule.
 */
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Service under test
 */
import { UserService } from './user.service';

/**
 * Used to mock Mongoose models
 */
import { getModelToken } from '@nestjs/mongoose';

/**
 * User schema/model
 */
import { User } from '@lib/database';

/**
 * Mongoose model type
 */
import { Model } from 'mongoose';

/**
 * JWT service used for token generation
 */
import { JwtService } from '@nestjs/jwt';

/**
 * bcrypt library used for password comparison
 */
import { bcrypt } from 'bcryptjs';

/**
 * Exceptions expected from login flow
 */
import {
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';

describe('UserService', () => {
    /**
     * Service instance
     */
    let service: UserService;

    /**
     * Mocked User Model
     */
    let userModel: Model<User>;

    /**
     * Mocked JWT Service
     */
    let jwtService: JwtService;

    /**
     * ---------------------------------------------------------
     * Runs before every test case
     * ---------------------------------------------------------
     * Creates a fresh testing module.
     */
    beforeEach(async () => {
        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    /**
                     * Actual service
                     */
                    UserService,

                    /**
                     * Mock User Model
                     */
                    {
                        provide: getModelToken(User.name),
                        useValue: {},
                    },

                    /**
                     * Mock JWT Service
                     */
                    {
                        provide: JwtService,
                        useValue: {},
                    },
                ],
            }).compile();

        /**
         * Get service instance
         */
        service = module.get<UserService>(UserService);

        /**
         * Get mocked User Model
         */
        userModel = module.get<Model<User>>(
            getModelToken(User.name),
        );

        /**
         * Get mocked JWT Service
         */
        jwtService = module.get<JwtService>(JwtService);
    });

    /**
     * ---------------------------------------------------------
     * Login Success Test
     * ---------------------------------------------------------
     * Scenario:
     * - Username exists
     * - Password matches
     * - Token generated
     * - User returned
     */
    it('should login with valid username and password', async () => {
        /**
         * Login request payload
         */
        const loginDto = {
            username: 'test',
            password: 'password',
        };

        /**
         * Mock database user
         */
        const user = {
            _id: '123',
            username: 'test',
            password: 'hashedPassword',
        };

        /**
         * Mock populated user
         */
        const validUser = {
            _id: '123',
            username: 'test',
        };

        /**
         * Mock User.findOne()
         */
        jest
            .spyOn(userModel, 'findOne')
            .mockResolvedValue(user);

        /**
         * Mock bcrypt password comparison
         */
        jest
            .spyOn(bcrypt, 'compare')
            .mockResolvedValue(true);

        /**
         * Mock populated user method
         */
        jest
            .spyOn(service, 'getPopulatedUser')
            .mockResolvedValue(validUser);

        /**
         * Mock JWT token generation
         */
        jest
            .spyOn(jwtService, 'sign')
            .mockReturnValue('token');

        /**
         * Execute login
         */
        const result =
            await service.loginUser(loginDto);

        /**
         * Verify returned response
         */
        expect(result).toEqual({
            user: validUser,
            token: 'token',
        });
    });

    /**
     * ---------------------------------------------------------
     * Invalid Username Test
     * ---------------------------------------------------------
     * Scenario:
     * User not found in database.
     *
     * Expected:
     * NotFoundException
     */
    it('should throw NotFoundException with invalid username', async () => {
        const loginDto = {
            username: 'invalid',
            password: 'password',
        };

        /**
         * User not found
         */
        jest
            .spyOn(userModel, 'findOne')
            .mockResolvedValue(null);

        /**
         * Expect login to fail
         */
        await expect(
            service.loginUser(loginDto),
        ).rejects.toThrowError(
            NotFoundException,
        );
    });

    /**
     * ---------------------------------------------------------
     * Invalid Password Test
     * ---------------------------------------------------------
     * Scenario:
     * Username exists
     * Password does NOT match
     *
     * Expected:
     * UnauthorizedException
     */
    it('should throw UnauthorizedException with valid username but invalid password', async () => {
        const loginDto = {
            username: 'test',
            password: 'wrongPassword',
        };

        const user = {
            _id: '123',
            username: 'test',
            password: 'hashedPassword',
        };

        /**
         * User exists
         */
        jest
            .spyOn(userModel, 'findOne')
            .mockResolvedValue(user);

        /**
         * Password comparison fails
         */
        jest
            .spyOn(bcrypt, 'compare')
            .mockResolvedValue(false);

        /**
         * Expect UnauthorizedException
         */
        await expect(
            service.loginUser(loginDto),
        ).rejects.toThrowError(
            UnauthorizedException,
        );
    });

    /**
     * ---------------------------------------------------------
     * Disabled User Test
     * ---------------------------------------------------------
     * Scenario:
     * User account is deactivated.
     *
     * Expected:
     * UnauthorizedException
     */
    it('should throw UnauthorizedException with deactivated user', async () => {
        const loginDto = {
            username: 'test',
            password: 'password',
        };

        const user = {
            _id: '123',
            username: 'test',
            password: 'hashedPassword',

            /**
             * Account disabled
             */
            status: false,
        };

        /**
         * Return disabled user
         */
        jest
            .spyOn(userModel, 'findOne')
            .mockResolvedValue(user);

        /**
         * Expect login failure
         */
        await expect(
            service.loginUser(loginDto),
        ).rejects.toThrowError(
            UnauthorizedException,
        );
    });

    /**
     * ---------------------------------------------------------
     * Employee Login Test
     * ---------------------------------------------------------
     * Scenario:
     * User type = Employee
     *
     * Service may fetch additional employee details
     * before generating response.
     */
    it('should return user and token with employee user type', async () => {
        const loginDto = {
            username: 'test',
            password: 'password',
        };

        /**
         * Employee user record
         */
        const user = {
            _id: '123',
            username: 'test',
            password: 'hashedPassword',

            /**
             * Indicates user belongs
             * to Employee collection
             */
            userIdRef: 'Employee',
        };

        /**
         * Populated user
         */
        const validUser = {
            _id: '123',
            username: 'test',
        };

        /**
         * Employee details
         */
        const details = {
            _id: '123',
            userId: '123',
        };

        /**
         * User found
         */
        jest
            .spyOn(userModel, 'findOne')
            .mockResolvedValue(user);

        /**
         * Password valid
         */
        jest
            .spyOn(bcrypt, 'compare')
            .mockResolvedValue(true);

        /**
         * Populated user
         */
        jest
            .spyOn(service, 'getPopulatedUser')
            .mockResolvedValue(validUser);

        /**
         * Generate JWT token
         */
        jest
            .spyOn(jwtService, 'sign')
            .mockReturnValue('token');

        /**
         * Fetch employee details
         */
        jest
            .spyOn(service.employeeModel, 'findById')
            .mockResolvedValue(details);

        /**
         * Execute login
         */
        const result =
            await service.loginUser(loginDto);

        /**
         * Verify final response
         */
        expect(result).toEqual({
            user: validUser,
            token: 'token',
        });
    });
});