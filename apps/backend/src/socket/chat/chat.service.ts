import { RedisService } from '@app/cache/cache.service';
import { Conversation, Room, RoomDocument, Seen, User } from '@lib/database';
import { CreateChatFileCredentialDto } from '@lib/dto/dtos/chat/chat.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { FileCredentialsService } from '../../api/credentials/services/file-credentials.service';
import { FileUploadService } from '@app/file-upload';
import { FileMetadata } from '@lib/dto/dtos/credentials/create-file-credentials.dto';

interface FileChatUploadType {
        id:string,
        filename:string,
        type:string,
        size:number,
        url:string,
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<Room>,
    @InjectModel(Conversation.name)
    private readonly chatModel: Model<Conversation>,
    @InjectModel(Seen.name) private readonly seenModel: Model<Seen>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly redisService: RedisService,
    private readonly service: FileCredentialsService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  async getOrCreateOneToOneRoom(otherUser: string, currentUser: string) {
    let room: RoomDocument = await this.roomModel.findOne({
      members: { $size: 2, $all: [otherUser, currentUser] },
    });
    // .populate('members');

    if (!room) {
      // Create a new room if no such room exists
      room = await this.roomModel.create({ members: [otherUser, currentUser] });
    }
    const data = await this.allConversation(currentUser);
    return { data, room };
    // const oldMessages = await this.fetchAllMessage(room?._id.toString());
    // return { room, oldMessages };
    // return { room };
  }

  async removeNotification(body: any, user: string) {

    // const findD = await this.chatModel.find({ roomId: body?.roomId, sender: { $ne: user }, seenBy: { $size: 0 } })
    // console.log(findD)
    await this.chatModel.updateMany(
      {
        sender: { $ne: user },
        roomId: body?.roomId,
        seenBy: { $size: 0 },
      },
      { $set: { isDelivered: true } },
    );
    const notifications = await this.getNotificationsForMe(user);

    // console.log(notifications);

    return notifications;
  }

  async getNotificationsForMe(id: string) {
    const myRoom = await this.roomModel.find().where('members').in([id]);

    const d = await this.chatModel
      .find({
        sender: { $ne: id },
        roomId: { $in: myRoom },
        seenBy: { $size: 0 },
      })
      .sort({ createdAt: -1 })
      .populate('roomId');

    const groupedByRoom = d.reduce((acc, item: any) => {
      const roomId = item.roomId.members
        ?.join(',')
        .replace(id, '')
        .replace(',', '')
        .toString(); // Convert ObjectId to string for grouping
      if (!acc[roomId]) {
        acc[roomId] = {
          count: 0,
          lastMessage: item?.createdAt,
          notified: 0,
          roomId: item?.roomId?._id,
        };
      }
      acc[roomId] = {
        roomId: item?.roomId?._id,
        count: acc[roomId]?.count + 1,
        lastMessage:
          acc[roomId]?.lastMessage < item?.createdAt
            ? item?.createdAt
            : acc[roomId]?.lastMessage,
        notified: item?.isDelivered
          ? 1 + acc[roomId]?.notified
          : 0 + acc[roomId]?.notified,
      };
      return acc;
    }, {});

    // console.log(groupedByRoom)

    // await this.chatModel.updateMany({
    //     sender: { $ne: id },
    //     roomId: { $in: myRoom },
    //     seenBy: { $size: 0 },
    //     isDelivered: false,
    // }, {
    //     $set: { isDelivered: true }
    // });

    // console.log(groupedByRoom)
    return groupedByRoom;
  }

  // async getMessages(roomId: string, page: number = 1, pageSize: number = 50) {
  //   const d = await this.fetchAllMessage(roomId, page, pageSize);
  //   return d;
  // }
  async getMessages(roomId: string, userId: string) {
    const d = await this.chatModel.find({ roomId })
      .populate('replyFor')
      .populate(this.getSeenByPopulate())
     
      .exec();
    // this.logger.log(d)
    // this.logger.log(userId)
    const chatSeenData = await Promise.all(d.map(async (chat) => {

      // console.log(chat?.seenBy);
      const alreadySeen = chat?.seenBy?.some((seen: any) => seen?.user?._id.toString() === userId.toString())
      // this.logger.log(alreadySeen)
      if (chat.sender != userId && !alreadySeen) {
        // create a seen and update the chat
        // return await this.createSeenAndUpdateChat(chat._id.toString(), userId);
        const seenUser = await this.seenModel.create({ user: userId });
        const updatedMessage = await this.chatModel.findByIdAndUpdate(
          chat._id,
          { $addToSet: { seenBy: seenUser._id } },
          { new: true },
        )
        .populate(this.getSeenByPopulate());
        return updatedMessage;
      }
      return chat;
    }))

    return chatSeenData;
  }

