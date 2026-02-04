import { z } from 'zod';

// ============================================================
// RSVP Schemas
// ============================================================

// Enums
export const AttendanceStatusSchema = z.enum([
  'ATTENDING',
  'NOT_ATTENDING',
  'MAYBE',
]);

export const MealOptionSchema = z.enum(['ADULT', 'CHILD', 'VEGETARIAN', 'NONE']);

export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;
export type MealOption = z.infer<typeof MealOptionSchema>;

// Base RSVP Schema (DB 모델과 매칭)
export const RSVPSchema = z.object({
  id: z.string().cuid2(),
  invitationId: z.string().cuid2(),

  // Guest Info (encrypted in DB)
  guestName: z.string().max(255),
  guestPhone: z.string().max(500).nullable(),
  guestEmail: z.string().max(500).nullable(),

  // Attendance
  attendance: AttendanceStatusSchema,
  guestCount: z.number().int().min(1).max(10).default(1),
  mealOption: MealOptionSchema.nullable(),
  message: z.string().nullable(),

  submittedAt: z.date(),
});

export type RSVP = z.infer<typeof RSVPSchema>;

// ============================================================
// API Request/Response Schemas
// ============================================================

// RSVP 제출 요청
export const SubmitRSVPRequestSchema = z.object({
  invitationId: z.string().cuid2(),
  guestName: z
    .string()
    .min(1, '이름을 입력하세요')
    .max(255, '이름은 255자를 초과할 수 없습니다'),
  guestPhone: z
    .string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호를 입력하세요')
    .optional()
    .transform((val) => val?.replace(/-/g, '')), // 하이픈 제거
  guestEmail: z.string().email('올바른 이메일을 입력하세요').optional(),
  attendance: AttendanceStatusSchema,
  guestCount: z
    .number()
    .int()
    .min(1, '최소 1명 이상이어야 합니다')
    .max(10, '최대 10명까지 가능합니다')
    .default(1),
  mealOption: MealOptionSchema.optional(),
  message: z.string().max(500, '메시지는 500자를 초과할 수 없습니다').optional(),
});

export type SubmitRSVPRequest = z.infer<typeof SubmitRSVPRequestSchema>;

// RSVP 응답 (민감 정보 암호화된 상태)
export const RSVPResponseSchema = RSVPSchema.omit({
  guestPhone: true,
  guestEmail: true,
}).extend({
  guestPhoneMasked: z.string().optional(), // 010-****-1234
  guestEmailMasked: z.string().optional(), // a***@example.com
});

export type RSVPResponse = z.infer<typeof RSVPResponseSchema>;

// RSVP 통계 응답
export const RSVPStatsResponseSchema = z.object({
  total: z.number().int().min(0),
  attending: z.number().int().min(0),
  notAttending: z.number().int().min(0),
  maybe: z.number().int().min(0),
  totalGuests: z.number().int().min(0), // 동행 인원 포함
  mealStats: z.object({
    adult: z.number().int().min(0),
    child: z.number().int().min(0),
    vegetarian: z.number().int().min(0),
    none: z.number().int().min(0),
  }),
});

export type RSVPStatsResponse = z.infer<typeof RSVPStatsResponseSchema>;

// RSVP 목록 응답 (청첩장 주인만 조회 가능)
export const RSVPListResponseSchema = z.object({
  rsvps: z.array(RSVPResponseSchema),
  stats: RSVPStatsResponseSchema,
  invitationId: z.string().cuid2(),
});

export type RSVPListResponse = z.infer<typeof RSVPListResponseSchema>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * 전화번호 마스킹 (010-1234-5678 → 010-****-5678)
 */
export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/-/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`;
  }
  return '***-****-****';
};

/**
 * 이메일 마스킹 (test@example.com → t***@example.com)
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const maskedLocal = local[0] + '***';
  return `${maskedLocal}@${domain}`;
};

/**
 * 한국 전화번호 검증
 */
export const isValidKoreanPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/-/g, '');
  return /^01[0-9]{8,9}$/.test(cleaned);
};
