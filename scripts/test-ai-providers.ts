#!/usr/bin/env npx tsx
/**
 * AI 프로바이더 테스트 스크립트
 *
 * 각 프로바이더(Replicate, OpenAI, Gemini)의 API 키와 이미지 생성을 검증.
 * S3, DB, 인증 없이 순수 API 호출만 테스트.
 *
 * 사용법:
 *   npx tsx scripts/test-ai-providers.ts [provider] [이미지경로]
 *
 * 예시:
 *   npx tsx scripts/test-ai-providers.ts openai ./test-face.jpg
 *   npx tsx scripts/test-ai-providers.ts gemini
 *   npx tsx scripts/test-ai-providers.ts gemini-edit ./test-face.jpg
 *   npx tsx scripts/test-ai-providers.ts all ./test-face.jpg
 *
 * 환경 변수 (.env.local 로드):
 *   REPLICATE_API_TOKEN, OPENAI_API_KEY, GOOGLE_AI_API_KEY
 *
 * 결과:
 *   ./output-{provider}-{timestamp}.png 파일로 저장
 */

import * as fs from 'fs';
import { config } from 'dotenv';

// .env.local 로드
config({ path: '.env.local' });

const TEST_PROMPT =
  'beautiful Korean bride in white wedding dress, Transform the scene into a classic, elegant studio wedding portrait, keeping the exact same face, identical facial features';

const TEXT_ONLY_PROVIDERS = ['dalle3'];

// ============================================================
// Replicate
// ============================================================
async function testReplicate(imageUrl: string): Promise<Buffer> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not set');

  console.log('  모델: flux-dev (저렴한 모델로 테스트)');

  const { default: Replicate } = await import('replicate');
  const replicate = new Replicate({ auth: token });

  const prediction = await replicate.predictions.create({
    model: 'black-forest-labs/flux-dev',
    input: {
      prompt: TEST_PROMPT,
      image: imageUrl,
      aspect_ratio: '3:4',
      output_format: 'png',
      output_quality: 90,
      prompt_strength: 0.85,
    },
  });

  console.log('  prediction ID:', prediction.id);

  const completed = await replicate.wait(prediction);
  const output = completed.output as string;

  if (typeof output !== 'string') {
    throw new Error(`Unexpected output: ${typeof output}`);
  }

  console.log('  CDN URL:', output.slice(0, 80) + '...');

  const res = await fetch(output);
  return Buffer.from(await res.arrayBuffer());
}

// ============================================================
// OpenAI (gpt-image-1)
// ============================================================
async function testOpenAI(imagePath: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  console.log('  모델: gpt-image-1 (이미지 편집)');

  const { default: OpenAI, toFile } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const imageBuffer = fs.readFileSync(imagePath);
  const imageFile = await toFile(imageBuffer, 'reference.png', { type: 'image/png' });

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: [imageFile],
    prompt: TEST_PROMPT,
    size: '1024x1536',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data in response');

  return Buffer.from(b64, 'base64');
}

// ============================================================
// OpenAI (dall-e-3) - 텍스트 전용
// ============================================================
async function testDalle3(): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  console.log('  모델: dall-e-3 (텍스트 전용, 참조 이미지 없음)');

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: TEST_PROMPT,
    size: '1024x1792',
    quality: 'standard',
    response_format: 'b64_json',
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data in response');

  return Buffer.from(b64, 'base64');
}

// ============================================================
// Gemini (gemini-2.5-flash-image) - 참조 이미지 + 이미지 생성
// ============================================================
async function testGemini(imagePath: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  console.log('  모델: gemini-2.5-flash-image (참조 이미지 기반)');

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: TEST_PROMPT },
        ],
      },
    ],
    config: {
      responseModalities: ['image', 'text'],
    },
  });

  const candidates = response.candidates;
  if (!candidates?.length) throw new Error('No candidates in response');

  const parts = candidates[0].content?.parts;
  if (!parts) throw new Error('No content parts');

  const imagePart = parts.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error('No image data in response');

  return Buffer.from(imagePart.inlineData.data, 'base64');
}

