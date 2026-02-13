import { z } from 'zod';

// ============================================================
// AI Generation Schemas
// ============================================================

// Enums
export const AIStyleSchema = z.enum([
  // Legacy (하위 호환)
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
  // New styles
  'CLASSIC_STUDIO',
  'OUTDOOR_GARDEN',
  'SUNSET_BEACH',
  'TRADITIONAL_HANBOK',
  'VINTAGE_CINEMATIC',
  'LUXURY_HOTEL',
  'CITY_LIFESTYLE',
  'ENCHANTED_FOREST',
  'BLACK_AND_WHITE',
  'MINIMALIST_GALLERY',
]);

export const AIGenerationStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export type AIStyle = z.infer<typeof AIStyleSchema>;
export type AIGenerationStatus = z.infer<typeof AIGenerationStatusSchema>;

// Base AI Generation Schema (DB 모델과 매칭)
export const AIGenerationSchema = z.object({
  id: z.string().cuid2(),
  userId: z.string().cuid2(),

  originalUrl: z.string().url().max(500),
  style: AIStyleSchema,
  generatedUrls: z.array(z.string().url()).nullable(), // 4 URLs
  selectedUrl: z.string().url().max(500).nullable(),
  status: AIGenerationStatusSchema.default('PENDING'),
  creditsUsed: z.number().int().min(1).default(1),
  cost: z.number().min(0), // USD
  replicateId: z.string().max(255).nullable(), // deprecated
  providerJobId: z.string().max(255).nullable(),
  providerType: z.enum(['replicate', 'openai', 'gemini']).nullable(),

  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export type AIGeneration = z.infer<typeof AIGenerationSchema>;

// ============================================================
// API Request/Response Schemas
// ============================================================

// AI 사진 생성 요청
export const GenerateAIPhotoRequestSchema = z.object({
  imageFile: z.instanceof(File).refine(
    (file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    },
    { message: 'JPG, PNG, WebP 형식만 지원합니다' }
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    { message: '파일 크기는 10MB 이하여야 합니다' }
  ),
  style: AIStyleSchema,
});

// 서버에서 받는 요청 (FormData)
export const GenerateAIPhotoServerRequestSchema = z.object({
  style: AIStyleSchema,
  imageUrl: z.string().url(), // 이미 업로드된 이미지 URL
});

export type GenerateAIPhotoRequest = z.infer<typeof GenerateAIPhotoRequestSchema>;
export type GenerateAIPhotoServerRequest = z.infer<typeof GenerateAIPhotoServerRequestSchema>;

// AI 사진 선택 요청
export const SelectAIPhotoRequestSchema = z.object({
  generationId: z.string().cuid2(),
  selectedUrl: z.string().url(),
});

export type SelectAIPhotoRequest = z.infer<typeof SelectAIPhotoRequestSchema>;

// AI 생성 응답
export const AIGenerationResponseSchema = AIGenerationSchema.omit({
  userId: true,
  cost: true,
  replicateId: true,
  providerJobId: true,
  providerType: true,
});

export type AIGenerationResponse = z.infer<typeof AIGenerationResponseSchema>;

// AI 생성 상태 응답
export const AIGenerationStatusResponseSchema = z.object({
  id: z.string().cuid2(),
  status: AIGenerationStatusSchema,
  generatedUrls: z.array(z.string().url()).nullable(),
  progress: z.number().min(0).max(100).optional(), // 진행률 (%)
  errorMessage: z.string().optional(),
});

export type AIGenerationStatusResponse = z.infer<typeof AIGenerationStatusResponseSchema>;

// AI 크레딧 정보 응답
export const AICreditsResponseSchema = z.object({
  userId: z.string().cuid2(),
  aiCredits: z.number().int().min(0),
  premiumPlan: z.enum(['FREE', 'PREMIUM']),
  totalGenerated: z.number().int().min(0),
  canGenerate: z.boolean(),
});

export type AICreditsResponse = z.infer<typeof AICreditsResponseSchema>;

// ============================================================
// Replicate API Schemas
// ============================================================

// Replicate API 요청
export const ReplicateAPIRequestSchema = z.object({
  version: z.string(),
  input: z.object({
    image: z.string().url(), // Base64 or URL
    prompt: z.string(),
    negative_prompt: z.string().optional(),
    num_outputs: z.number().int().min(1).max(4).default(4),
    guidance_scale: z.number().min(1).max(20).default(7.5),
    num_inference_steps: z.number().int().min(1).max(50).default(25),
  }),
});

export type ReplicateAPIRequest = z.infer<typeof ReplicateAPIRequestSchema>;

// Replicate API 응답
export const ReplicateAPIResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['starting', 'processing', 'succeeded', 'failed', 'canceled']),
  output: z.array(z.string().url()).nullable(),
  error: z.string().nullable(),
  logs: z.string().optional(),
  metrics: z
    .object({
      predict_time: z.number().optional(),
    })
    .optional(),
});

export type ReplicateAPIResponse = z.infer<typeof ReplicateAPIResponseSchema>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * 이미지 파일 검증
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, WebP 형식만 지원합니다' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '파일 크기는 10MB 이하여야 합니다' };
  }

  return { valid: true };
};

/**
 * AI 크레딧 충분 여부 확인
 */
export const hasEnoughCredits = (userCredits: number, requiredCredits: number = 1): boolean => {
  return userCredits >= requiredCredits;
};

