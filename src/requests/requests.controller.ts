import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestObject } from './dto/request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() input: CreateRequestDto): Promise<RequestObject> {
    return this.requestsService.create(input);
  }

  @Get()
  async findAll(): Promise<RequestObject[]> {
    return this.requestsService.findAll();
  }
}
