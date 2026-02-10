import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

interface MobileEditorLayoutProps {
  children: ReactNode;
}

/**
 * 모바일 편집기 레이아웃
 *
 * 데스크톱 레이아웃과 동일한 구조 (ToastProvider + 전체 화면)
 */
export default function MobileEditorLayout({ children }: MobileEditorLayoutProps) {
  return (
    <ToastProvider>
      <div className="h-screen h-[100dvh] flex flex-col bg-white">
        {children}
      </div>
    </ToastProvider>
  );
}
