import type { ReactNode } from 'react';
import type { HeadingConfig } from '@/lib/templates/types';

interface HeadingRendererProps {
  config: HeadingConfig | undefined;
  /** 기본 헤딩 클래스 (config가 없을 때 fallback) */
  fallbackClass?: string;
  children: ReactNode;
}

export function HeadingRenderer({ config, fallbackClass, children }: HeadingRendererProps) {
  if (!config) {
    return <h2 className={fallbackClass ?? ''}>{children}</h2>;
  }

  switch (config.type) {
    case 'default':
      return <h2 className={config.headingClass ?? fallbackClass ?? ''}>{children}</h2>;

    case 'with-decoration':
      return (
        <div className={config.className ?? 'text-center mb-10'}>
          <span className={config.decorationClass ?? 'text-2xl opacity-60'}>{config.decoration}</span>
          <h2 className={config.headingClass ?? 'text-xl md:text-2xl font-light text-stone-800 mt-2'}>{children}</h2>
        </div>
      );

    case 'with-sub-label':
      return (
        <div className={config.className ?? 'text-center mb-10'}>
          <p className={config.subLabelClass ?? ''}>{config.subLabel}</p>
          <h2 className={config.headingClass ?? ''}>{children}</h2>
        </div>
      );

    case 'text-label':
      return (
        <div className={config.className ?? ''}>
          {config.lineColor && (
            <div className={`flex items-center justify-center ${config.className ?? 'gap-3 mb-8'}`}>
              <div className={`h-px ${config.lineSize ?? 'w-12'} bg-gradient-to-r from-transparent ${config.lineColor}`} />
              <h2 className={config.headingClass ?? ''}>{children}</h2>
              <div className={`h-px ${config.lineSize ?? 'w-12'} bg-gradient-to-l from-transparent ${config.lineColor}`} />
            </div>
          )}
          {!config.lineColor && (
            <p className={config.headingClass ?? ''}>{children}</p>
          )}
        </div>
      );
  }
}
