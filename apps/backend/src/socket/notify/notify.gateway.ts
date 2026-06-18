import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { NotifyService } from './notify.service';
import { WsJwtGuard } from '@lib/guards';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { AUTH_SERVICE, INAPP_NOTIFICATION_TOPIC } from '@lib/common';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthWsMiddleware } from '@lib/middlewares';
import { NotifyHelperService } from './notify-helper.service';
import { UserDocument } from '@lib/database';
import { SocketUser } from '@lib/decorators';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: ['https://ems.pasdgtal.com/', 'https://ui.ems-dev.pasdgtal.com'],
    credentials: true,
  },
  namespace: 'notification',
})
@UseGuards(WsJwtGuard)
export class NotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly notifyHelperService: NotifyHelperService,
  ) { }
  @WebSocketServer() server: Server;
  private logger = new Logger(NotifyGateway.name);

  private users: Map<string, string> = new Map();

  afterInit(server: Server) {
    this.logger.log('Initialized Notification');
    //creating issue
    // server.use(
    //   AuthWsMiddleware(this.jwtService, this.cacheManager, this.authClient),
    // );
  }

  async handleConnection(client: Socket) {

    const { success, data, message } = await this.notifyHelperService.checkTokenValidity(client.handshake.headers.authorization,);
    if (!success) {
      // this.logger.log(message);
      client.emit('error', message);
      client.disconnect();
    }
    // this.logger.log({data})

    this.logger.verbose(`Notification Client Connected: ${client.id} with user id ${data?._id}`);
    const userId = data?._id?.toString();
    // client.emit('Testing',["this is for testing"])
    this.users.set(userId, client.id);

    const allNotificationData =
      await this.notifyHelperService.findAllPendingNotification(userId);

    client.emit('unread-notifications', allNotificationData);
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.users.entries()).find(
      ([_, id]) => id === client.id,
    )?.[0];
    if (userId) {
      this.users.delete(userId);
    }
    this.logger.fatal(`Notification Client Disconnected: ${client.id} with user id ${userId}`);


  }

  async sendScheduleNotification(notifications: any) {


    const notificationPromises = notifications.map(async (data) => {
      // if(!this.isUserOnline(data?.notifier?.toString)) return;
      const socketId = this.users.get(data?.notifier?.toString());


      if (socketId) {


        // Emit the notification asynchronously
        this.server.to(socketId).emit('notifications', data);
      } else {

      }
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
  }

  async sendSingleNotification(notification: any) {
    const socketId = this.users.get(notification?.notifier?.toString());


    if (socketId) {


      // Emit the notification asynchronously
      this.server.to(socketId).emit('notifications', notification);
    } else {

    }
  }



  @OnEvent('notify:realtime')
  handleOrderEvents(payload: { msg: string }) {
    // handle and process an event
    this.users.forEach((value, key) => {
      this.server.to(value).emit("realtime-notification", payload);
    });


    // this.logger.warn(payload)
  }




  @SubscribeMessage('notification:markAsRead')
  async markNotificationAsRead(
    @MessageBody('id') id: any,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      // this.logger.log("event id is => ")
      // this.logger.log({id});
      const data = await this.notifyHelperService.markNotificationAsRead(id);
      // this.logger.log({data})
      const allNotificationData =
        await this.notifyHelperService.findAllPendingNotification(user?._id?.toString());
      // this.logger.log("Inside the markNotificationAsRead")

      client.emit('unread-notifications', allNotificationData);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('notification:read')
  async getAllNotification(
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const data = await this.notifyHelperService.getAllNotification(
        user?._id?.toString(),
      );

      this.server.emit('notification:all', data);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }


  @SubscribeMessage('notification:markAsDismissed')
  async markAsDismissed(
    @MessageBody('id') id: any,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const data = await this.notifyHelperService.markNotificationAsDismissed(
        id
      );

      const allNotificationData = await this.notifyHelperService.getAllNotification(
        user?._id?.toString(),
      );

      this.server.emit('notification:all', allNotificationData);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }
}
