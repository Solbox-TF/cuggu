import { z } from 'zod';

// ============================================================
// User Schemas
// ============================================================

// Enums
export const UserRoleSchema = z.enum(['USER', 'ADMIN']);
export const PremiumPlanSchema = z.enum(['FREE', 'PREMIUM']);

// Base User Schema (DB 모델과 매칭)
export const UserSchema = z.object({
  id: z.string().cuid2(),
  email: z.string().email().max(255),
  emailVerified: z.date().nullable(),
  name: z.string().max(255).nullable(),
  image: z.string().url().max(500).nullable(),
  role: UserRoleSchema.default('USER'),
  premiumPlan: PremiumPlanSchema.default('FREE'),
  aiCredits: z.number().int().min(0).default(2),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type PremiumPlan = z.infer<typeof PremiumPlanSchema>;

// ============================================================
// Auth Schemas (API 요청/응답)
// ============================================================

// 회원가입 요청
export const SignupRequestSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호는 100자를 초과할 수 없습니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 대소문자와 숫자를 포함해야 합니다'
    ),
  name: z.string().min(1, '이름을 입력하세요').max(255),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

// 로그인 요청
export const LoginRequestSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// 프로필 업데이트 요청
export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().max(500).optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// 사용자 응답 (민감 정보 제외)
export const UserResponseSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  premiumPlan: true,
  aiCredits: true,
  createdAt: true,
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * 이메일 검증 (한국 이메일 도메인 포함)
 */
export const validateEmail = (email: string): boolean => {
  return LoginRequestSchema.pick({ email: true }).safeParse({ email }).success;
};

/**
 * 비밀번호 강도 검증
 */
export const validatePassword = (password: string): boolean => {
  return SignupRequestSchema.pick({ password: true }).safeParse({ password })
    .success;
};
