#!/usr/bin/env npx tsx
/**
 * 사내 AI 서버 직접 테스트 스크립트
 *
 * 사용법:
 *   npx tsx scripts/test-internal-ai.ts [이미지경로]
 *
 * 예시:
 *   npx tsx scripts/test-internal-ai.ts ./test-face.jpg
 *   npx tsx scripts/test-internal-ai.ts ~/Pictures/photo.png
 *
 * 결과:
 *   ./output-{timestamp}.png 파일로 저장
 */

import * as fs from 'fs';
import * as path from 'path';

const INTERNAL_API_URL =
  process.env.INTERNAL_AI_URL || 'http://192.168.0.208:19010';

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.log('사용법: npx tsx scripts/test-internal-ai.ts [이미지경로]');
    console.log('예시: npx tsx scripts/test-internal-ai.ts ./test-face.jpg');
    process.exit(1);
  }

  const resolvedPath = path.resolve(imagePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`파일을 찾을 수 없습니다: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`입력 이미지: ${resolvedPath}`);
  console.log(`서버 URL: ${INTERNAL_API_URL}`);
  console.log('---');

  // 이미지 읽기
  const imageBuffer = fs.readFileSync(resolvedPath);
  console.log(`이미지 크기: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

  // FormData 구성
  const formData = new FormData();
  formData.append(
    'prompt',
    'handsome Korean man in elegant black tuxedo, professional wedding portrait, studio lighting, high quality'
  );
  formData.append('width', '768');
  formData.append('height', '1024');
  formData.append('num_inference_steps', '8');
  formData.append('guidance_scale', '1.2');
  formData.append('pulid_weight', '1.0');
  formData.append('pulid_start_at', '0.0');

  // 이미지 첨부
  const uint8Array = new Uint8Array(imageBuffer);
  const blob = new Blob([uint8Array], { type: 'image/png' });
  formData.append('images', blob, 'input.png');

  console.log('AI 서버 호출 중...');
  const startTime = Date.now();

  try {
    const response = await fetch(`${INTERNAL_API_URL}/generate-face`, {
      method: 'POST',
      body: formData,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`서버 에러 (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    const seed = response.headers.get('X-Seed') || 'unknown';

    console.log(`생성 완료 (${elapsed}s)`);
    console.log(`시드: ${seed}`);
    console.log(`결과 크기: ${(resultBuffer.length / 1024).toFixed(1)} KB`);

    // 결과 저장
    const timestamp = Date.now();
    const outputPath = `./output-${timestamp}.png`;
    fs.writeFileSync(outputPath, resultBuffer);
    console.log(`저장됨: ${outputPath}`);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`요청 실패 (${elapsed}s):`, error);
    process.exit(1);
  }
}

main();
