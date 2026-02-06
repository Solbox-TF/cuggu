#!/usr/bin/env npx tsx
/**
 * 사내 AI 서버 - 모든 스타일 테스트
 *
 * 사용법:
 *   npx tsx scripts/test-internal-ai-all-styles.ts [이미지경로]
 */

import * as fs from 'fs';
import * as path from 'path';

const INTERNAL_API_URL =
  process.env.INTERNAL_AI_URL || 'http://192.168.0.208:19010';

const STYLE_PROMPTS: Record<string, string> = {
  CLASSIC_STUDIO:
    'Transform the scene into a classic, elegant studio wedding portrait. The couple is posing formally. The bride wears a sophisticated white lace gown with a long veil, and the groom wears a tailored black tuxedo with a bow tie. The background is a clean, minimalist interior with soft, professional studio lighting and subtle cream-colored floral arrangements.',
  OUTDOOR_GARDEN:
    'A romantic outdoor wedding photo in a lush, blooming garden. The couple is smiling candidly, holding hands. The bride wears a flowing bohemian-style wedding dress with floral details, and the groom wears a light beige linen suit. Sunlight filters through the green leaves, creating a soft, dreamy atmosphere with many flowers in the background.',
  SUNSET_BEACH:
    'A dramatic wedding photo on a tropical beach during golden hour sunset. The couple is embracing by the ocean. The bride wears a simple, elegant beach wedding gown, and the groom is in a relaxed white shirt and khaki trousers. The sky is filled with vibrant orange, pink, and purple hues reflecting on the water.',
  TRADITIONAL_HANBOK:
    'A traditional Korean wedding portrait set in an ancient palace courtyard. The couple wears elaborate, colorful traditional Korean wedding Hanbok with intricate embroidery. They are standing respectfully. The background features historical Korean architecture with vibrant Dancheong colors and a stone wall under clear daylight.',
  VINTAGE_CINEMATIC:
    'A vintage, cinematic wedding photograph with a retro film grain look. The style is 1950s or 60s. The bride wears a vintage tea-length dress and a birdcage veil, the groom wears a retro wool suit. The colors are slightly muted and warm. They are posing in front of an old, classic car on a cobblestone street.',
  LUXURY_HOTEL:
    'A glamorous and luxurious wedding photo inside a grand hotel ballroom. The bride is in a voluminous ball gown with sparkling details and a tiara, the groom in a sharp tuxedo. They are on a grand staircase. The background is opulent, featuring large crystal chandeliers, marble columns, and rich architectural details with dramatic, warm lighting.',
  CITY_LIFESTYLE:
    'A candid, lifestyle wedding snapshot in a bustling city street scene (e.g., New York or Paris). The couple is laughing and walking across a crosswalk, holding hands. They are wearing modern, chic wedding attire. The background shows city architecture, blurred pedestrians, and yellow taxi cabs. The vibe is energetic and joyful.',
  ENCHANTED_FOREST:
    'A fairytale wedding photo set in a magical, enchanted forest. The lighting is misty and soft with dappled sunbeams. The bride wears an ethereal, flowing tulle dress with vine and flower motifs, maybe a floral crown. The background is moss-covered trees and soft glowing lights, creating a dreamlike quality.',
  BLACK_AND_WHITE:
    "A timeless black and white wedding portrait. The focus is entirely on the couple's emotion and connection. It's a close-up or medium shot. The lighting is dramatic and high-contrast, highlighting textures of the wedding dress and suit. The background is simple and dark to keep the attention on the subjects.",
  MINIMALIST_GALLERY:
    'A minimalist, modern wedding photo suitable for an art gallery. The couple is posing artistically against a completely plain, seamless bright white studio wall. No props. The bride wears a very modern, structured architectural wedding dress, and the groom wears a sleek, contemporary monochrome suit. The lighting is clean and even.',
};

async function main() {
  const imagePath = process.argv[2];

  if (!imagePath) {
    console.log(
      '사용법: npx tsx scripts/test-internal-ai-all-styles.ts [이미지경로]'
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`파일을 찾을 수 없습니다: ${resolvedPath}`);
    process.exit(1);
  }

  // output 폴더 생성
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`입력 이미지: ${resolvedPath}`);
  console.log(`서버 URL: ${INTERNAL_API_URL}`);
  console.log(`출력 폴더: ${outputDir}`);
  console.log('---');

  const imageBuffer = fs.readFileSync(resolvedPath);
  console.log(`이미지 크기: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
  console.log('');

  const styles = Object.entries(STYLE_PROMPTS);
  const totalStyles = styles.length;

  for (let i = 0; i < totalStyles; i++) {
    const [styleName, stylePrompt] = styles[i];
    const num = String(i + 1).padStart(2, '0');

    console.log(`[${num}/${totalStyles}] ${styleName} 생성 중...`);

    const prompt = `handsome Korean man, ${stylePrompt}`;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('width', '512');
    formData.append('height', '512');
    formData.append('num_inference_steps', '20');
    formData.append('guidance_scale', '3.5');
    formData.append('pulid_weight', '1');
    formData.append('pulid_start_at', '0.1');

    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    formData.append('images', blob, 'input.png');

    const startTime = Date.now();

    try {
      const response = await fetch(`${INTERNAL_API_URL}/generate-face`, {
        method: 'POST',
        body: formData,
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ 실패 (${response.status}): ${errorText}`);
        continue;
      }

      const resultBuffer = Buffer.from(await response.arrayBuffer());
      const seed = response.headers.get('X-Seed') || 'unknown';

      const outputPath = `${outputDir}/${num}-${styleName}.png`;
      fs.writeFileSync(outputPath, resultBuffer);

      console.log(`  ✅ 완료 (${elapsed}s) - seed: ${seed}`);
      console.log(`     저장: ${outputPath}`);
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`  ❌ 에러 (${elapsed}s):`, error);
    }
  }

  console.log('');
  console.log('=== 모든 스타일 생성 완료 ===');
  console.log(`결과물: ${outputDir}/`);
}

main();