  async fetchAllMessage(
    roomId: string,
    page: number = 1,
    pageSize: number = 50,
  ) {
    const total = await this.chatModel
      .find({ roomId: roomId })
      .countDocuments();
    const skip = (page - 1) * pageSize;

    const messages = await this.chatModel
      .find({ roomId: roomId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize)
      .populate('replyFor')
      .exec();
    return { messages: messages.reverse(), total };
  }

  async createMessage(
    userId: string,
    roomId: string,
    message: string | null,
    replyFor?: string,
    files?: FileChatUploadType[]  |[]
  ) {

    const d = await (
      await this.chatModel.create({
        roomId: roomId,
        sender: userId,
        message: message,
        replyFor: replyFor,
        file: files
      })
    ).populate('replyFor');

    return d;
  }

  async getMessageById(id: string) {
    const d = await this.chatModel
      .findById(id)
      .populate({
        path: 'sender',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName employeeId',
        },
      })
      .populate({
        path: 'seenBy',
        populate: {
          path: 'user',
          select: 'user',
          populate: {
            path: 'user',
            select: 'firstName lastName employeeId',
          },
        },
      })
      .populate('roomId replyFor');
    return d;
  }

  async updateMessage(id: string, message: string, user: string) {
    const currentChat: any = await this.chatModel.findById(id);
    const createdAtDate = new Date(currentChat.createdAt);
    const currentDate = new Date();
    const fiveMinutesAgo = new Date(currentDate.getTime() - 5 * 60000);
    if (currentChat?.sender?.toString() != user?.toString()) {
      // console.log({ db: currentChat?.sender, user })
      throw new HttpException(
        'Only sender can edit message !',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (createdAtDate > fiveMinutesAgo) {
      const d = await this.chatModel
        .findByIdAndUpdate(
          id,
          { message: message, isEdited: true, messageEditTime: new Date() },
          { new: true },
        )
        .populate('replyFor')
        .populate(this.getSeenByPopulate());
        
      return d;
    } else {
      throw new HttpException(
        "Message can't be edited after 5 minutes !",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteMessage(id: string, user: string, roomId:string) {
    const currentChat: any = await this.chatModel.findById(id);
    const createdAtDate = new Date(currentChat.createdAt);
    const currentDate = new Date();
    const fiveMinutesAgo = new Date(currentDate.getTime() - 10 * 60000);
    if (currentChat?.sender?.toString() != user?.toString()) {
      throw new HttpException(
        'Only sender can delete message !',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (createdAtDate > fiveMinutesAgo && !currentChat.isDeleted) {
      try {
        if(currentChat?.file?.length > 0){
          await Promise.all(currentChat?.file.map(async(item:any)=>{
             const key = `${roomId}/files/${item.filename}`;
             await this.fileUploadService.deleteFile(key);
             this.logger.log("file is delete is completely")
         }))
        }
      } finally {
      const d = await this.chatModel
        .findByIdAndUpdate(id, { $set: { message: null,
          file:[],
          isDeleted: true } }, { new: true })
        .populate('replyFor');  
        return d;
      }
    } else {
      throw new HttpException(
        `Message cannot be deleted after 10 minutes.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllUnreadMessages(room: string, user: string) {
    return await this.chatModel.find({
      roomId: room,
      sender: { $ne: user },
      seenBy: { $size: 0 },
    });
  }

  async setMessageSeen(room: string, user: string) {

    const unreadMessages = await this.getAllUnreadMessages(room, user);

    if (unreadMessages?.length > 0) {
      const seenUser = await this.seenModel.create({ user: user });
      const messageIds = unreadMessages.map((message) =>
        message._id?.toString(),
      );

      const abc = await this.chatModel.updateMany(
        { _id: { $in: messageIds } },
        { $push: { seenBy: seenUser?._id } },
      );
      // console.log(abc)
    }
    return null;
  }

  async setSingleMessageSeen(id: string, user: string) {
    this.logger.log(`the user id => ${user}`)
    const message: any = await this.chatModel.findById(id).populate('roomId');
    // this.logger.log(message);
    // if (message?.sender != user && message?.roomId?.members?.includes(new mongoose.Types.ObjectId(user))) {
    // const otherMember = message?.roomId?.members?.find((member:string)=> member.toString() === user.toString());
    // this.logger.log(otherMember)

    if (message?.sender != user && message?.roomId?.members?.find((member: string) => member.toString() === user.toString())) {
      // we create the seen and update the chat
      return await this.createSeenAndUpdateChat(id, user);
    }
  }

  async findRoomIdsHavingChats(id: string): Promise<string[]> {
    const userId = new mongoose.Types.ObjectId(id);
    const result = await this.roomModel
      .aggregate([
        {
          $lookup: {
            from: 'conversations', // Adjust this to match your Chat schema name in MongoDB
            localField: '_id',
            foreignField: 'roomId',
            as: 'chats',
          },
        },
        {
          $match: {
            members: {
              $in: [userId]
            },
          },
        },
        {
          $project: {
            _id: 1, // Project only the _id field
          },
        },
      ])
      .exec();

    // Extract roomIds from result
    const roomIds = result.map((room) => room._id.toString()); // Assuming _id is ObjectId, convert to string if needed

    return roomIds;
  }

  async allConversation(id: string) {
    // let allRooms: any = await this.redisService.getFromCache('allRoomsWithChat');

    // if (!allRooms || allRooms?.length == 0) {
    //   // allRooms = await this.findRoomIdsHavingChats(id);
    //   await this.redisService.setInCache('allRoomsWithChat', JSON.stringify(allRooms));
    // }

    const allRooms = await this.roomModel.find({
      members: { $in: [new mongoose.Types.ObjectId(id)] }
    })

    const allRoomObjectId = allRooms.map((room) => room._id.toString());

    const allRoomParse = typeof allRooms == "string" ? JSON.parse(allRooms) : allRooms;
    const conversations = await this.roomModel
      .find({ _id: { $in: allRoomObjectId } })
      .populate({
        path: 'members',
        select: "userId userIdRef _id",
        populate: {
          path: 'userId',
          select: "firstName lastName gender image"
        },
      }).sort({ createdAt: -1 }).lean();

    const allLastMessage = await this.chatModel.aggregate([
      { $sort: { room: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$roomId",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $project: {
          roomId: "$_id",
          lastMessage: "$lastMessage.message",
          lastMessageDeleted: "$lastMessage.isDeleted",
          timestamp: "$lastMessage.createdAt"
        }
      }
    ]);
    //  this.logger.log(conversations)

    const newData = conversations.map((conversation) => {
      const chat = allLastMessage.find((chat) => chat._id.toString() == conversation?._id)
      if (chat) {
        return { ...conversation, ...chat }
      } else {
        return conversation;
      }
    })

    //  this.logger.log(newData)

    return newData;
  }


  async allMessages(id: string) {
    const messages = await this.chatModel.find({ roomId: id }).populate([
      {
        path: 'sender',
        select: 'userId',
        populate: {
          path: 'userId',
          select: "firstName lastName gender image"
        },
      },
      {
        path: 'roomId',
      },
    ]);
    return messages;
  }

  async listUser(prm: any, attn: any) {
    const data = await this.userModel.find(prm).select('-password').populate({
      path: 'userId',
      select: 'firstName lastName image',
    });
    return data;
  }

  async createGroup(groupName: string, groupDescription: string, groupAdmin: string[], chatMembers: string[]) {
    const allMembers = [...chatMembers, ...groupAdmin];
    const newRoom = await this.roomModel.create({
      name: groupName,
      description: groupDescription,
      members: allMembers,
      isGroup: true,
      admin: groupAdmin,
    })
    const room = await this.roomModel.findOne({ _id: newRoom._id }).populate({
      path: 'members',
      select: "userId userIdRef _id",
      populate: {
        path: 'userId',
        select: "firstName lastName gender image"
      },
    }).sort({ createdAt: -1 }).lean();

    return { room }
  }

  async getRoomDetail(id: string) {
    const roomDetail = await this.roomModel.findById(id);

    const result = {
      message: 'room Details Fetched',
      success: true,
      data: { basicDetails: roomDetail },
    };
    return result;
  }

  async updateRoomProfilePhoto(id: string, file: string) {
    const updateRoom = await this.roomModel.findByIdAndUpdate(id, {
      $set: {
        groupProfile: file,
      }
    }, { new: true })
      .populate({
        path: 'members',
        select: "userId userIdRef _id",
        populate: {
          path: 'userId',
          select: "firstName lastName gender image"
        },
      }).sort({ createdAt: -1 }).lean();

    return updateRoom;
  }


  // create a Seen and update chat
  async createSeenAndUpdateChat(chatId: string, userId: string) {
    const seenUser = await this.seenModel.create({ user: userId });
    const updatedMessage = await this.chatModel.findByIdAndUpdate(
      chatId,
      { $addToSet: { seenBy: seenUser._id } },
      { new: true },
    ).populate(this.getSeenByPopulate());
    return updatedMessage;
  }

  async uploadFileInChat(files:FileMetadata[], roomId:string){
    const results = await Promise.all(files?.map(async(file)=>{
      
      const key = `${roomId}/files/${file.filename}`;

      const signedUrl = await this.fileUploadService.createSignedUrl({
        filename:key,
        type:file.type,
      })

      
       
    }))

    

    return {
      success: true,
      message: 'File upload & finalized successfully',
      data: results,
    }
  }


  private getSeenByPopulate = () => {
    return {
      path: 'seenBy',
      select: "_id user createdAt",
      populate: {
        path: "user",
        select: "userId userIdRef",
        populate: {
          path: "userId",
          select: "firstName lastName gender image _id"
        }
      }
    }
  }
}