// ============================================================
// Main
// ============================================================
async function runTest(provider: string, imagePath: string) {
  const timestamp = Date.now();
  let buffer: Buffer;

  console.log(`\n[${provider.toUpperCase()}] 테스트 시작...`);
  const start = Date.now();

  try {
    switch (provider) {
      case 'replicate': {
        const raw = fs.readFileSync(imagePath);
        const mime = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const dataUri = `data:${mime};base64,${raw.toString('base64')}`;
        buffer = await testReplicate(dataUri);
        break;
      }
      case 'openai':
        buffer = await testOpenAI(imagePath);
        break;
      case 'dalle3':
        buffer = await testDalle3();
        break;
      case 'gemini':
        buffer = await testGemini(imagePath);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const outFile = `output-${provider}-${timestamp}.png`;
    fs.writeFileSync(outFile, buffer);
    console.log(`  성공! ${elapsed}초 소요`);
    console.log(`  저장: ./${outFile} (${(buffer.length / 1024).toFixed(0)}KB)`);
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`  실패 (${elapsed}초):`);
    console.error(`  ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  const provider = process.argv[2];
  const imagePath = process.argv[3];

  if (!provider) {
    console.log('AI 프로바이더 테스트 스크립트\n');
    console.log('사용법:');
    console.log('  npx tsx scripts/test-ai-providers.ts <provider> <이미지경로>\n');
    console.log('provider:');
    console.log('  replicate    - Flux Dev (REPLICATE_API_TOKEN)');
    console.log('  openai       - GPT Image 1 (OPENAI_API_KEY)');
    console.log('  dalle3       - DALL-E 3, 이미지 불필요 (OPENAI_API_KEY)');
    console.log('  gemini       - Gemini 2.5 Flash Image (GOOGLE_AI_API_KEY)');
    console.log('  all          - 전체 테스트\n');
    console.log('예시:');
    console.log('  npx tsx scripts/test-ai-providers.ts openai ./test-face.jpg');
    console.log('  npx tsx scripts/test-ai-providers.ts gemini');
    console.log('  npx tsx scripts/test-ai-providers.ts all ./test-face.jpg');
    process.exit(1);
  }

  if (!TEXT_ONLY_PROVIDERS.includes(provider) && provider !== 'all' && !imagePath) {
    console.error('이미지 경로가 필요합니다 (dalle3, gemini 제외)');
    process.exit(1);
  }

  if (imagePath && !fs.existsSync(imagePath)) {
    console.error(`파일 없음: ${imagePath}`);
    process.exit(1);
  }

  console.log('='.repeat(50));
  console.log('AI 프로바이더 테스트');
  console.log('='.repeat(50));

  if (imagePath) {
    const stat = fs.statSync(imagePath);
    console.log(`입력 이미지: ${imagePath} (${(stat.size / 1024).toFixed(0)}KB)`);
  }

  // 환경 변수 체크
  console.log('\n환경 변수:');
  console.log(`  REPLICATE_API_TOKEN: ${process.env.REPLICATE_API_TOKEN ? '설정됨' : '미설정'}`);
  console.log(`  OPENAI_API_KEY:      ${process.env.OPENAI_API_KEY ? '설정됨' : '미설정'}`);
  console.log(`  GOOGLE_AI_API_KEY:   ${process.env.GOOGLE_AI_API_KEY ? '설정됨' : '미설정'}`);

  if (provider === 'all') {
    const targets = ['replicate', 'openai', 'dalle3', 'gemini'];
    for (const p of targets) {
      await runTest(p, imagePath);
    }
    console.log('\n' + '='.repeat(50));
    console.log('전체 테스트 완료');
  } else {
    await runTest(provider, imagePath);
  }
}

main().catch(console.error);
