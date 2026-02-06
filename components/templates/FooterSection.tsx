import type { Invitation } from '@/schemas/invitation';
import type { FooterConfig } from '@/lib/templates/types';
import { DecorationRenderer } from './renderers/DecorationRenderer';
import { DividerRenderer } from './renderers/DividerRenderer';

interface FooterSectionProps {
  data: Invitation;
  config: FooterConfig;
  isPreview?: boolean;
}

function FooterCentered({ data, config, isPreview }: FooterSectionProps) {
  return (
    <footer className={config.containerClass ?? 'py-8 md:py-12 px-6 text-center text-xs md:text-sm text-gray-500 border-t border-amber-100'}>
      {config.topDivider && <DividerRenderer config={config.topDivider} />}
      {config.topDecoration && <DecorationRenderer config={config.topDecoration} />}
      <p className={config.nameClass ?? ''}>
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPreview && (
        <p className="mt-2">
          <a href="https://cuggu.io" className={config.linkClass ?? 'text-amber-600 hover:text-amber-700'}>
            Cuggu
          </a>
        </p>
      )}
    </footer>
  );
}

function FooterFlexBetween({ data, config, isPreview }: FooterSectionProps) {
  return (
    <footer className={config.containerClass ?? 'py-10 md:py-14 px-8 md:px-12 border-t border-zinc-200'}>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <p className={config.nameClass ?? ''}>{data.groom.name} & {data.bride.name}</p>
        {!isPreview && (
          <a href="https://cuggu.io" className={config.linkClass ?? 'hover:text-emerald-600 transition-colors'}>
            Cuggu
          </a>
        )}
      </div>
    </footer>
  );
}

export function FooterSection({ data, config, isPreview }: FooterSectionProps) {
  if (config.layout === 'flex-between') {
    return <FooterFlexBetween data={data} config={config} isPreview={isPreview} />;
  }
  return <FooterCentered data={data} config={config} isPreview={isPreview} />;
}
