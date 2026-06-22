import {
  extractFileExtensionFromBase64,
  generateRandomString,
} from '@lib/common';

import { ProjectDocumentCreateDto } from '@lib/dto';

// Database Schemas
import {
  ProjectCredential,
  ProjectDocument,
} from '@lib/database';

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import { Model } from 'mongoose';

/**
 * ProjectDetailsService
 *
 * Handles:
 * - Project Documents
 * - Project Credentials
 *
 * Features:
 * - Upload Documents
 * - List Documents
 * - Update Documents
 * - Delete Documents
 * - Create Credentials
 * - List Credentials
 * - Update Credentials
 * - Delete Credentials
 *
 * Structure:
 *
 * Project
 *   │
 *   ├── Documents
 *   │      ├── Requirement.pdf
 *   │      ├── Design.pdf
 *   │      └── API.docx
 *   │
 *   └── Credentials
 *          ├── GitHub
 *          ├── AWS
 *          └── Database
 */

@Injectable()
export class ProjectDetailsService {
  /**
   * Logger for debugging
   */
  private logger = new Logger(
    ProjectDetailsService.name,
  );

  constructor(
    /**
     * Project Document Collection
     */
    @InjectModel(ProjectDocument.name)
    private projectDocumentModel: Model<ProjectDocument>,

    /**
     * Project Credential Collection
     */
    @InjectModel(ProjectCredential.name)
    private projectCredentialModel: Model<ProjectCredential>,

    /**
     * Future File Upload Service
     *
     * Used for AWS S3 / Local Upload
     */
    // private readonly fileUploadService: FileserviceService,
  ) { }

  // ============================================================
  // CREATE PROJECT DOCUMENT
  // ============================================================

  /**
   * Upload and create project document.
   *
   * Example:
   *
   * {
   *   name: "Requirement Document",
   *   project: "projectId",
   *   document: "base64string"
   * }
   */
  async createProjectDocument(
    data: ProjectDocumentCreateDto,
  ) {
    try {
      /**
       * Extract file extension
       * from base64 string
       *
       * Example:
       * pdf
       * jpg
       * png
       */
      const validateFile =
        extractFileExtensionFromBase64(
          data.document,
        );

      if (validateFile) {
        /**
         * Generate unique filename
         *
         * Example:
         * RequirementDoc_A7BC92JKL.pdf
         */
        const fileName =
          data.name +
          '_' +
          generateRandomString(10) +
          '.' +
          validateFile;

        this.logger.log(fileName);

        /**
         * Future Upload Logic
         *
         * Upload file to:
         * - AWS S3
         * - Local Storage
         *
         * Currently commented
         */
        // await this.fileUploadService.fileUpload(
        //   Buffer.from(
        //     data.document.split(',')[1],
        //     'base64',
        //   ),
        //   fileName,
        // );

        this.logger.log(
          'uploaded :' + fileName,
        );

        /**
         * Create document record
         */
        const createdDocument =
          new this.projectDocumentModel(
            data,
          );

        const dt =
          await createdDocument.save();

        return {
          message: 'Document Created !',
          data: dt,
          success: true,
        };
      }

      return {
        message: 'There was an error',
        success: false,
      };
    } catch (err) {
      return {
        message: 'Something went wrong',
        success: false,
        err,
      };
    }
  }

  // ============================================================
  // LIST PROJECT DOCUMENTS
  // ============================================================

  /**
   * Returns all documents
   * belonging to a project.
   *
   * Example:
   *
   * Project A
   *   ├── Requirement.pdf
   *   ├── Design.pdf
   *   └── API Collection.json
   */
  async listProjectDocuments(
    projectId: string,
  ) {
    try {
      const data =
        await this.projectDocumentModel
          .find({
            project: projectId,
          })
          .exec();

      return {
        message: 'Document Listed !',
        data,
        success: true,
      };
    } catch (e) {
      return {
        message: 'Something went wrong',
        success: false,
      };
    }
  }

  // ============================================================
  // UPDATE PROJECT DOCUMENT
  // ============================================================

  /**
   * Updates document metadata.
   *
   * Example:
   *
   * Before:
   * Requirement_v1.pdf
   *
   * After:
   * Requirement_v2.pdf
   */
  async updateProjectDocument(
    documentId: string,
    data: any,
  ) {
    return await this.projectDocumentModel
      .findByIdAndUpdate(
        documentId,
        data,
        {
          new: true,
        },
      )
      .exec();
  }

  // ============================================================
  // DELETE PROJECT DOCUMENT
  // ============================================================

  /**
   * Deletes a project document.
   */
  async deleteProjectDocument(
    documentId: string,
  ) {
    return await this.projectDocumentModel
      .findByIdAndDelete(documentId)
      .exec();
  }

  // ============================================================
  // CREATE PROJECT CREDENTIAL
  // ============================================================

  /**
   * Creates project credentials.
   *
   * Example:
   *
   * {
   *   platform: "GitHub",
   *   username: "admin",
   *   password: "********"
   * }
   */
  async createProjectCredential(
    data: any,
  ) {
    const createdCredential =
      new this.projectCredentialModel(
        data,
      );

    return createdCredential.save();
  }

  // ============================================================
  // LIST PROJECT CREDENTIALS
  // ============================================================

  /**
   * Returns all credentials
   * belonging to a project.
   *
   * Example:
   *
   * Project A
   *   ├── GitHub
   *   ├── AWS
   *   ├── Database
   *   └── cPanel
   */
  async listProjectCredentials(
    projectId: string,
  ) {
    return await this.projectCredentialModel
      .find({
        project: projectId,
      })
      .exec();
  }

  // ============================================================
  // UPDATE PROJECT CREDENTIAL
  // ============================================================

  /**
   * Updates project credentials.
   */
  async updateProjectCredential(
    credentialId: string,
    data: any,
  ) {
    return await this.projectCredentialModel
      .findByIdAndUpdate(
        credentialId,
        data,
        {
          new: true,
        },
      )
      .exec();
  }

  // ============================================================
  // DELETE PROJECT CREDENTIAL
  // ============================================================

  /**
   * Deletes project credential.
   */
  async deleteProjectCredential(
    credentialId: string,
  ) {
    return await this.projectCredentialModel
      .findByIdAndDelete(
        credentialId,
      )
      .exec();
  }
}