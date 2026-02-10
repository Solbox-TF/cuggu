'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';
import { TemplateMiniPreview, BUILTIN_TEMPLATES } from './tabs/TemplateTab';

// ── 타입 ──

export interface OnboardingData {
  templateId: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  venueName: string;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

// ── 스텝 전환 애니메이션 ──

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// ── 메인 컴포넌트 ──

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // 폼 상태
  const [templateId, setTemplateId] = useState('classic');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingDate, setWeddingDate] = useState<Date | undefined>(undefined);
  const [venueName, setVenueName] = useState('');

  // ESC 키 + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onSkip]);

  // 스텝 이동
  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  // 검증
  const isStepValid = (s: number) => {
    if (s === 0) return true; // 템플릿은 기본값 있음
    if (s === 1) return groomName.trim().length > 0 && brideName.trim().length > 0;
    if (s === 2) return venueName.trim().length > 0;
    return false;
  };

  // 완료
  const handleComplete = () => {
    onComplete({
      templateId,
      groomName: groomName.trim(),
      brideName: brideName.trim(),
      weddingDate: weddingDate?.toISOString() || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      venueName: venueName.trim() || '예식장',
    });
  };

  const TOTAL_STEPS = 3;

  // ── 스텝 콘텐츠 ──

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">어떤 느낌이 좋으세요?</h2>
            <p className="text-sm text-stone-500 mb-6">나중에 언제든 변경할 수 있어요</p>

            <div className="grid grid-cols-3 gap-3">
              {BUILTIN_TEMPLATES.map((t) => {
                const isSelected = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`group relative p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'ring-2 ring-pink-500 ring-offset-2 shadow-md'
                        : 'hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                      <TemplateMiniPreview templateId={t.id} />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg z-10">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-xs text-stone-900">{t.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">이름을 알려주세요</h2>
            <p className="text-sm text-stone-500 mb-6">청첩장에 표시될 이름이에요</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">신랑</label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="홍길동"
                  autoFocus
                  className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">신부</label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="김영희"
                  className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">언제, 어디서 하시나요?</h2>
            <p className="text-sm text-stone-500 mb-6">대략적인 정보만 입력해도 돼요</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">예식 날짜</label>
                <DatePicker
                  selected={weddingDate}
                  onSelect={setWeddingDate}
                  placeholder="날짜 선택"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">예식장 이름</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="예식장 이름을 입력하세요"
                  autoFocus
                  className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 건너뛰기 */}
              <div className="flex justify-end px-6 pt-4">
                <button
                  onClick={onSkip}
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  건너뛰기
                </button>
              </div>

              {/* 스텝 콘텐츠 */}
              <div className="px-6 pb-2 min-h-[360px] relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 하단: 스텝 인디케이터 + 네비게이션 */}
              <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-100">
                {/* 스텝 dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === step ? 'bg-pink-500' : i < step ? 'bg-pink-300' : 'bg-stone-300'
                      }`}
                    />
                  ))}
                </div>

                {/* 버튼 */}
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={goPrev}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      이전
                    </button>
                  )}

                  {step < TOTAL_STEPS - 1 ? (
                    <button
                      onClick={goNext}
                      disabled={!isStepValid(step)}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      다음
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={!isStepValid(step)}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      시작하기
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
