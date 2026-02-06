import Replicate from 'replicate';
import { env } from './env';
import { AI_CONFIG } from './constants';
import { AI_MODELS, DEFAULT_MODEL } from './models';

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

/**
 * AI 생성 비용 (USD per image)
 * Replicate Flux 1.1 Pro 기준
 */
const COST_PER_IMAGE = parseFloat(process.env.REPLICATE_COST_PER_IMAGE || '0.04');

export type AIStyle =
  | 'CLASSIC_STUDIO'
  | 'OUTDOOR_GARDEN'
  | 'SUNSET_BEACH'
  | 'TRADITIONAL_HANBOK'
  | 'VINTAGE_CINEMATIC'
  | 'LUXURY_HOTEL'
  | 'CITY_LIFESTYLE'
  | 'ENCHANTED_FOREST'
  | 'BLACK_AND_WHITE'
  | 'MINIMALIST_GALLERY';

const STYLE_PROMPTS: Record<AIStyle, string> = {
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
    'A timeless black and white wedding portrait. The focus is entirely on the couple\'s emotion and connection. It\'s a close-up or medium shot. The lighting is dramatic and high-contrast, highlighting textures of the wedding dress and suit. The background is simple and dark to keep the attention on the subjects.',
  MINIMALIST_GALLERY:
    'A minimalist, modern wedding photo suitable for an art gallery. The couple is posing artistically against a completely plain, seamless bright white studio wall. No props. The bride wears a very modern, structured architectural wedding dress, and the groom wears a sleek, contemporary monochrome suit. The lighting is clean and even.',
};

/**
 * Replicate로 웨딩 사진 4장 생성
 *
 * @param imageUrl - 원본 사진 URL (S3)
 * @param style - 웨딩 스타일
 * @param role - 신랑/신부 구분
 * @param modelId - 사용할 AI 모델 (개발 모드)
 * @returns 생성된 4장의 URL 배열
 */
export async function generateWeddingPhotos(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  modelId?: string
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const selectedModelId = modelId || DEFAULT_MODEL;

  // 모델 ID로 찾기 (키가 아닌 id 필드로)
  const model = Object.values(AI_MODELS).find((m) => m.id === selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const basePrompt = STYLE_PROMPTS[style];

  // 성별별 의상 추가
  const genderPrompt =
    role === 'GROOM'
      ? 'handsome Korean groom in elegant black tuxedo and bow tie'
      : 'beautiful Korean bride in white wedding dress';

  const prompt = `${genderPrompt}, ${basePrompt}`;

  // TODO: Replicate Webhook으로 비동기 처리
  // - 현재: 동기 대기 (20-40초 블로킹)
  // - 개선: webhook으로 PENDING 상태 즉시 반환, 완료 시 업데이트
  // - 참고: https://replicate.com/docs/webhooks

  // 모델별 input 파라미터 구성
  const getModelInput = (i: number) => {
    const baseInput = {
      prompt: `${prompt}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${i + 1}`,
      image: imageUrl,
    };

    // 모델별 특화 파라미터
    switch (model.id) {
      case 'flux-pro':
      case 'flux-dev':
        return {
          ...baseInput,
          aspect_ratio: '3:4',
          output_format: 'png',
          output_quality: 90,
          prompt_strength: 0.85,
        };
      case 'photomaker':
        return {
          ...baseInput,
          num_steps: 20,
          style_strength_ratio: 20,
          input_image: imageUrl,
          style_name: 'Photographic (Default)',
        };
      case 'sdxl-faceid':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, low resolution, blurry',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        };
      case 'face-to-sticker':
        return {
          ...baseInput,
          steps: 20,
          width: 768,
          height: 1024,
          upscale: false,
        };
      case 'instant-id':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, worst quality, low resolution',
          num_inference_steps: 30,
          guidance_scale: 5.0,
          ip_adapter_scale: 0.8,
        };
      case 'face-to-many':
        return {
          ...baseInput,
          style: 'Photographic (Default)',
          prompt_strength: 4.5,
        };
      case 'pulid':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, low resolution',
          num_inference_steps: 4,
          guidance_scale: 1.2,
          id_weight: 1.0,
        };
      case 'face-swap':
        return {
          target_image: imageUrl,
          swap_image: imageUrl,
          cache_days: 0,
        };
      default:
        return {
          ...baseInput,
          output_format: 'png',
        };
    }
  };

  // 4장 순차 생성
  const urls: string[] = [];
  const predictionIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const prediction = await replicate.predictions.create({
      model: model.replicateModel,
      input: getModelInput(i) as any,
    });

    predictionIds.push(prediction.id);

    // 완료 대기
    const completed = await replicate.wait(prediction);
    const output = completed.output as string;

    if (typeof output !== 'string') {
      throw new Error(
        `Unexpected Replicate output format: expected string, got ${typeof output}`
      );
    }

    urls.push(output);
  }

  // 비용 계산 (모델별)
  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    replicateId: predictionIds[0],
    cost,
  };
}

/**
 * 스트리밍 방식 웨딩 사진 생성 (1장씩 콜백)
 */
export async function generateWeddingPhotosStream(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  onImageGenerated: (index: number, url: string) => void,
  modelId?: string
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const selectedModelId = modelId || DEFAULT_MODEL;
  const model = Object.values(AI_MODELS).find((m) => m.id === selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const basePrompt = STYLE_PROMPTS[style];
  const genderPrompt =
    role === 'GROOM'
      ? 'handsome Korean groom in elegant black tuxedo and bow tie'
      : 'beautiful Korean bride in white wedding dress';

  const prompt = `${genderPrompt}, ${basePrompt}`;

  // 모델별 input 파라미터 구성
  const getModelInput = (i: number) => {
    const baseInput = {
      prompt: `${prompt}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${i + 1}`,
      image: imageUrl,
    };

    switch (model.id) {
      case 'flux-pro':
      case 'flux-dev':
        return {
          ...baseInput,
          aspect_ratio: '3:4',
          output_format: 'png',
          output_quality: 90,
          prompt_strength: 0.85,
        };
      case 'photomaker':
        return {
          ...baseInput,
          num_steps: 20,
          style_strength_ratio: 20,
          input_image: imageUrl,
          style_name: 'Photographic (Default)',
        };
      default:
        return {
          ...baseInput,
          output_format: 'png',
        };
    }
  };

  const urls: string[] = [];
  const predictionIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const prediction = await replicate.predictions.create({
      model: model.replicateModel,
      input: getModelInput(i) as any,
    });

    predictionIds.push(prediction.id);

    const completed = await replicate.wait(prediction);
    const output = completed.output as string;

    if (typeof output !== 'string') {
      throw new Error(
        `Unexpected Replicate output format: expected string, got ${typeof output}`
      );
    }

    urls.push(output);

    // 콜백으로 알림
    onImageGenerated(i, output);
  }

  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    replicateId: predictionIds[0],
    cost,
  };
}
