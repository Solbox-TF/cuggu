/**
 * AI 생성용 스타일/성별 프롬프트
 * 프로바이더 무관 - 모든 AI 모델에서 공통으로 사용
 */

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
 * 스타일 + 성별 기반 프롬프트 생성
 */
export function buildPrompt(style: AIStyle, role: 'GROOM' | 'BRIDE'): string {
  const basePrompt = STYLE_PROMPTS[style];
  const genderPrompt =
    role === 'GROOM'
      ? 'handsome Korean groom in elegant black tuxedo and bow tie'
      : 'beautiful Korean bride in white wedding dress';
  return `${genderPrompt}, ${basePrompt}`;
}

/**
 * 얼굴 보존 지시 포함 프롬프트 생성
 */
export function buildPromptWithFacePreservation(
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  variationIndex: number,
): string {
  const base = buildPrompt(style, role);
  return `${base}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${variationIndex + 1}`;
}
