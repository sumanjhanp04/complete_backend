import { Calendar, Notification, UserDocument } from '@lib/database';
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifyGateway } from './notify.gateway';
import { AUTH_SERVICE, NOTIFICATION_STATUS, USERS_API_MAPS } from '@lib/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import { RedisService } from '@app/cache/cache.service';

@Injectable()
export class NotifyHelperService {
  private logger = new Logger(NotifyHelperService.name);
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly jwtService: JwtService,
    public readonly redisService: RedisService, // Inject the Redis service
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) { }
  async findAllPendingNotification(userId: string) {
    try {
      const allNotificationData = await this.notificationModel.find({
        notifier: userId,
        status: NOTIFICATION_STATUS.UNREAD,
      }).populate({
        path: 'actor',
        populate: {
          path: 'userId'
        }
      })
        ;
      return allNotificationData;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async markNotificationAsRead(id: string) {
    // this.logger.log({id})
    const data = await this.notificationModel.findByIdAndUpdate(id, {
      status: NOTIFICATION_STATUS.READ,
    },{new:true});
    return data;
  }
  async markNotificationAsDismissed(id: string) {
    const data = await this.notificationModel.findByIdAndDelete(id);
    return data;
  }

  async getAllNotification(userId: string) {
    const data = await this.notificationModel.find({ notifier: userId }).exec();
    return data;
  }

  async checkTokenValidity(token: string) {
    if (!token) {
      this.logger.log('not Provide', 'err');
      return {
        success: false,
        message: 'Invalid token provided - Logging out Users',
      };
    }
    if (token.indexOf('Bearer ') !== 0) {
      this.logger.log('Bearer not Provided', 'err');
      return {
        success: false,
        message: 'Invalid token provided - Logouting Users',
      };
    }
    const extractedToken = token.substring(7);
    // console.log(extractedToken)
    try {
      const jwt = await this.jwtService.verifyAsync(extractedToken, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });

      const userId = jwt.user;

      const data: UserDocument = await this.authClient
        .send({ cmd: USERS_API_MAPS.GET_USER }, { id: userId })
        .toPromise();
      if (data) {
        return { success: true, data: data, message: null };
      }
    } catch (error) {
      this.logger.error('Invalid token provided - Logouting Users');
      this.logger.error(error);
      return {
        success: false,
        message: 'Invalid token provided - Logouting Users',
      };
    }
  }
}
