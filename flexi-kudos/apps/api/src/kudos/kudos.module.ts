import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { KudosController } from './kudos.controller';
import { KudosService } from './kudos.service';

@Module({
  imports: [MembersModule],
  controllers: [KudosController],
  providers: [KudosService],
})
export class KudosModule {}
