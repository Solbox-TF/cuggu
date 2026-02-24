export const BGM_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a'] as const,
  S3_PREFIX: 'bgm',
} as const;
