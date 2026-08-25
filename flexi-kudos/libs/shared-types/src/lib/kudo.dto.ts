import type { CategoryDto, CategoryKey } from './category.dto';
import type { MemberDto } from './member.dto';

export interface KudoDto {
  id: string;
  giver: MemberDto;
  receiver: MemberDto;
  category: CategoryDto;
  message: string;
  created_at: string;
}

export interface CreateKudoRequest {
  giver_id: string;
  receiver_id: string;
  category: CategoryKey;
  message: string;
}

export interface KudoListResponse {
  items: KudoDto[];
  next_cursor: string | null;
}
