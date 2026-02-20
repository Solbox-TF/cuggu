import { z } from 'zod';
import { noProfanity } from '@/lib/profanity-filter';

// ============================================================
// Guestbook Schemas
// ============================================================

// 방명록 작성 요청
export const SubmitGuestbookEntrySchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(100, '이름은 100자를 초과할 수 없습니다')
    .refine(noProfanity, '부적절한 표현이 포함되어 있습니다'),
  message: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(500, '메시지는 500자를 초과할 수 없습니다')
    .refine(noProfanity, '부적절한 표현이 포함되어 있습니다'),
  isPrivate: z.boolean().default(false),
});

export type SubmitGuestbookEntry = z.infer<typeof SubmitGuestbookEntrySchema>;

// 방명록 항목 (공개뷰용)
export const GuestbookEntryPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

export type GuestbookEntryPublic = z.infer<typeof GuestbookEntryPublicSchema>;

// 방명록 항목 (소유자용 — 비공개/숨김 상태 포함)
export const GuestbookEntryOwnerSchema = GuestbookEntryPublicSchema.extend({
  isPrivate: z.boolean(),
  isHidden: z.boolean(),
});

export type GuestbookEntryOwner = z.infer<typeof GuestbookEntryOwnerSchema>;

// 공개 목록 응답 (커서 페이지네이션)
export const GuestbookListPublicSchema = z.object({
  entries: z.array(GuestbookEntryPublicSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int().min(0),
});

export type GuestbookListPublic = z.infer<typeof GuestbookListPublicSchema>;

// 소유자 목록 응답
export const GuestbookListOwnerSchema = z.object({
  entries: z.array(GuestbookEntryOwnerSchema),
  total: z.number().int().min(0),
  hiddenCount: z.number().int().min(0),
  privateCount: z.number().int().min(0),
});

export type GuestbookListOwner = z.infer<typeof GuestbookListOwnerSchema>;

// 소유자 수정 (숨김 토글)
export const PatchGuestbookEntrySchema = z.object({
  isHidden: z.boolean(),
});

export type PatchGuestbookEntry = z.infer<typeof PatchGuestbookEntrySchema>;
