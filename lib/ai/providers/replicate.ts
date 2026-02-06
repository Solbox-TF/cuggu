/**
 * Replicate 프로바이더
 */

import Replicate from 'replicate';
import type { GenerationProvider, ImageOutput } from './types';
import type { AIModel } from '../models';

function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN is required for Replicate models');
  }
  return new Replicate({ auth: token });
}

function getModelInput(
  modelId: string,
  prompt: string,
  imageUrl: string,
  variationIndex: number,
): Record<string, unknown> {
  const fullPrompt = `${prompt}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${variationIndex + 1}`;
  const baseInput = { prompt: fullPrompt, image: imageUrl };

  switch (modelId) {
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
    case 'instant-id':
      return {
        ...baseInput,
        negative_prompt: 'bad quality, worst quality, low resolution',
        num_inference_steps: 30,
        guidance_scale: 5.0,
        ip_adapter_scale: 0.8,
      };
    default:
      return {
        ...baseInput,
        output_format: 'png',
      };
  }
}

export const replicateProvider: GenerationProvider = {
  providerType: 'replicate',

  async generateImage({ prompt, imageUrl, modelConfig, variationIndex }): Promise<ImageOutput> {
    const replicate = getReplicateClient();
    const input = getModelInput(modelConfig.id, prompt, imageUrl, variationIndex);

    const prediction = await replicate.predictions.create({
      model: modelConfig.providerModel as `${string}/${string}`,
      input,
    });

    const completed = await replicate.wait(prediction);
    const output = completed.output as string;

    if (typeof output !== 'string') {
      throw new Error(
        `Unexpected Replicate output format: expected string, got ${typeof output}`
      );
    }

    return {
      type: 'url',
      data: output,
      providerJobId: prediction.id,
    };
  },
};
