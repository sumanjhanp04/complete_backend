import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccessGuard } from '@lib/guards';
import { ClientsService } from './clients.service';
import {
  ClientDto,
  CompanyDto,
  ListQueryDTO,
  UpdateClientDto,
  UpdateCompanyDto,
} from '@lib/dto';
import { HasAccess, UserDetails, UserTypeAccess } from '@lib/decorators';
import { CLIENTS_API_MAPS } from '@lib/common';
import { EMPLOYEE_TYPE_MAP } from '@lib/database';

@ApiTags('ClientsApi')
@UseGuards(AccessGuard)
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  private logger = new Logger(ClientsController.name);

  constructor(private readonly clientService: ClientsService) { }

  @Post()
  @HasAccess()
  async createClient(@Body() clientDto: ClientDto, @UserDetails() user: any) {
    const data = await this.clientService.createClient({ ...clientDto, createdBy: user?._id });
    return data;
  }

  @Get()
  @HasAccess()
  async listClients(@Query() query: ListQueryDTO) {
    const { keyword, limit, page, sort, sortBy } = query;
    const data = await this.clientService.listClients(
      page,
      limit,
      keyword,
      sortBy,
      sort,
    );
    return data;
  }



  @Put(":id")
  @HasAccess()
  async updateClientDetails(@Param("id") id: string, @Body() clientData: UpdateClientDto, @UserDetails() user: any) {
    return await this.clientService.updateClient(id, { ...clientData, updatedBy: user?._id });
  }

  @MessagePattern({ cmd: CLIENTS_API_MAPS.UPDATE_CLIENT_PROFILE })
  async updateClient(@Payload() clientData: { id: string; image: string }) {
    return await this.clientService.updateClient(clientData.id, {
      image: clientData.image,
    });
  }

  @Post('company')
  @HasAccess()
  async createCompany(
    @Body() companyDto: CompanyDto,
    @UserDetails() user: any,
  ) {
    const data = await this.clientService.createCompany(companyDto);
    return data;
  }

  @Get('company')
  @UserTypeAccess(EMPLOYEE_TYPE_MAP.EMPLOYEE)
  // @HasAccess()

  async listCompany(@Query() query: ListQueryDTO) {
    const { keyword, limit, page, sort, sortBy } = query;
    const data = await this.clientService.listAllCompany(
      page,
      limit,
      keyword,
      sortBy,
      sort,
    );
    return data;
  }

  @Put('company/:id')
  @HasAccess()
  async updateCompany(
    @Param('id') id: string,
    @Body() body: UpdateCompanyDto,
    @UserDetails() user: any,
  ) {
    const data = await this.clientService.updateClientCompany(id, body);
    return data;
  }
}
