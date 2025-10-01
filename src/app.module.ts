import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';
import { RabitmqModule } from './queue/rabitmq.module';

@Module({
  imports: [PrismaModule, RequestsModule, RabitmqModule],
})
export class AppModule {}
