import { Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabitmq.service';

@Global()
@Module({
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabitmqModule {}
