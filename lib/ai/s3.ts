import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createId } from '@paralleldrive/cuid2';
import { env } from './env';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * S3 key로 공개 URL 생성
 *
 * CLOUDFRONT_DOMAIN이 설정되어 있으면 CloudFront URL 반환,
 * 없으면 S3 직접 URL fallback.
 */
export function getPublicUrl(key: string): string {
  if (env.CLOUDFRONT_DOMAIN) {
    return `https://${env.CLOUDFRONT_DOMAIN}/${key}`;
  }
  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * S3에 이미지 업로드
 *
 * @param buffer - 이미지 버퍼
 * @param contentType - MIME 타입
 * @param prefix - 폴더 경로 (예: 'gallery/userId')
 * @returns S3 key와 공개 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  prefix: string = 'ai-photos'
): Promise<{ key: string; url: string }> {
  const ext =
    contentType === 'image/webp'
      ? 'webp'
      : contentType === 'image/png'
        ? 'png'
        : 'jpg';
  const key = `${prefix}/${createId()}.${ext}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  await upload.done();

  return { key, url: getPublicUrl(key) };
}

/**
 * 허용된 이미지 호스트인지 검증
 *
 * CloudFront, S3 도메인만 허용.
 * 사용자 입력 URL을 DB에 저장하기 전에 반드시 호출.
 */
export function isAllowedImageHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = [
      env.CLOUDFRONT_DOMAIN,
      `${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`,
    ].filter(Boolean);
    return allowed.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * 외부 URL의 이미지를 다운로드하여 S3에 복사
 *
 * Replicate CDN 등 외부 URL → S3 영구 저장용.
 * 다운로드 실패 시 에러 throw.
 */
export async function copyToS3(
  imageUrl: string,
  prefix: string
): Promise<{ key: string; url: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${imageUrl}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/png';

  return uploadToS3(buffer, contentType, prefix);
}

/**
 * URL에서 S3 key 추출
 *
 * CloudFront URL과 S3 직접 URL 모두 지원.
 * 유효하지 않은 URL이면 null 반환.
 */
export function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);

    // CloudFront URL: https://{domain}/{key}
    if (env.CLOUDFRONT_DOMAIN && parsed.hostname === env.CLOUDFRONT_DOMAIN) {
      return parsed.pathname.slice(1);
    }

    // S3 URL: https://{bucket}.s3.{region}.amazonaws.com/{key}
    const s3Host = `${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`;
    if (parsed.hostname === s3Host) {
      return parsed.pathname.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * S3에서 객체 일괄 삭제 (1000개씩 배치, best-effort)
 *
 * 삭제 실패해도 throw하지 않고 로그만 남김.
 * @returns 삭제 성공 건수
 */
export async function deleteFromS3(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  let deleted = 0;

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    try {
      const result = await s3.send(
        new DeleteObjectsCommand({
          Bucket: env.S3_BUCKET_NAME,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
      deleted += batch.length - (result.Errors?.length || 0);
    } catch (err) {
      console.error(`[S3] 삭제 실패 (batch ${i}):`, err);
    }
  }

  return deleted;
}
