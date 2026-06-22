import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// DTOs
import {
    CreateSubtaskDto,
    UpdateSubtaskDto,
} from '@lib/dto';

// Database Schema
import { SubTasks } from '@lib/database';

// Common Constants
import { USER_POPULATION_FIELDS } from '@lib/common';

/**
 * SubTasksService
 *
 * Handles:
 * - Create Subtasks
 * - List Subtasks
 * - Update Subtasks
 * - Delete Subtasks
 *
 * Relationship:
 *
 * Project
 *   │
 *   └── Task
 *          │
 *          ├── Subtask 1
 *          ├── Subtask 2
 *          ├── Subtask 3
 *          └── Subtask N
 *
 */
@Injectable()
export class SubTasksService {
    /**
     * Logger for debugging
     */
    private readonly logger =
        new Logger(SubTasksService.name);

    constructor(
        /**
         * Inject SubTask MongoDB Model
         */
        @InjectModel(SubTasks.name)
        private readonly subtaskModel: Model<SubTasks>,
    ) { }

    // ============================================================
    // CREATE SUBTASK
    // ============================================================

    /**
     * Creates a new subtask.
     *
     * Example:
     *
     * Parent Task:
     * "Develop Authentication Module"
     *
     * Subtasks:
     * - Create Login API
     * - Create Register API
     * - Create JWT Middleware
     */
    async createSubtask(
        subtask: CreateSubtaskDto,
    ) {
        /**
         * Create new subtask document
         */
        const newSubtask =
            new this.subtaskModel(subtask);

        /**
         * Save into MongoDB
         */
        return await newSubtask.save();
    }

    // ============================================================
    // GET ALL SUBTASKS
    // ============================================================

    /**
     * Returns all subtasks of a task.
     *
     * Optional Filter:
     * assigned user
     *
     * Query Example:
     *
     * {
     *   task: "taskId",
     *   user: "userId"
     * }
     */
    async getAllSubtasks(
        query: {
            task: string;
            user: string;
        },
    ) {
        const { task, user } = query;

        /**
         * Base filter
         */
        const queryFilter: any = {
            task,
        };

        /**
         * Filter by assigned user
         */
        if (user && user !== '') {
            queryFilter['assignedTo'] = user;
        }

        /**
         * Find subtasks
         */
        return await this.subtaskModel
            .find(queryFilter)

            /**
             * Populate Users
             */
            .populate({
                path:
                    'assignedTo createdBy updatedBy',

                select: 'userId userIdRef',

                populate: {
                    path: 'userId',

                    select:
                        USER_POPULATION_FIELDS,
                },
            })

            /**
             * Incomplete tasks first
             *
             * false -> true
             */
            .sort({
                isCompleted: 1,
            })

            .exec();
    }

    // ============================================================
    // UPDATE SUBTASK
    // ============================================================

    /**
     * Updates a subtask.
     *
     * Example:
     *
     * Before:
     * {
     *   title: "Create Login API",
     *   isCompleted: false
     * }
     *
     * After:
     * {
     *   title: "Create Login API",
     *   isCompleted: true
     * }
     */
    async updateSubtasks(
        id: string,
        updateSubtask: UpdateSubtaskDto,
    ) {
        /**
         * Debug Logs
         */
        this.logger.debug(
            'update the subtask is calling',
        );

        this.logger.log({
            id,
            ...updateSubtask,
        });

        /**
         * Update Subtask
         */
        return await this.subtaskModel
            .findByIdAndUpdate(
                id,
                updateSubtask,
            );

        /**
         * Note:
         * Currently missing:
         * { new: true }
         *
         * So MongoDB returns OLD document.
         */
    }

    // ============================================================
    // DELETE SUBTASK
    // ============================================================

    /**
     * Deletes a subtask.
     *
     * Example:
     *
     * Subtask:
     * "Create JWT Middleware"
     *
     * Result:
     * Deleted
     */
    async deleteSubtasks(
        id: string,
    ) {
        return await this.subtaskModel
            .findByIdAndDelete(id);
    }
}