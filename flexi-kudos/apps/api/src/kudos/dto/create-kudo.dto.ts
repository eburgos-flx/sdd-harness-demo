import { IsString, IsUUID } from 'class-validator';
import { IsMessageLength } from '../validators/message-length.validator';

export class CreateKudoDto {
  @IsUUID('4', { message: 'giver_id must be a valid UUID' })
  giver_id!: string;

  @IsUUID('4', { message: 'receiver_id must be a valid UUID' })
  receiver_id!: string;

  @IsString({ message: 'category must be a string' })
  category!: string;

  @IsString({ message: 'message must be a string' })
  @IsMessageLength()
  message!: string;
}
