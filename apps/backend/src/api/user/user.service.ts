import {
  Attendance,
  Calendar,
  Client,
  Employee,
  User,
  USER_TYPE_MAP,
  UserDocument,
} from '@lib/database';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { readFileSync } from 'fs';
import {
  AUTH_SERVICE,
  EMPLOYEE_API_MAPS,
  generateRandomString,
  getOrdinalSuffix,
  INAPP_NOTIFICATION_TOPIC,
  NOTIFICATION_SERVICE,
  NOTIFY_USERS_TOPIC,
} from '@lib/common';
import {
  ChangePasswordDto,
  LoginDto,
  UpdateUserDto,
  UserStatusChangeDTO,
} from '@lib/dto';
import { RedisService } from '@app/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) public readonly userModel: Model<User>,
    @InjectModel(Employee.name) public readonly employeeModel: Model<Employee>,
    @InjectModel(Client.name) public readonly clientModel: Model<Client>,
    @InjectModel(Calendar.name) public readonly calendarModel: Model<Calendar>,
    @InjectModel(Attendance.name)
    public readonly attendanceModel: Model<Attendance>,
    @Inject(NOTIFICATION_SERVICE) public readonly emailClient: ClientProxy,
    @Inject(AUTH_SERVICE) public readonly authClient: ClientProxy,
    private readonly eventEmmiter: EventEmitter2,
    public readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    public readonly redisService: RedisService, // Inject the Redis service
  ) { }

  async getAllUser(
    populateOption: any,
    query?: {
      page?: number;
      limit?: number;
      sort?: string; // Assuming sort is either 'asc' or 'desc'
      sortBy?: string;
      keyword?: string;
    },
    isAdminOrHr?: boolean,
  ) {
    // Initialize search parameters
    let searchParam: Record<string, any> = {};

    if (!isAdminOrHr) {
      searchParam = {
        userType: USER_TYPE_MAP.EMPLOYEE,
      };
    }

    if (query?.keyword) {
      searchParam = {
        $or: [{ username: { $regex: query.keyword, $options: 'i' } }],
      };
    }

    // Initialize sort parameters
    let sortParam: Record<string, SortOrder> = {};

    if (query?.sort && query?.sortBy) {
      sortParam = {
        [query.sortBy]: query.sort === 'asc' ? 1 : -1,
      };
    } else if (query?.sort) {
      sortParam = { createdAt: query.sort === 'asc' ? 1 : -1 };
    } else if (query?.sortBy) {
      sortParam = { [query.sortBy]: 1 };
    }

    if (query?.page && query?.limit) {
      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      const [users, totalDocuments] = await Promise.all([
        this.userModel
          .find(searchParam)
          .sort(sortParam)
          .skip(skip)
          .limit(limit)
          .select('-password')
          .populate(populateOption)
          .exec(),
        this.userModel.countDocuments(searchParam), // Ensure counting with searchParam
      ]);

      return {
        data: users,
        pagination: {
          total: totalDocuments,
          count: users.length,
        },
      };
    } else {
      // No pagination, return all records
      return await this.userModel
        .find({ ...searchParam, status: true })
        .sort(sortParam)
        .select('-password')
        .populate(populateOption)
        .exec();
    }
  }

  async registerUser(registerDto: any) {
    let template = null;
    let dataValidation = null;
    const password = generateRandomString(8);

    if (registerDto.userIdRef === 'Employee') {
      dataValidation = await this.employeeModel
        .findById(registerDto.userId)
        .populate('designation');

      const templateUrl = join(
        this.configService.get('TEMPLATE_LOCATION'),
        'employee_onboarding.html',
      );

      template = readFileSync(templateUrl)
        .toString()
        .replaceAll(
          '{{employee_name}}',
          `${dataValidation?.firstName} ${dataValidation?.lastName}`,
        )
        .replaceAll('{{username}}', dataValidation?.email)
        .replaceAll(
          '{{employee_designation}}',
          dataValidation?.designation?.designationName,
        )
        .replaceAll('{{password}}', password);

      this.emailClient
        .send(
          { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
          {
            to: dataValidation?.email,
            subject: 'Welcome to PAS Digital Technologies',
            html: template,
          },
        )
        .toPromise();
    }

    // currently not sending emails to clients
    else if (registerDto.userIdRef === 'Client') {
      dataValidation = await this.clientModel.findById(registerDto.userId);

      // const templateUrl = join(this.configService.get("TEMPLATE_LOCATION"), "client_onboarding.html");

      // template = readFileSync(templateUrl).toString()
      //   .replaceAll("{{client_name}}", `${dataValidation?.firstName} ${dataValidation?.lastName}`)
      //   .replaceAll("{{username}}", dataValidation?.email)
      //   .replaceAll("{{password}}", password)

      // const toEmail = [dataValidation?.email]
      // if (dataValidation?.secondaryEmail) toEmail.push(dataValidation?.secondaryEmail)
      // this.emailClient.send({ cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL }, {
      //   to: toEmail,
      //   subject: "Welcome to PAS Digital Technologies",
      //   html: template,
      // }).toPromise()
    }

    if (dataValidation) {
      const ifExists = await this.userModel.findOne({
        userId: registerDto.userId,
      });
      if (ifExists) return { message: 'User already exists' };
      const allocated = 1_073_741_824;
      const d = await (
        await this.userModel.create({
          ...registerDto,
          username: dataValidation.email,
          password: password,
          allocatedSpace: allocated,
        })
      ).populate('userId');

      return { success: true, data: d, message: 'User Registered' };
    }
    return { message: 'User not found', success: false };
  }

  async deleteUser(id: string) {
    try {
      // this.logger.log(id)
      const deletedData = await this.userModel.findOneAndDelete({ userId: id });
      return {
        message: 'Deleted Successfully!',
        success: true,
        data: deletedData,
      };
    } catch (err) {
      return { message: "Something isn't right", success: false };
    }
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { ...data }, { new: true })
      .populate('userId');

    if (!updatedUser) throw new NotFoundException('User not Found !');
    return updatedUser;
  }

  async loginUser(loginDto: LoginDto) {
    const user: any = await this.userModel
      .findOne({ username: loginDto.username })
      .exec();
    if (!user) {
      throw new NotFoundException('Invalid Username');
    }

    if (user && !user?.status) {
      throw new UnauthorizedException("You Don't have access ! - Contact HR");
    }
    // Check the provided password against the stored hashed password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid Password Provided');
    }

    const validUser = await this.getPopulatedUser(user?._id);

    if (user?.userIdRef === 'Employee') {
      // If the password is valid, return the user object
      const details = await this.authClient.send({ cmd: EMPLOYEE_API_MAPS.EMPLOYEE_DETAILS }, user?.userId).toPromise();
      // const details = await this.employeeModel.findById(user?.userId);
      if (details) {
        const token = this.jwtService.sign({ user: validUser?._id });
        // this.logger.log(attendance);
        this.authClient.send(
          { cmd: INAPP_NOTIFICATION_TOPIC.SEND_REALTIME_NOTIFICATION },
          { msg: "Welcome to PAS Digital Technologies" }
        )

        this.eventEmmiter.emit('notify:realtime', {
          message: `${(validUser.userId as any).firstName} Logged In`,
        });
        return {
          user: validUser,
          token,
        };
      }

      throw new HttpException('Unwanted User', HttpStatus.BAD_REQUEST);
    } else if (user?.userIdRef === 'Client') {
      const token = this.jwtService.sign({ user: validUser?._id });
      return { user: validUser, token };
    }

    throw new HttpException('Something Went Wrong !', HttpStatus.BAD_REQUEST);
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    try {
      if (!changePasswordDto.user)
        return {
          message: 'Not getting user !',
          success: false,
          err: 'Contact Developers',
        };

      const user = await this.userModel.findById(changePasswordDto.user);
      if (!user) {
        return { message: 'Invalid User !', success: false };
      }
      if (user && !user?.status) {
        return { message: 'Contact your hr :(', success: false, data: null };
      }
      // Check the provided password against the stored hashed password
      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.oldPassword,
        user.password,
      );

      if (!isPasswordValid) {
        return { message: 'Wrong current password !', success: false };
      }

      user.password = changePasswordDto.password;
      await user.save();

      return { message: 'Password Updated !', success: true };
    } catch (err) {
      return { message: "Something isn't right !", success: false };
    }
  }

  async resetUserPassword(resetPasswordDto: UserStatusChangeDTO) {
    const d = await this.userModel.findById(resetPasswordDto.userId);
    if (!d) throw new NotFoundException('Invalid User Provided');
    const newPassword = generateRandomString(12, true);
    d.password = newPassword;
    await d.save();
    return {
      newPassword,
    };
  }

  async getPopulatedUser(id: string) {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.redisService.getFromCache(cacheKey);
    if (typeof cachedUser === 'string' && cachedUser) {
      return JSON.parse(cachedUser);
    }

    try {
      const user = await this.userModel.findById(id).select('userIdRef');
      let populationPaths = [];

      if (user?.userIdRef === 'Employee') {
        populationPaths = [
          {
            path: 'userId',
            populate: {
              path: 'designation',
              populate: {
                path: 'department',
              },
            },
          }
        ];
      } else if (user?.userIdRef === 'Client') {
        populationPaths = [
          {
            path: 'userId',
            populate: {
              path: 'company',
            },
          },
        ];
      }

      const singlePopulatedUser = await this.userModel
        .findById(id)
        .select('-password')
        .populate(populationPaths).populate('shift');
      await this.redisService.setInCache(
        cacheKey,
        JSON.stringify(singlePopulatedUser),
        300,
      );

      return singlePopulatedUser;
    } catch (err) {
      return null;
    }
  }

  //Dashboard
  async getUserDashboard(user: UserDocument | any) {
    const cacheKey = `user_dashboard_${user?.userId?.employeeId}`; // Unique key for the user dashboard

    // this.logger.debug("CHECKING  CACHE - DASHBOARD")

    // Check if the dashboard data is already cached
    const cachedData = await this.redisService.getFromCache(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData); // Return cached data
    }
    const role = user?.userId?.role;
    const allCalendarEvents = await this.getSevenDaysEvent();
    const anniversaryEvents = await this.findWorkAnniversary();
    const birthdayEvents = await this.findBirthday();
    const weatherCondition = await this.getWeatherCondition();
    const attendanceData = await this.getAttendanceStat(
      user?.userId?.employeeId,
    );

    const events = [
      ...anniversaryEvents,
      ...allCalendarEvents,
      ...birthdayEvents,
    ];

    await this.redisService.setInCache(
      cacheKey,
      JSON.stringify({
        weather: weatherCondition,
        events: events,
        attendance: attendanceData,
        name: user?.userId?.firstName,
      }),
      300,
    );

    return {
      weather: weatherCondition,
      events: events,
      attendance: attendanceData,
      name: user?.userId?.firstName,
    };
  }

  //helper for dashboard
  async getAttendanceStat(
    userId: string,
  ): Promise<{ checkedIn: number; checkedOut: number; absent: number }> {
    // Get the current date and the start and end of the current month

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month

    // Aggregation pipeline to get counts
    const result = await this.attendanceModel
      .aggregate([
        {
          $match: {
            employeeId: userId,
            createdAt: {
              $gt: start,
              $lte: end,
            },
          },
        },
        {
          $facet: {
            checkedIn: [
              {
                $match: { entryTime: { $exists: true, $ne: null } },
              },
              {
                $count: 'count',
              },
            ],
            checkedOut: [
              {
                $match: {
                  entryTime: { $exists: true, $ne: null },
                  exitTime: { $exists: true, $ne: null },
                },
              },
              {
                $count: 'count',
              },
            ],
            absent: [
              {
                $match: {
                  $or: [
                    { entryTime: { $exists: false } }, // entryTime is missing
                    { exitTime: { $exists: false } }, // exitTime is missing
                    { entryTime: null }, // entryTime is null
                    { exitTime: null }, // exitTime is null
                    // Additional check for "Absent" status if applicable
                    // If you have a status field for absence, you can use:
                    // { status: 'Absent' }
                  ],
                },
              },
              {
                $count: 'count',
              },
            ],
          },
        },
        {
          $project: {
            checkedIn: { $arrayElemAt: ['$checkedIn.count', 0] },
            checkedOut: { $arrayElemAt: ['$checkedOut.count', 0] },
            absent: { $arrayElemAt: ['$absent.count', 0] },
          },
        },
      ])
      .exec();

    const counts = result[0] || {
      checkedIn: 0,
      checkedOut: 0,
      absent: 0,
    };

    return counts;
  }

  async getWeatherCondition() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      let data: any;

      const apiUrl = this.configService.get<string>('WEATHER_APP_API_URL');
      const weatherKey = this.configService.get<string>('WEATHER_APP_API_KEY');

      // Fetch data from Redis cache
      const cacheData: any = await this.redisService.getFromCache(
        `${todayStr}:weather`,
      );

      if (cacheData) {
        this.logger.log('Weather fetched from cached data');
        data = JSON.parse(cacheData); // Parse the cached data
      } else {
        this.logger.log('Fetching from API');
        // Fetch weather data from the external API
        const response = await fetch(`${apiUrl}?key=${weatherKey}&q=kolkata`);
        const responseData = await response.json();

        const updateData = {
          current: {
            condition: responseData?.current?.condition,
            temp_c: responseData?.current?.temp_c,
          },
        };
        data = updateData;

        // Store the fetched data in Redis with a 1-hour expiration time (3600 seconds)
        await this.redisService.setInCache(
          `${todayStr}:weather`,
          JSON.stringify(updateData),
          3600,
        );
      }
      return data;
    } catch (error) {
      this.logger.log(error);
      return;
    }
  }

  calculateAge(date: string) {
    const today = new Date();
    const targetDate = new Date(date);

    if (!(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
      throw new Error('Invalid date of targetDate');
    }

    let age = today.getFullYear() - targetDate.getFullYear();

    // Adjust age if targetDateday hasn't occurred yet this year
    if (today.getMonth() < targetDate.getMonth()) {
      age--;
    }

    return age;
  }
  async getSingleUserFromEmpId(employeeId) {
    // Step 1: Find the user corresponding to the given employee ID
    const user = await this.userModel
      .findOne({ userId: employeeId })
      .populate('userId') // Populates `userId` field
      .lean();
    if (!user) {
      return { message: 'Employee not found' };
    }
    console.log(user._id);
    return user;
  }
  async getSevenDaysEvent() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7); // 7 days from today

    const todayStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    // Find events where startDate or endDate is within the next 7 days
    const events = await this.calendarModel
      .find({
        $or: [
          {
            $or: [
              { isRecurring: true, $expr: { $eq: ['$startDate', '$endDate'] } },
            ],
          },
          { startDate: { $gte: todayStr, $lte: endDateStr } },
          { endDate: { $gte: todayStr, $lte: endDateStr } },
          {
            $and: [
              { startDate: { $lte: todayStr } },
              { endDate: { $gte: endDateStr } },
            ],
          },
        ],
      })
      .sort({ startDate: 1 })
      .exec();

    return events;
  }

  async findWorkAnniversary() {
    const today = new Date();
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7,
    );

    // Get the month and day of today's date
    const todayMonth = today.getMonth() + 1; // Month is zero-based, so add 1
    const todayDay = today.getDate();

    // Get the month and day of the end of the upcoming week
    const endOfWeekMonth = endOfWeek.getMonth() + 1; // Month is zero-based, so add 1
    const endOfWeekDay = endOfWeek.getDate();

    // only the users who are currently working with us
    const currentEmployees = (
      await this.userModel.find({ status: true }).select('userId')
    ).map((d) => d?.userId?.toString());

    // Query the database for employees whose birthdays fall within the upcoming week (including today)
    const employeesWithUpcomingAnniversary = await this.employeeModel
      .find({
        _id: { $in: currentEmployees },

        $expr: {
          $and: [
            {
              $gte: [
                {
                  $dateToString: {
                    format: '%m-%d', // Extract MM-DD from the date field
                    date: '$dateJoined',
                  },
                },
                `${todayMonth.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`,
              ],
            }, // Anniversary is on or after today
            {
              $lt: [
                {
                  $dateToString: {
                    format: '%m-%d',
                    date: '$dateJoined',
                  },
                },
                `${endOfWeekMonth.toString().padStart(2, '0')}-${endOfWeekDay.toString().padStart(2, '0')}`,
              ],
            }, // Anniversary is on or before the end of the upcoming week
          ],
        },
      })
      .exec();

    const data = employeesWithUpcomingAnniversary?.map((b, i) => {
      const dateStr = b?.dateJoined.toISOString().split('T')[0];
      if (this.calculateAge(dateStr) === 0) {
        return {};
      }
      return {
        name: `${b?.firstName}'s Work Aniversary`,
        startDate: dateStr,
        description: `${getOrdinalSuffix(this.calculateAge(dateStr))} Anniversary`,
        isAnniversary: true,
        color: '#3b82f6',
      };
    });

    return data;
  }

  async findBirthday() {
    const today = new Date();
    const endOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 7,
    );

    // Get the month and day of today's date
    const todayMonth = today.getMonth() + 1; // Month is zero-based, so add 1
    const todayDay = today.getDate();

    // Get the month and day of the end of the upcoming week
    const endOfWeekMonth = endOfWeek.getMonth() + 1; // Month is zero-based, so add 1
    const endOfWeekDay = endOfWeek.getDate();

    // only the users who are currently working with us
    const currentEmployees = (
      await this.userModel.find({ status: true }).select('userId')
    ).map((d) => d?.userId?.toString());

    // Query the database for employees whose birthdays fall within the upcoming week (including today)
    const employeesWithUpcomingBirthday = await this.employeeModel
      .find({
        _id: { $in: currentEmployees },

        $expr: {
          $and: [
            {
              $gte: [
                { $substr: ['$dob', 5, 5] },
                `${todayMonth.toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`,
              ],
            }, // Anniversary is on or after today
            {
              $lt: [
                { $substr: ['$dob', 5, 5] },
                `${endOfWeekMonth.toString().padStart(2, '0')}-${endOfWeekDay.toString().padStart(2, '0')}`,
              ],
            }, // Anniversary is on or before the end of the upcoming week
          ],
        },
      })
      .exec();

    const data = employeesWithUpcomingBirthday?.map((b, i) => {
      const dateStr = b?.dob.toISOString().split('T')[0];
      return {
        name: `${b?.firstName}'s Birthday`,
        startDate: dateStr,
        description: `${getOrdinalSuffix(this.calculateAge(dateStr))} Birthday`,
        isBirthday: true,
        color: '#FED6D0',
      };
    });

    return data;
  }

  // TODO: remove the method
  // async resetAllUsersStorage(defaultStorage: number) {
  //   return this.userModel.updateMany(
  //     {},
  //     {
  //       $set: {
  //         allocatedSpace: defaultStorage,
  //         remainingStorage: defaultStorage,
  //       },
  //     },
  //   );
  // }
}
