'use client';

import { useState, useEffect } from 'react';
import type { SerializableTheme } from '@/lib/templates/types';

interface DDayWidgetProps {
  weddingDate: Date;
  theme: SerializableTheme;
  style: 'calendar' | 'countdown' | 'minimal';
}

// ── 유틸 ──

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getDDayNumber(weddingDate: Date) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weddingStart = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate());
  return Math.ceil((weddingStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}

// ── 미니 달력 (calendar) ──

function CalendarView({ weddingDate, theme }: { weddingDate: Date; theme: SerializableTheme }) {
  const today = new Date();
  const year = weddingDate.getFullYear();
  const month = weddingDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dDay = getDDayNumber(weddingDate);

  return (
    <div className="mt-6">
      {/* 연/월 헤더 */}
      <div className={`text-center mb-4 ${theme.calendarHeaderClass ?? 'text-sm text-gray-700'}`}>
        {year}년 {month + 1}월
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-[10px] font-medium ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const cellDate = new Date(year, month, day);
          const isWeddingDay = isSameDay(cellDate, weddingDate);
          const isToday = isSameDay(cellDate, today);
          const dayOfWeek = cellDate.getDay();

          return (
            <div key={day} className="flex justify-center">
              <div
                className={`
                  w-7 h-7 flex items-center justify-center rounded-full
                  ${theme.calendarDayClass ?? 'text-xs text-gray-600'}
                  ${isWeddingDay ? `${theme.calendarAccentColor ?? 'bg-pink-500 text-white'} font-bold` : ''}
                  ${isToday && !isWeddingDay ? theme.calendarTodayColor ?? 'ring-2 ring-pink-300' : ''}
                  ${!isWeddingDay && dayOfWeek === 0 ? 'text-red-400' : ''}
                  ${!isWeddingDay && dayOfWeek === 6 ? 'text-blue-400' : ''}
                `}
              >
                {day}
              </div>
            </div>
          );
        })}
      </div>

      {/* D-Day 표시 */}
      <div className="text-center mt-4">
        <span className={`text-xs ${theme.countdownLabelClass ?? 'text-gray-500'}`}>
          {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
        </span>
      </div>
    </div>
  );
}

// ── 카운트다운 (countdown) ──

function CountdownView({ weddingDate, theme }: { weddingDate: Date; theme: SerializableTheme }) {
  const dDay = getDDayNumber(weddingDate);

  // 시/분은 hydration mismatch 방지를 위해 클라이언트에서만 계산
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    function calc() {
      const now = new Date();
      const diff = weddingDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds });
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [weddingDate]);

  if (dDay === 0) {
    return (
      <div className="mt-8 text-center">
        <div className={theme.countdownNumberClass ?? 'text-5xl font-bold text-pink-600'}>
          D-Day
        </div>
        <p className={`mt-2 ${theme.countdownLabelClass ?? 'text-sm text-gray-500'}`}>
          오늘이 결혼식입니다
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 text-center">
      {/* 큰 D-Day 숫자 */}
      <div className={theme.countdownNumberClass ?? 'text-5xl font-bold text-pink-600'}>
        {dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
      </div>

      {/* 시/분/초 (클라이언트에서만) */}
      {timeLeft && dDay > 0 && (
        <div className="flex justify-center gap-4 mt-4">
          {[
            { value: timeLeft.hours, label: '시간' },
            { value: timeLeft.minutes, label: '분' },
            { value: timeLeft.seconds, label: '초' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className={`text-lg font-medium ${theme.countdownLabelClass ?? 'text-gray-700'}`}>
                {String(value).padStart(2, '0')}
              </div>
              <div className={theme.countdownUnitClass ?? 'text-[10px] text-gray-400'}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 미니멀 (minimal) ──

function MinimalView({ weddingDate, theme }: { weddingDate: Date; theme: SerializableTheme }) {
  const dDay = getDDayNumber(weddingDate);

  return (
    <div className="mt-6 text-center">
      <span className={theme.countdownNumberClass ?? 'text-4xl font-light text-gray-800'}>
        {dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`}
      </span>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function DDayWidget({ weddingDate, theme, style }: DDayWidgetProps) {
  switch (style) {
    case 'calendar':
      return <CalendarView weddingDate={weddingDate} theme={theme} />;
    case 'countdown':
      return <CountdownView weddingDate={weddingDate} theme={theme} />;
    case 'minimal':
      return <MinimalView weddingDate={weddingDate} theme={theme} />;
    default:
      return null;
  }
}
