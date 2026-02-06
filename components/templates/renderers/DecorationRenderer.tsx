import type { DecorationConfig } from '@/lib/templates/types';

interface DecorationRendererProps {
  config: DecorationConfig | undefined;
}

export function DecorationRenderer({ config }: DecorationRendererProps) {
  if (!config || config.type === 'none') return null;

  switch (config.type) {
    case 'emoji':
      return (
        <div className={config.className ?? ''}>
          <span className={config.symbolClass ?? ''}>{config.emoji}</span>
        </div>
      );

    case 'symbol-with-lines':
      return (
        <div className={`flex items-center justify-center ${config.className ?? ''}`}>
          <div className={`h-px ${config.lineSize ?? 'w-12'} bg-gradient-to-r from-transparent ${config.lineColor ?? 'to-rose-200'}`} />
          <span className={config.symbolClass ?? 'text-rose-300 text-lg mx-3'}>{config.symbol}</span>
          <div className={`h-px ${config.lineSize ?? 'w-12'} bg-gradient-to-l from-transparent ${config.lineColor ?? 'to-rose-200'}`} />
        </div>
      );

    case 'diamond-with-lines':
      return (
        <div className={`flex items-center justify-center ${config.className ?? ''}`}>
          <div className={`h-px ${config.lineSize ?? 'w-16'} bg-gradient-to-r from-transparent ${config.lineColor ?? 'to-amber-400/60'}`} />
          <div className={config.symbolClass ?? 'w-2 h-2 rotate-45 border border-amber-400/60 mx-4'} />
          <div className={`h-px ${config.lineSize ?? 'w-16'} bg-gradient-to-l from-transparent ${config.lineColor ?? 'to-amber-400/60'}`} />
        </div>
      );

    case 'text-label':
      return (
        <p className={config.className ?? ''}>{config.text}</p>
      );
  }
}
