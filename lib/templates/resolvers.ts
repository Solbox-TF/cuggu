import type { AnimationConfig } from './types';

type MotionTarget = { opacity: number; x?: number; y?: number; scale?: number };

interface ResolvedAnimation {
  initial: MotionTarget;
  whileInView: MotionTarget;
  transition?: Record<string, number>;
}

interface ResolvedEnterAnimation {
  initial: MotionTarget;
  animate: MotionTarget;
  transition: Record<string, number>;
}

function getInitialAndTarget(preset: AnimationConfig['preset']): { initial: MotionTarget; target: MotionTarget } {
  switch (preset) {
    case 'fade':
      return { initial: { opacity: 0 }, target: { opacity: 1 } };
    case 'slide-x-left':
      return { initial: { opacity: 0, x: -20 }, target: { opacity: 1, x: 0 } };
    case 'slide-x-right':
      return { initial: { opacity: 0, x: 20 }, target: { opacity: 1, x: 0 } };
    case 'slide-y':
      return { initial: { opacity: 0, y: 20 }, target: { opacity: 1, y: 0 } };
    case 'scale':
      return { initial: { opacity: 0, scale: 0.95 }, target: { opacity: 1, scale: 1 } };
    case 'fade-scale':
      return { initial: { opacity: 0, scale: 0.9 }, target: { opacity: 1, scale: 1 } };
  }
}

/**
 * AnimationConfig → framer-motion whileInView props (스크롤 트리거)
 */
export function resolveAnimation(config: AnimationConfig, index?: number): ResolvedAnimation {
  const delay = (config.delay ?? 0) + (index !== undefined ? (config.staggerDelay ?? 0) * index : 0);
  const duration = config.duration;
  const { initial, target } = getInitialAndTarget(config.preset);

  const transition: Record<string, number> = {};
  if (delay > 0) transition.delay = delay;
  if (duration !== undefined) transition.duration = duration;

  return {
    initial,
    whileInView: target,
    ...(Object.keys(transition).length > 0 ? { transition } : {}),
  };
}

/**
 * AnimationConfig → framer-motion initial/animate props (페이지 진입 애니메이션, 커버용)
 */
export function resolveEnterAnimation(config: AnimationConfig): ResolvedEnterAnimation {
  const { initial, target } = getInitialAndTarget(config.preset);

  const transition: Record<string, number> = {};
  if (config.delay !== undefined && config.delay > 0) transition.delay = config.delay;
  if (config.duration !== undefined) transition.duration = config.duration;

  return { initial, animate: target, transition };
}
