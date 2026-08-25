import type {
  CategoryDto,
  CreateKudoRequest,
  KudoDto,
  KudoListResponse,
  MemberDto,
} from '@shared-types';
import { KudosApiError, isErrorEnvelope } from './errors';

const DEFAULT_BASE_URL = 'http://localhost:3000';

function resolveBaseUrl(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } })
    .env?.VITE_API_URL;
  return (fromEnv ?? DEFAULT_BASE_URL).replace(/\/$/, '');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${resolveBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (isErrorEnvelope(body)) {
      throw new KudosApiError(
        body.error.code,
        body.error.message,
        res.status,
        body.error.details,
      );
    }
    throw new KudosApiError('UNKNOWN', res.statusText, res.status);
  }

  return body as T;
}

export const kudosApi = {
  listMembers: () => request<MemberDto[]>('/v1/members'),
  listCategories: () => request<CategoryDto[]>('/v1/categories'),
  listKudos: (params: { limit?: number; cursor?: string | null } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    return request<KudoListResponse>(`/v1/kudos${qs ? `?${qs}` : ''}`);
  },
  createKudo: (dto: CreateKudoRequest) =>
    request<KudoDto>('/v1/kudos', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
