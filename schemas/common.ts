import { z } from 'zod';

// ============================================================
// Common Schemas (공통 스키마)
// ============================================================

/**
 * API 성공 응답 래퍼
 */
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * API 에러 응답
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

/**
 * 페이지네이션 쿼리 파라미터
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * 페이지네이션 메타데이터
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * ID 파라미터 (URL params)
 */
export const IdParamSchema = z.object({
  id: z.string().cuid2(),
});

export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * 날짜 범위 필터
 */
export const DateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;

/**
 * 검색 쿼리
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100).optional(),
  filter: z.record(z.string(), z.string()).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ============================================================
// File Upload Schemas
// ============================================================

/**
 * 파일 업로드 응답
 */
export const FileUploadResponseSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  size: z.number().int().min(0),
  mimeType: z.string(),
  uploadedAt: z.date(),
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

/**
 * 이미지 업로드 검증 (클라이언트)
 */
export const ImageUploadSchema = z
  .instanceof(File)
  .refine((file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
  }, '이미지 파일만 업로드 가능합니다 (JPG, PNG, WebP, GIF)')
  .refine(
    (file) => file.size <= 10 * 1024 * 1024,
    '파일 크기는 10MB 이하여야 합니다'
  );

/**
 * 다중 이미지 업로드 검증
 */
export const MultipleImagesUploadSchema = z
  .array(ImageUploadSchema)
  .min(1, '최소 1개의 이미지가 필요합니다')
  .max(20, '최대 20개까지 업로드 가능합니다');

// ============================================================
// Validation Helpers
// ============================================================

/**
 * CUID2 검증
 */
export const isCuid2 = (value: string): boolean => {
  return z.string().cuid2().safeParse(value).success;
};

/**
 * URL 검증
 */
export const isValidUrl = (value: string): boolean => {
  return z.string().url().safeParse(value).success;
};

/**
 * 날짜 범위 검증
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
};

/**
 * API 응답 래퍼 헬퍼
 */
export const createSuccessResponse = <T>(data: T, message?: string) => ({
  success: true as const,
  data,
  ...(message && { message }),
});

export const createErrorResponse = (
  code: string,
  message: string,
  details?: Record<string, any>
) => ({
  success: false as const,
  error: {
    code,
    message,
    ...(details && { details }),
  },
});

// ============================================================
// Error Codes (에러 코드 정의)
// ============================================================

export const ERROR_CODES = {
  // 인증/권한
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 검증
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // 리소스
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // 비즈니스 로직
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PREMIUM_REQUIRED: 'PREMIUM_REQUIRED',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',

  // 외부 API
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // 서버
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
