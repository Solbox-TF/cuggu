import Anthropic from '@anthropic-ai/sdk';
import { SerializableThemeSchema } from '@/schemas/theme';
import { toJSONSchema } from 'zod';
import { THEME_SYSTEM_PROMPT } from './theme-prompt';
import type { SerializableTheme } from '@/lib/templates/types';

// AI가 하이픈 포함 enum 값을 underscore/다른 형태로 생성하는 경우 정규화
const ENUM_CORRECTIONS: Record<string, Record<string, string>> = {
  type: {
    symbol_with_lines: 'symbol-with-lines',
    'symbol with lines': 'symbol-with-lines',
    diamond_with_lines: 'diamond-with-lines',
    'diamond with lines': 'diamond-with-lines',
    horizontal_line: 'horizontal-line',
    'horizontal line': 'horizontal-line',
    vertical_line: 'vertical-line',
    'vertical line': 'vertical-line',
    gradient_line: 'gradient-line',
    'gradient line': 'gradient-line',
    text_label: 'text-label',
    'text label': 'text-label',
    with_decoration: 'with-decoration',
    'with decoration': 'with-decoration',
    with_sub_label: 'with-sub-label',
    'with sub label': 'with-sub-label',
  },
  preset: {
    slide_x_left: 'slide-x-left',
    slide_x_right: 'slide-x-right',
    slide_y: 'slide-y',
    fade_scale: 'fade-scale',
  },
  layout: {
    bottom_left: 'bottom-left',
    'bottom left': 'bottom-left',
    flex_between: 'flex-between',
    'flex between': 'flex-between',
  },
  nameDivider: {
    lines_only: 'lines-only',
    'lines only': 'lines-only',
    lines_with_ampersand: 'lines-with-ampersand',
    'lines with ampersand': 'lines-with-ampersand',
  },
};

function sanitizeEnums(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeEnums);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string' && ENUM_CORRECTIONS[key]) {
      result[key] = ENUM_CORRECTIONS[key][value] ?? value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeEnums(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

let anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

export interface ThemeGenerationResult {
  theme: SerializableTheme;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Claude API를 사용하여 사용자 프롬프트로부터 웨딩 테마를 생성
 *
 * tool_use 방식으로 JSON 구조를 강제하고, Zod 구조 검증 후 반환.
 * safelist 검증은 caller(API route)에서 처리하여 저장 후 검증 가능하도록 함.
 */
export async function generateTheme(userPrompt: string): Promise<ThemeGenerationResult> {
  const client = getClient();

  // Zod v4 → JSON Schema 변환 (tool input_schema용)
  const jsonSchema = toJSONSchema(SerializableThemeSchema);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8192,
    system: THEME_SYSTEM_PROMPT,
    tools: [{
      name: 'create_wedding_theme',
      description: 'Creates a complete wedding invitation theme with all styling configurations. Every field must use valid Tailwind CSS classes.',
      input_schema: jsonSchema as Anthropic.Tool.InputSchema,
    }],
    tool_choice: { type: 'tool', name: 'create_wedding_theme' },
    messages: [{
      role: 'user',
      content: `다음 컨셉으로 웨딩 청첩장 테마를 만들어주세요: ${userPrompt}`,
    }],
  });

  // tool_use 블록 추출
  const toolUse = response.content.find(
    (block): block is Anthropic.ContentBlock & { type: 'tool_use' } =>
      block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('AI가 테마를 생성하지 못했습니다');
  }

  // AI 출력 정규화 (하이픈 enum 값 교정) → Zod 구조 검증
  const sanitized = sanitizeEnums(toolUse.input);
  const parsed = SerializableThemeSchema.parse(sanitized);

  return {
    theme: parsed as unknown as SerializableTheme,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
