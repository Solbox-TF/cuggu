import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { createErrorResponse, createSuccessResponse, ERROR_CODES } from '@/schemas';

/**
 * API Route Handler 타입
 */
export type ApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Zod 스키마로 요청 body 검증
 *
 * @example
 * const data = await validateRequest(req, CreateInvitationRequestSchema);
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('요청 데이터가 올바르지 않습니다', error);
    }
    throw error;
  }
}

/**
 * Zod 스키마로 쿼리 파라미터 검증
 *
 * @example
 * const query = validateQuery(req, PaginationQuerySchema);
 */
export function validateQuery<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): z.infer<T> {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    return schema.parse(searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('쿼리 파라미터가 올바르지 않습니다', error);
    }
    throw error;
  }
}

/**
 * Zod 스키마로 URL 파라미터 검증
 *
 * @example
 * const { id } = validateParams({ id: params.id }, IdParamSchema);
 */
export function validateParams<T extends z.ZodTypeAny>(
  params: Record<string, string | undefined>,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('URL 파라미터가 올바르지 않습니다', error);
    }
    throw error;
  }
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(createSuccessResponse(data, message), { status });
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, any>
) {
  return NextResponse.json(createErrorResponse(code, message, details), {
    status,
  });
}

// ============================================================
// Custom Error Classes
// ============================================================

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, zodError?: ZodError) {
    const details = zodError
      ? {
          issues: zodError.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }
      : undefined;

    super(ERROR_CODES.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = '인증이 필요합니다') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = '권한이 없습니다') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(ERROR_CODES.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class InsufficientCreditsError extends ApiError {
  constructor(message = 'AI 크레딧이 부족합니다') {
    super(ERROR_CODES.INSUFFICIENT_CREDITS, message, 402);
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Error Handler Wrapper
 *
 * API route를 래핑하여 에러를 자동으로 처리합니다.
 *
 * @example
 * export const POST = withErrorHandler(async (req) => {
 *   const data = await validateRequest(req, CreateInvitationRequestSchema);
 *   // ... 로직
 *   return successResponse(result);
 * });
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return errorResponse(error.code, error.message, error.status, error.details);
      }

      if (error instanceof ZodError) {
        return errorResponse(
          ERROR_CODES.VALIDATION_ERROR,
          '요청 데이터가 올바르지 않습니다',
          400,
          {
            issues: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          }
        );
      }

      // 예상치 못한 에러
      return errorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        '서버 오류가 발생했습니다',
        500
      );
    }
  };
}

/**
 * 인증 확인 헬퍼
 */
export async function requireAuth(req: NextRequest) {
  // TODO: NextAuth.js getServerSession으로 세션 확인
  // const session = await getServerSession();
  // if (!session) {
  //   throw new UnauthorizedError();
  // }
  // return session;
  throw new Error('requireAuth 미구현 - NextAuth.js 세션 확인 필요');
}

/**
 * Rate Limiting 확인 (Upstash Redis)
 */
export async function checkRateLimit(
  req: NextRequest,
  identifier: string,
  limit = 10,
  window = 60 // seconds
): Promise<boolean> {
  // TODO: Upstash Redis로 Rate Limiting 구현
  // const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL });
  // const key = `ratelimit:${identifier}`;
  // const count = await redis.incr(key);
  // if (count === 1) {
  //   await redis.expire(key, window);
  // }
  // return count <= limit;
  return true; // 임시로 항상 통과
}
