import { Global, Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Global()
@Module({
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [],
})
export class RequestsModule {}
