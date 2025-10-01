import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RabbitmqService } from '../queue/rabitmq.service';
import { Request } from '@prisma/client';
/*This file can be updated. Working with database can be moved to separate 
  file (repository). It adds one more layer for working with database, but 
  it's easier to change database in the future if necessary or modify some methods*/

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private rabbit: RabbitmqService,
  ) {}

  async create(input: CreateRequestDto): Promise<Request> {
    const request = await this.prisma.request.create({
      data: {
        text: input.text,
      },
    });
    await this.rabbit.sendMessage({ requestId: request.id });
    return request;
  }

  async findAll(): Promise<Request[]> {
    return this.prisma.request.findMany();
  }
}
