import { z } from 'zod';

// ============================================================
// Invitation Schemas
// ============================================================

// Enums
export const TemplateCategorySchema = z.enum([
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'FLORAL',
  'MINIMAL',
]);

export const TemplateTierSchema = z.enum(['FREE', 'PREMIUM']);

export const InvitationStatusSchema = z.enum([
  'DRAFT',
  'PUBLISHED',
  'EXPIRED',
  'DELETED',
]);

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
export type TemplateTier = z.infer<typeof TemplateTierSchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

// Base Invitation Schema (DB 모델과 매칭)
export const InvitationSchema = z.object({
  id: z.string().cuid2(),
  userId: z.string().cuid2(),
  templateId: z.string().cuid2(),

  // Wedding Info
  groomName: z.string().max(255),
  brideName: z.string().max(255),
  weddingDate: z.date(),
  venueName: z.string().max(255),
  venueAddress: z.string().max(500).nullable(),

  // Content
  introMessage: z.string().nullable(),
  galleryImages: z.array(z.string().url()).nullable(),
  aiPhotoUrl: z.string().url().max(500).nullable(),

  // Security
  isPasswordProtected: z.boolean().default(false),
  passwordHash: z.string().max(255).nullable(),

  // Analytics
  viewCount: z.number().int().min(0).default(0),
  status: InvitationStatusSchema.default('DRAFT'),
  expiresAt: z.date().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

// ============================================================
// Template Schemas
// ============================================================

export const TemplateConfigSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  layout: z.object({
    sections: z.array(z.string()),
    spacing: z.enum(['compact', 'normal', 'relaxed']),
  }),
});

export const TemplateSchema = z.object({
  id: z.string().cuid2(),
  name: z.string().max(255),
  category: TemplateCategorySchema,
  tier: TemplateTierSchema.default('FREE'),
  thumbnail: z.string().url().max(500),
  config: TemplateConfigSchema,
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});

export type Template = z.infer<typeof TemplateSchema>;
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

// ============================================================
// API Request/Response Schemas
// ============================================================

// 청첩장 생성 요청
export const CreateInvitationRequestSchema = z.object({
  templateId: z.string().cuid2(),
  groomName: z.string().min(1, '신랑 이름을 입력하세요').max(255),
  brideName: z.string().min(1, '신부 이름을 입력하세요').max(255),
  weddingDate: z.coerce.date().refine((date) => date > new Date(), {
    message: '결혼식 날짜는 미래여야 합니다',
  }),
  venueName: z.string().min(1, '예식장 이름을 입력하세요').max(255),
  venueAddress: z.string().max(500).optional(),
  introMessage: z.string().max(1000).optional(),
});

export type CreateInvitationRequest = z.infer<
  typeof CreateInvitationRequestSchema
>;

// 청첩장 업데이트 요청
export const UpdateInvitationRequestSchema = z.object({
  groomName: z.string().min(1).max(255).optional(),
  brideName: z.string().min(1).max(255).optional(),
  weddingDate: z.coerce.date().optional(),
  venueName: z.string().min(1).max(255).optional(),
  venueAddress: z.string().max(500).optional(),
  introMessage: z.string().max(1000).optional(),
  galleryImages: z.array(z.string().url()).max(100).optional(),
  aiPhotoUrl: z.string().url().max(500).optional(),
  isPasswordProtected: z.boolean().optional(),
  status: InvitationStatusSchema.optional(),
});

export type UpdateInvitationRequest = z.infer<
  typeof UpdateInvitationRequestSchema
>;

// 청첩장 공개 설정 요청
export const PublishInvitationRequestSchema = z.object({
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(50)
    .optional(),
});

export type PublishInvitationRequest = z.infer<
  typeof PublishInvitationRequestSchema
>;

// 청첩장 비밀번호 검증 요청
export const VerifyPasswordRequestSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export type VerifyPasswordRequest = z.infer<typeof VerifyPasswordRequestSchema>;

// 청첩장 응답 (공개용 - 민감 정보 제외)
export const InvitationResponseSchema = InvitationSchema.omit({
  passwordHash: true,
  userId: true,
});

export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

// 청첩장 목록 응답
export const InvitationListResponseSchema = z.object({
  invitations: z.array(
    InvitationSchema.pick({
      id: true,
      groomName: true,
      brideName: true,
      weddingDate: true,
      status: true,
      viewCount: true,
      createdAt: true,
    })
  ),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export type InvitationListResponse = z.infer<
  typeof InvitationListResponseSchema
>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * 청첩장 ID 검증 (nanoid)
 */
export const isValidInvitationId = (id: string): boolean => {
  return z.string().cuid2().safeParse(id).success;
};

/**
 * 갤러리 이미지 개수 제한 검증
 */
export const validateGalleryLimit = (
  images: string[],
  isPremium: boolean
): boolean => {
  const limit = isPremium ? 100 : 20;
  return images.length <= limit;
};
