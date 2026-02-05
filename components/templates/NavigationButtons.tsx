'use client';

import { useState } from 'react';
import { getKakaoNaviUrl, getNaverMapUrl, getTMapUrl, NavUrls } from '@/lib/kakao-map';
import { X } from 'lucide-react';

interface NavigationButtonsProps {
  lat: number;
  lng: number;
  venueName: string;
}

type NavApp = 'kakao' | 'naver' | 'tmap';

// 앱스토어 URL
const STORE_URLS: Record<NavApp, { ios: string; android: string; name: string }> = {
  kakao: {
    ios: 'https://apps.apple.com/kr/app/id417698849',
    android: 'https://play.google.com/store/apps/details?id=com.locnall.KimGiSa',
    name: '카카오내비',
  },
  naver: {
    ios: 'https://apps.apple.com/kr/app/id311867728',
    android: 'https://play.google.com/store/apps/details?id=com.nhn.android.nmap',
    name: '네이버지도',
  },
  tmap: {
    ios: 'https://apps.apple.com/kr/app/id431589174',
    android: 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku',
    name: '티맵',
  },
};

/**
 * 길찾기 버튼 (카카오내비 / 네이버지도 / 티맵)
 *
 * - 모바일: 앱 스킴 시도 → 실패 시 웹 fallback + 스토어 안내 토스트
 * - 데스크톱: 웹 버전 직접 열기
 */
export function NavigationButtons({ lat, lng, venueName }: NavigationButtonsProps) {
  const [toast, setToast] = useState<{ app: NavApp; visible: boolean } | null>(null);

  const getStoreUrl = (app: NavApp) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isIOS ? STORE_URLS[app].ios : STORE_URLS[app].android;
  };

  const handleNavigate = (urls: NavUrls, appType: NavApp) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android: Intent URL 사용 (앱 없으면 자동 fallback)
      window.location.href = urls.androidIntent;
      // Intent fallback이 동작하지 않는 브라우저 대비 (카카오톡 인앱 등)
      setTimeout(() => {
        if (!document.hidden) {
          setToast({ app: appType, visible: true });
          setTimeout(() => setToast(null), 5000);
        }
      }, 1000);
    } else if (isIOS) {
      // iOS: visibilitychange로 앱 전환 감지
      let didLeave = false;

      const handleVisibilityChange = () => {
        if (document.hidden) {
          didLeave = true;
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.location.href = urls.app;

      // 1.5초 후에도 페이지를 안 떠났으면 앱이 없는 것
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (!didLeave && !document.hidden) {
          window.open(urls.web, '_blank');
          setToast({ app: appType, visible: true });
          setTimeout(() => setToast(null), 5000);
        }
      }, 1500);
    } else {
      // Desktop: 웹 버전 직접 열기
      window.open(urls.web, '_blank');
    }
  };

  const closeToast = () => setToast(null);

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
        <button
          type="button"
          onClick={() => handleNavigate(getKakaoNaviUrl(lat, lng, venueName), 'kakao')}
          className="flex flex-col items-center gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <KakaoIcon />
          <span className="text-xs font-medium text-stone-700">카카오내비</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate(getNaverMapUrl(lat, lng, venueName), 'naver')}
          className="flex flex-col items-center gap-1.5 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <NaverIcon />
          <span className="text-xs font-medium text-stone-700">네이버지도</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate(getTMapUrl(lat, lng, venueName), 'tmap')}
          className="flex flex-col items-center gap-1.5 p-3 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
        >
          <TMapIcon />
          <span className="text-xs font-medium text-stone-700">티맵</span>
        </button>
      </div>

      {/* 앱 미설치 안내 토스트 */}
      {toast?.visible && (
        <div className="mt-3 p-3 bg-stone-800 text-white rounded-lg text-sm animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium">{STORE_URLS[toast.app].name} 앱이 없습니다</p>
              <p className="text-stone-300 text-xs mt-0.5">
                앱을 설치하면 더 편리하게 길찾기를 이용할 수 있어요
              </p>
            </div>
            <button
              type="button"
              onClick={closeToast}
              className="p-1 hover:bg-stone-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <a
            href={getStoreUrl(toast.app)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block w-full py-2 bg-white text-stone-800 text-center text-sm font-medium rounded hover:bg-stone-100 transition-colors"
          >
            앱 설치하기
          </a>
        </div>
      )}
    </div>
  );
}

// SVG 아이콘 (이모지 대신 심플한 아이콘)
function KakaoIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FEE500" />
      <path d="M12 6C8.13 6 5 8.46 5 11.5c0 1.97 1.31 3.7 3.28 4.67l-.84 3.08c-.06.22.18.4.37.28l3.68-2.44c.16.01.33.01.51.01 3.87 0 7-2.46 7-5.5S15.87 6 12 6z" fill="#3C1E1E" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#03C75A" />
      <path d="M14.2 12.4L9.6 6H7v12h2.8v-6.4L14.4 18H17V6h-2.8v6.4z" fill="white" />
    </svg>
  );
}

function TMapIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0064FF" />
      <path d="M7 8h10v2H13.5v8h-3V10H7V8z" fill="white" />
    </svg>
  );
}
