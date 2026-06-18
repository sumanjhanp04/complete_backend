import { CreateProjectDto, UpdateProjectDto } from '@lib/dto'; // Added UpdateProjectDto import
import { NOTIFICATION_SERVICE, NOTIFY_USERS_TOPIC } from '@lib/common';
import { ProjectCategoryDocument, Projects, Tasks, USER_TYPE_MAP } from '@lib/database';
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { readFileSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { TasksService } from './task.service';
import { ClientsService } from '../../clients/clients.service';
import { ProjectCategoryService } from './category.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(
    @InjectModel(Projects.name) private readonly projectsRepo: Model<Projects>,
    @Inject(NOTIFICATION_SERVICE) private readonly emailClient: ClientProxy,
    @InjectModel(Tasks.name) private readonly taskModel: Model<Tasks>,
    private readonly configService: ConfigService,
    private readonly tasksService: TasksService,
    private readonly clientsService: ClientsService,
    private readonly projectCategoryService: ProjectCategoryService, // Injecting the ProjectCategoryService
  ) { }

  async createProject(createProjectDto: CreateProjectDto) {
    const a = await this.projectsRepo.create(createProjectDto);
    const data: any = await this.projectsRepo
      .findById(a._id)
      .populate({
        path: 'admin',
        select: 'userId userIdRef username',
        populate: {
          path: 'userId',
          select: 'firstName lastName image',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef username',
        populate: {
          path: 'userId',
          select: 'firstName lastName image',
        },
      })
      .populate('company');

    // console.log(data);
    data?.assignedUser.map((user) => {
      if (user.userIdRef === USER_TYPE_MAP.EMPLOYEE) {

        const templateUrl = join(
          this.configService.get('TEMPLATE_LOCATION'),
          'project_onboarding_employee.html',
        );
        const template = readFileSync(templateUrl)
          .toString()
          .replaceAll(
            '{{name}}',
            `${user?.userId?.firstName} ${user?.userId?.lastName}`,
          )
          .replaceAll('{{project_name}}', a?.name);

        this.emailClient
          .send(
            { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
            {
              to: user?.username,
              subject: 'New Project Onboarded',
              html: template,
            },
          )
          .toPromise();
      }

      // currently sending email is off for client

      // else if (user.userIdRef === USER_TYPE_MAP.CLIENT) {
      //   const templateUrl = join(this.configService.get("TEMPLATE_LOCATION"), "project_onboarding_client.html");
      //   const template = readFileSync(templateUrl).toString()
      //     .replaceAll("{{name}}", `${user?.userId?.firstName} ${user?.userId?.lastName}`)
      //     .replaceAll("{{project_name}}", a?.name)
      //     .replaceAll("{{project_id}}", a?._id)
      //     .replaceAll("{{admin_name}}", `${user?.admin?.userId?.firstName} ${user?.admin?.userId?.lastName}`)

      //   this.emailClient.send({ cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL }, {
      //     to: user?.username,
      //     subject: "Project Onboarded",
      //     html: template
      //   }).toPromise()

      // }
    });

    const templateUrl = join(
      this.configService.get('TEMPLATE_LOCATION'),
      'project_onboarding_employee.html',
    );
    const template = readFileSync(templateUrl)
      .toString()
      .replaceAll(
        '{{name}}',
        `${data?.admin?.userId?.firstName} ${data?.admin?.userId?.lastName}`,
      )
      .replaceAll('{{project_name}}', a?.name)
      .replaceAll(
        '{{designation}}',
        `${data?.admin?.userId?.designation?.designationName}, and You will lead the project`,
      );

    this.emailClient
      .send(
        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
        {
          to: data?.admin?.username,
          subject: 'New Project Onboarded',
          html: template,
        },
      )
      .toPromise();

    return data;
  }

  async listProjectsByUserOrCompany(user?: string, company?: string) {
    try {
      let filter = {};
      if (user) {
        filter = { assignedUser: { $in: [user] } };
      }
      if (company) {
        filter = { ...filter, company };
      }
      const data = await this.projectsRepo
        .find(filter)
        .populate('admin company assignedUser');
      return { message: 'Projects listed successfully.', success: true, data };
    } catch (err) {
      return {
        message: "Something isn't right !",
        success: false,
        error: err ?? err.message,
      };
    }
  }

  async listProjectsByUser(
    user: string,
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
  ) {
    if (!user) {
      throw new HttpException('User Not Found!', HttpStatus.NOT_FOUND);
    }

    const filter = {
      $or: [{ admin: user }, { assignedUser: { $in: [user] } }],
      ...(keyword && {
        name: { $regex: keyword, $options: 'i' },
        description: { $regex: keyword, $options: 'i' },
      }),
    };

    const query = this.projectsRepo
      .find(filter)
      .populate({
        path: 'admin',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate('company')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    let data, total;

    if (page && limit) {
      total = await this.projectsRepo.countDocuments({
        $or: [{ admin: user }, { assignedUser: { $in: [user] } }],
      });
      data = await query
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
    } else {
      data = await query.exec();
    }

    // return { data, pagination: { total, count: data?.length } };

    if (page && limit) {
      return { data, pagination: { total, count: data?.length } };
    }

    return data;

    // return {
    //     data,
    //     ...(page && limit && { pagination: { total, page, limit } }),
    // };
  }

  async listAllProject(
    page?: number,
    limit?: number,
    keyword?: string,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
  ) {
    // Build the filter object for keyword search, if keyword is provided
    const filter = keyword ? { name: { $regex: keyword, $options: 'i' } } : {};

    // Build the query with optional sorting
    const query = this.projectsRepo
      .find(filter)
      .populate({
        path: 'admin',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName email image gender',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName email image gender',
        },
      })
      .populate('company category subCategory')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    let data, total;

    // Apply pagination if both page and limit are provided
    if (page && limit) {
      total = await this.projectsRepo.countDocuments({});
      data = await query.skip((page - 1) * limit).limit(limit).exec();
    } else {
      data = await query.exec();
    }

    if (page && limit) {
      return {
        data,
        pagination: {
          total,
          count: data.length
        }
      }
    }


    return data;
  }

  // async listAllProject() {

  //     const data = await this.projectsRepo
  //         .find()
  //         .populate({
  //             path: 'admin',
  //             select: 'userId userIdRef',
  //             populate: {
  //                 path: 'userId',
  //                 select: 'firstName lastName email',
  //             },
  //         })
  //         .populate({
  //             path: 'assignedUser',
  //             select: 'userId userIdRef',
  //             populate: {
  //                 path: 'userId',
  //                 select: 'firstName lastName email',
  //             },
  //         })
  //         .populate('company');
  //     return data;

  // }

  async getProjectById(projectId: string) {
    const data = await this.projectsRepo
      .findById(projectId)
      .populate({
        path: 'admin',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef',
        populate: {
          path: 'userId',
          select: 'firstName lastName image gender',
        },
      })
      .populate('company');
    if (!data) {
      throw new HttpException('Project Not Found !', HttpStatus.NOT_FOUND);
    }
    return data;
  }

  async updateProject(id: string, updateData: UpdateProjectDto, user: any) {
    const checkProjectAdmin = await this.projectsRepo.findOne({
      _id: id,
      admin: user._id
    })

    this.logger.log(checkProjectAdmin);


    if (!checkProjectAdmin) {
      throw new BadRequestException("Not Enough Permission!")
    }


    const data: any = await this.projectsRepo
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: 'admin',
        select: 'userId userIdRef username',
        populate: {
          path: 'userId',
          select: 'firstName lastName image',
        },
      })
      .populate({
        path: 'assignedUser',
        select: 'userId userIdRef username',
        populate: {
          path: 'userId',
          select: 'firstName lastName image',
        },
      })
      .populate('company');
    if (!data) {
      throw new HttpException('Project Not Found ! ', HttpStatus.NOT_FOUND);
    }

    const templateUrl = join(
      this.configService.get('TEMPLATE_LOCATION'),
      'project_updated.html',
    );

    data?.assignedUser.map((usr) => {
      const template = readFileSync(templateUrl)
        .toString()
        .replaceAll(
          '{{name}}',
          `${usr?.userId?.firstName} ${usr?.userId?.lastName}`,
        )
        .replaceAll('{{project_name}}', data?.name)
        .replaceAll('{{project_id}}', data?._id)
        .replaceAll(
          '{{admin_name}}',
          `${data?.admin?.userId?.firstName} ${data?.admin?.userId?.lastName}`,
        )
        .replaceAll(
          '{{updater_name}}',
          `${user?.userId?.firstName} ${user?.userId?.lastName}`,
        );

      this.emailClient
        .send(
          { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
          {
            to: usr?.username,
            subject: `Project Update : ${data?.name}`,
            html: template,
          },
        )
        .toPromise();
    });

    const template = readFileSync(templateUrl)
      .toString()
      .replaceAll(
        '{{name}}',
        `${data?.admin?.userId?.firstName} ${data?.admin?.userId?.lastName}`,
      )
      .replaceAll('{{project_name}}', data?.name)
      .replaceAll('{{project_id}}', data?._id)
      .replaceAll(
        '{{admin_name}}',
        `${data?.admin?.userId?.firstName} ${data?.admin?.userId?.lastName}`,
      )
      .replaceAll(
        '{{updater_name}}',
        `${user?.userId?.firstName} ${user?.userId?.lastName}`,
      );

    this.emailClient
      .send(
        { cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL },
        {
          to: data?.admin?.username,
          subject: `Project Update : ${data?.name}`,
          html: template,
        },
      )
      .toPromise();

    return data;
  }

  async projectDashboard(user: any) {
    const userId = user?._id;
    const userRole = user?.userId?.role;

    const [projectsAsAdmin, projectsAsAssignedUser, allProjects, totalClients,
      totalCompanies, categories] = await Promise.all([
        this.projectsRepo.find({ admin: userId })
          .populate({
            path: 'admin',
            select: 'userId',
            populate: {
              path: 'userId',
            },
          })
          .populate({
            path: 'assignedUser',
            select: 'userId',
            populate: {
              path: 'userId',
            },
          }),

        this.projectsRepo.find({ assignedUser: userId }).populate({
          path: 'admin',
          select: 'userId',
        }).populate({
          path: 'assignedUser',
          select: 'userId',
        }),
        //this.tasksService.getTasksByUser(userId, false, { limit: 10000, page: 1 }),
        this.listAllProject(),
        this.clientsService.countAllClients(),
        this.clientsService.countAllCompanies(),
        this.projectCategoryService.listCategory()
      ]);

    const totalTasks = await this.taskModel.countDocuments({ assignedUser: userId });
    const pendingTasks = await this.taskModel.countDocuments({ assignedUser: userId, isCompleted: false });
    const completedTasks = await this.taskModel.countDocuments({ assignedUser: userId, isCompleted: true });

    const userProjects = [...projectsAsAdmin, ...projectsAsAssignedUser];
    const uniqueProjects = Array.from(
      new Map(userProjects.map(p => [p._id.toString(), p])).values()
    );

    const categoryStats = categories
      .map(cat => {
        const projectsInCategory = uniqueProjects.filter(project => {
          const categoryId = (() => {
            const category: ProjectCategoryDocument = project?.category as unknown as ProjectCategoryDocument;
            if (category === null || category === undefined) return null;
            if (typeof category === 'object' && category !== null) {
              return category._id?.toString() ?? null;
            }
            return category.toString();
          })();
          return categoryId === cat._id.toString();
        });

        return {
          category: {
            _id: cat._id,
            name: cat.name,
          },
          totalProjects: projectsInCategory.length,
        };
      }).filter(stat => stat.totalProjects > 0);

    const isAdmin = userRole === 'Admin';

    if (isAdmin) {
      return {
        projects: {
          total: uniqueProjects.length,
          data: uniqueProjects,
        },
        totalProjectsInSystem: Array.isArray(allProjects) ? allProjects.length : allProjects?.pagination?.total ?? 0,
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks,
        },
        totalClients,
        totalCompanies,
        categoryStats,
      };
    } else {
      return {
        projects: {
          total: uniqueProjects.length,
          data: uniqueProjects,
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks,
        },
        categoryStats,
      };
    }
  }

  async deleteProject(projectId: string) {
    const data = await this.projectsRepo.findByIdAndDelete(projectId);
    if (!data) {
      throw new HttpException('Project Not Found', HttpStatus.NOT_FOUND);
    }
    return data;
  }
}
