'use client';

import { motion } from 'framer-motion';
import { AI_MODELS, AIModel } from '@/lib/ai/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
  batchSize?: number;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  disabled = false,
  batchSize = 4,
}: ModelSelectorProps) {
  const models = Object.values(AI_MODELS);

  const getFacePreservationColor = (level: AIModel['facePreservation']) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
    }
  };

  const getSpeedColor = (speed: AIModel['speed']) => {
    switch (speed) {
      case 'fast':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'slow':
        return 'text-red-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🔬 AI 모델 선택 (개발 모드)</h3>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
          DEV ONLY
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          const totalCost = (model.costPerImage * batchSize).toFixed(4);

          return (
            <motion.button
              key={model.id}
              onClick={() => !disabled && onModelSelect(model.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : undefined}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
              className={`
                relative rounded-lg border-2 p-4 text-left transition-all
                ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <svg
                    className="h-6 w-6 text-pink-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              <div className="space-y-2">
                {/* Model Name */}
                <div>
                  <h4 className="font-bold text-gray-900">{model.name}</h4>
                  <p className="text-xs text-gray-500">{model.provider}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700">{model.description}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full bg-gray-100 px-2 py-1 ${getFacePreservationColor(model.facePreservation)}`}
                  >
                    얼굴: {model.facePreservation}
                  </span>
                  <span
                    className={`rounded-full bg-gray-100 px-2 py-1 ${getSpeedColor(model.speed)}`}
                  >
                    속도: {model.speed}
                  </span>
                </div>

                {/* Cost */}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-600">
                      ${model.costPerImage.toFixed(4)}/장
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      총 ${totalCost} ({batchSize}장)
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
