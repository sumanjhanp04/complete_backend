import { HttpStatus, Logger, UploadedFiles, UseGuards } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UserDocument } from '@lib/database';
import { WsJwtGuard } from '@lib/guards';
import { SocketUser } from '@lib/decorators';
import { string } from 'joi';

interface FileChatUploadType {
  id: string,
  filename: string,
  type: string,
  size: number,
  url: string,
}

// parseInt(process.env.CHAT_PORT),
@WebSocketGateway({
  cors: {
    origin: ['https://ems.pasdgtal.com/', 'https://ui.ems-dev.pasdgtal.com'],
    credentials: true,
  },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private rooms: { [key: string]: string } = {};
  private logger = new Logger(ChatGateway.name);
  private onlineUsers: Map<string, string> = new Map();
  constructor(private readonly chatService: ChatService) { } // Inject the service

  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    this.logger.log('Initialized Socket for Chat');
  }

  handleDisconnect(client: Socket) {
    this.onlineUsers.delete(client.id);
    this.broadcastOnlineUsers();
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    const userId = client.handshake.query.userId;

    // console.log("activeRoom", this.rooms);

    if (userId) {
      const onlineUserIds = Array.from(this.onlineUsers.values());
      // if (!onlineUserIds.includes(userId as string)) {
      // }
      this.onlineUsers.set(client.id, userId as string);
    }

    setTimeout(() => {
      const onlineUserIds = Array.from(this.onlineUsers.values());
      client.emit('onlineUsers', onlineUserIds);
    }, 300);

    this.broadcastOnlineUsers();
    this.logger.log(`Client Connected: ${client.id}`);
  }

  private broadcastOnlineUsers(): void {
    const onlineUserIds = Array.from(this.onlineUsers.values());
    // console.log('Broadcasting online users:', onlineUserIds);
    this.server.emit('onlineUsers', onlineUserIds);
  }

  @SubscribeMessage('getUnseen')
  async getNotifications(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.getNotificationsForMe(
        user._id?.toString(),
      );
      client.emit('unseenMessages', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('removeNotification')
  async functionName(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.removeNotification(
        body,
        user?._id?.toString(),
      );
      client.emit('unseenMessages', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('requestRoom')
  async requestRoomHandler(
    @MessageBody('member') member: string,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.getOrCreateOneToOneRoom(
        member,
        user?._id.toString(),
      );


      // await this.chatService.setMessageSeen(
      //   d?.room?._id?.toString(),
      //   user?._id?.toString(),
      // );
      // const room = d?.room?._id?.toString();
      // if (room) {
      //   const prevRoom = this.rooms[user?._id?.toString()];
      //   if (prevRoom) {
      //     // console.log(`leaving previous room -> ${prevRoom}`)
      //     client.leave(prevRoom);
      //   }
      //   this.rooms[user?._id?.toString()] = room;
      //   client.join(room);
      //   client.emit('roomAllocated', d);
      // }
      // console.log({ rooms: this.rooms })
      client.emit('receiveRoomDetail', d.data);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage("getAllRoom")
  async getAllRoomDetail(
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    // this.logger.log(user);
    try {
      const existingRoomDetail = await this.chatService.allConversation(user?._id.toString());

      client.emit('receiveRoomDetail', existingRoomDetail);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('seenMessage')
  async setMessageSeen(
    @MessageBody('id') id: string,


    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const data = await this.chatService.setSingleMessageSeen(
        id,
        user?._id?.toString(),
      );
      client.emit('messageSeen', data);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('getMessageDetails')
  async getMessageDetails(
    @MessageBody('id') id: string,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.getMessageById(id);
      client.emit('messageDetails', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  // @SubscribeMessage('getPreviousMessages')
  // async fetchPreviousMessages(
  //   @MessageBody('room') roomId: string,
  //   @MessageBody('page') page: number,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   try {
  //     const d = await this.chatService.getMessages(roomId, page);
  //     client.emit('previousMessages', d);
  //   } catch (err) {
  //     const resp = err;
  //     client.emit('error', resp);
  //   }
  // }
  @SubscribeMessage('getAllMessages')
  async fetchPreviousMessages(
    @MessageBody('room') roomId: string,
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument
  ) {
    try {
      const d = await this.chatService.getMessages(roomId, user?._id.toString());

      const prevRoom = this.rooms[user?._id?.toString()]
      if (prevRoom) {
        client.leave(prevRoom)
      }
      this.rooms[user?._id?.toString()] = roomId;
      client.join(roomId);

      client.emit('allMessages', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('createMessage')
  async createMessage(
    @MessageBody()
    payload: {
      message: string;
      room: string;
      replyFor?: string;
      files?: FileChatUploadType[] | []
    },
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.createMessage(
        user?._id.toString(),
        payload?.room,
        payload?.message,
        payload?.replyFor,
        payload?.files
      );
      this.logger.log("Inside the create Message")
      // this.logger.log(this.server.sockets.adapter.rooms);
      this.logger.log(this.rooms)
      // client.emit('messageReceived', d);
      this.server.to(payload?.room).emit('messageReceived', d);
    } catch (err) {
      const resp = err;
      this.logger.log(resp)
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('uploadFileChat')
  async uploadFileInChat(
    @MessageBody()
    payload: {
      message: string;
      room: string;
      replyFor?: string;
      files?: FileChatUploadType[] | [];
    },
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      this.logger.log("this is for testing purpose only");
      this.logger.log(payload.files)

      const d = await this.chatService.createMessage(
        user?._id.toString(),
        payload?.room,
        null,
        payload?.replyFor,
        payload?.files

      );
      this.logger.log("Inside the create Message")
      // this.logger.log(this.server.sockets.adapter.rooms);
      this.logger.log(this.rooms)
      // client.emit('messageReceived', d);
      this.server.to(payload?.room).emit('messageReceived', d);
    } catch (err) {
      const resp = err;
      this.logger.log(resp)
      client.emit('error', resp);
    }
  }

  @SubscribeMessage("createGroup")
  async createGroup(
    @MessageBody()
    payload: {
      roomId: string,
      groupName: string;
      groupDescription: string;
      groupAdmin: string[];
      chatMembers: string[];
    },
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const data = await this.chatService.createGroup(
        payload.groupName,
        payload.groupDescription,
        payload.groupAdmin,
        payload.chatMembers,
      )
      this.logger.log(data);
      client.emit('receiveRoomDetail', data.room)
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('updateMessage')
  async updateMessage(
    @MessageBody()
    payload: { message: string; room: string; id: string; files?: string[] },
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.updateMessage(
        payload?.id,
        payload?.message,
        user?._id.toString(),
      );

      this.server.to(payload?.room).emit('messageUpdated', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @MessageBody() payload: { room: string; id: string },
    @ConnectedSocket() client: Socket,
    @SocketUser() user: UserDocument,
  ) {
    try {
      const d = await this.chatService.deleteMessage(
        payload?.id,
        user?._id.toString(),
        payload.room
      );
      this.server.to(payload?.room).emit('messageDeleted', d);
    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }

  @SubscribeMessage('isTyping')
  async handleTyping(
    @MessageBody('room') roomId: string,
    @MessageBody('isTyping') typingStatus: boolean,
    @SocketUser() user: UserDocument,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.debug(user?.userId)
      const data = {
        user: user._id,
        typingStatus,
      };

      client.broadcast.to(roomId).emit('typing', data);

    } catch (err) {
      const resp = err;
      client.emit('error', resp);
    }
  }
}
