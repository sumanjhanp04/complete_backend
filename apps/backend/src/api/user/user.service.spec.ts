import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '@lib/database';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { bcrypt } from 'bcryptjs';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;
    let userModel: Model<User>;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: getModelToken(User.name), useValue: {} },
                { provide: JwtService, useValue: {} },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userModel = module.get<Model<User>>(getModelToken(User.name));
        jwtService = module.get<JwtService>(JwtService);
    });

    it('should login with valid username and password', async () => {
        const loginDto = { username: 'test', password: 'password' };
        const user = { _id: '123', username: 'test', password: 'hashedPassword' };
        const validUser = { _id: '123', username: 'test' };

        jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(service, 'getPopulatedUser').mockResolvedValue(validUser);
        jest.spyOn(jwtService, 'sign').mockReturnValue('token');

        const result = await service.loginUser(loginDto);
        expect(result).toEqual({ user: validUser, token: 'token' });
    });

    it('should throw NotFoundException with invalid username', async () => {
        const loginDto = { username: 'invalid', password: 'password' };

        jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

        await expect(service.loginUser(loginDto)).rejects.toThrowError(
            NotFoundException,
        );
    });

    it('should throw UnauthorizedException with valid username but invalid password', async () => {
        const loginDto = { username: 'test', password: 'wrongPassword' };
        const user = { _id: '123', username: 'test', password: 'hashedPassword' };

        jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(service.loginUser(loginDto)).rejects.toThrowError(
            UnauthorizedException,
        );
    });

    it('should throw UnauthorizedException with deactivated user', async () => {
        const loginDto = { username: 'test', password: 'password' };
        const user = { _id: '123', username: 'test', password: 'hashedPassword', status: false };

        jest.spyOn(userModel, 'findOne').mockResolvedValue(user);

        await expect(service.loginUser(loginDto)).rejects.toThrowError(
            UnauthorizedException,
        );
    });

    it('should return user and token with employee user type', async () => {
        const loginDto = { username: 'test', password: 'password' };
        const user = { _id: '123', username: 'test', password: 'hashedPassword', userIdRef: 'Employee' };
        const validUser = { _id: '123', username: 'test' };
        const details = { _id: '123', userId: '123' };

        jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(service, 'getPopulatedUser').mockResolvedValue(validUser);
        jest.spyOn(jwtService, 'sign').mockReturnValue('token');
        jest.spyOn(service.employeeModel, 'findById').mockResolvedValue(details);

        const result = await service.loginUser(loginDto);
        expect(result).toEqual({ user: validUser, token: 'token' });
    });
});