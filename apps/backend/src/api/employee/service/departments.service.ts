import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, Designation } from '@lib/database';
import { AddDepartmentDto, AddDesignationDto } from '@lib/dto';

@Injectable()
export class DepartmentsService {
  private logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectModel(Designation.name)
    private readonly designationModel: Model<Designation>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  async addDesignation(addDesignationDto: AddDesignationDto) {
    const dsg = await (
      await this.designationModel.create(addDesignationDto)
    ).populate('department');
    if (!dsg)
      throw new HttpException('No Designation Added', HttpStatus.BAD_REQUEST);
    return dsg;
  }

  async addDepartment(addDepartmentDto: AddDepartmentDto) {
    const dsg = await this.departmentModel.create(addDepartmentDto);
    if (!dsg)
      throw new HttpException('No Department Added', HttpStatus.BAD_REQUEST);
    return dsg;
  }
  async updateDepartment(id: string, updateDepartmentDto: any) {
    const updatedDepartment = await this.departmentModel.findByIdAndUpdate(
      id,
      updateDepartmentDto,
      { new: true },
    );
    if (!updatedDepartment) {
      throw new HttpException(
        'Department not found or not updated',
        HttpStatus.NOT_FOUND,
      );
    }
    return updatedDepartment;
  }
  async updateDesignation(id: string, updateDesignationDto: any) {
    const updatedDsg = await this.designationModel
      .findByIdAndUpdate(
        id,
        updateDesignationDto,
        { new: true }, // Ensures the returned document is the updated one
      )
      .populate('department');

    if (!updatedDsg) {
      throw new HttpException(
        'No Designation Found to Update',
        HttpStatus.NOT_FOUND,
      );
    }

    return updatedDsg;
  }

  async getDesignation(id?: string) {
    if (id) {
      const dsgbydprt = await this.designationModel
        .find({ department: id })
        .populate({ path: 'department' });
      if (!dsgbydprt)
        throw new HttpException('No Designation Found', HttpStatus.BAD_REQUEST);
      return dsgbydprt;
    }
    const dsgall = await this.designationModel
      .find()
      .populate({ path: 'department' });
    if (!dsgall)
      throw new HttpException('No Designation Found', HttpStatus.BAD_REQUEST);
    return dsgall;
  }

  async getDepartment() {
    const dsg = await this.departmentModel.find({});
    if (!dsg)
      throw new HttpException('No Department Found', HttpStatus.BAD_REQUEST);
    return dsg;
  }
  // Delete Designation
  async deleteDesignation(id: string) {
    const deletedDsg = await this.designationModel.findByIdAndDelete(id);
    if (!deletedDsg) {
      throw new HttpException(
        'Designation not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Designation deleted successfully' };
  }

  // Delete Department
  async deleteDepartment(id: string) {
    // Delete the department
    const deletedDept = await this.departmentModel.findByIdAndDelete(id);
    if (!deletedDept) {
      throw new HttpException(
        'Department not found or could not be deleted',
        HttpStatus.NOT_FOUND,
      );
    }

    // Delete all designations under the department
    const deletedDesignations = await this.designationModel.deleteMany({
      department: id,
    });

    return {
      message:
        'Department and its associated designations deleted successfully',
      deletedDesignationsCount: deletedDesignations.deletedCount,
    };
  }
}
