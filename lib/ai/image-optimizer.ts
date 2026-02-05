import sharp from 'sharp';
import { GALLERY_CONFIG } from './constants';

/**
 * 갤러리용 이미지 최적화
 *
 * - 1200px 이내로 리사이징 (원본보다 작으면 유지)
 * - WebP 변환 (quality 85)
 * - 10MB 원본 → ~200-400KB
 */
export async function optimizeForGallery(buffer: Buffer): Promise<Buffer> {
  const { WIDTH, HEIGHT, QUALITY } = GALLERY_CONFIG.OPTIMIZE;

  return sharp(buffer)
    .resize(WIDTH, HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();
}
