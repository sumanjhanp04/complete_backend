import {
  extractFileExtensionFromBase64,
  generateRandomString,
} from '@lib/common';
import { ProjectDocumentCreateDto } from '@lib/dto';
// import { FileserviceService } from '@lib/fileservice';
import { ProjectCredential, ProjectDocument } from '@lib/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProjectDetailsService {
  private logger = new Logger(ProjectDetailsService.name);

  constructor(
    @InjectModel(ProjectDocument.name)
    private projectDocumentModel: Model<ProjectDocument>,
    @InjectModel(ProjectCredential.name)
    private projectCredentialModel: Model<ProjectCredential>,
    // private readonly fileUploadService: FileserviceService,
  ) {}

  async createProjectDocument(data: ProjectDocumentCreateDto) {
    try {
      const validateFile = extractFileExtensionFromBase64(data.document);
      if (validateFile) {
        const fileName =
          data.name + '_' + generateRandomString(10) + '.' + validateFile;
        this.logger.log(fileName);
        // await this.fileUploadService.fileUpload(
        //   Buffer.from(data.document.split(',')[1], 'base64'),
        //   fileName,
        // );
        this.logger.log('uploaded :' + fileName);
        const createdDocument = new this.projectDocumentModel(data);
        const dt = createdDocument.save();
        return { message: 'Document Created !', data: dt, success: true };
      } else return { message: 'There was an error', success: false };
    } catch (err) {
      return { message: 'Something went wrong', success: false, err };
    }
  }

  async listProjectDocuments(projectId: string) {
    try {
      const data = await this.projectDocumentModel
        .find({ project: projectId })
        .exec();
      return { message: 'Document Listed !', data, success: true };
    } catch (e) {
      return { message: 'Something went wrong', success: false };
    }
  }

  async updateProjectDocument(documentId: string, data: any) {
    return await this.projectDocumentModel
      .findByIdAndUpdate(documentId, data, { new: true })
      .exec();
  }

  async deleteProjectDocument(documentId: string) {
    return await this.projectDocumentModel.findByIdAndDelete(documentId).exec();
  }

  async createProjectCredential(data: any) {
    const createdCredential = new this.projectCredentialModel(data);
    return createdCredential.save();
  }

  async listProjectCredentials(projectId: string) {
    return await this.projectCredentialModel
      .find({ project: projectId })
      .exec();
  }

  async updateProjectCredential(credentialId: string, data: any) {
    return await this.projectCredentialModel
      .findByIdAndUpdate(credentialId, data, { new: true })
      .exec();
  }

  async deleteProjectCredential(credentialId: string) {
    return await this.projectCredentialModel
      .findByIdAndDelete(credentialId)
      .exec();
  }
}

// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class ProjectDetailsService {}
