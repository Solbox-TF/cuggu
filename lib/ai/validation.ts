/**
 * 이미지 파일 시그니처(Magic Number) 검증
 *
 * MIME type은 위변조 가능하므로, 바이너리 헤더로 실제 이미지 파일인지 확인.
 * PNG, JPEG, WebP 지원.
 */
export function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // PNG: 89 50 4E 47
  const isPNG =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // JPEG: FF D8 FF
  const isJPEG =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // WebP: "RIFF" + 4 bytes size + "WEBP"
  const isWebP =
    buffer.slice(0, 4).toString() === 'RIFF' &&
    buffer.slice(8, 12).toString() === 'WEBP';

  return isPNG || isJPEG || isWebP;
}
