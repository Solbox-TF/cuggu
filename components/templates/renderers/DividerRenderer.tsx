import type { DividerConfig } from '@/lib/templates/types';

interface DividerRendererProps {
  config: DividerConfig | undefined;
}

export function DividerRenderer({ config }: DividerRendererProps) {
  if (!config || config.type === 'none') return null;

  switch (config.type) {
    case 'horizontal-line':
      return (
        <div className={config.className ?? ''}>
          <div className={`h-px ${config.size ?? 'w-full'} ${config.color ?? 'bg-stone-200'}`} />
        </div>
      );

    case 'vertical-line':
      return (
        <div className={`flex justify-center ${config.className ?? ''}`}>
          <div className={`w-px ${config.size ?? 'h-12'} ${config.color ?? 'bg-stone-200'}`} />
        </div>
      );

    case 'gradient-line':
      return (
        <div className={config.className ?? ''}>
          <div className={`h-px bg-gradient-to-r ${config.color ?? 'from-transparent via-stone-300 to-transparent'} ${config.size ?? ''}`} />
        </div>
      );
  }
}
