/**
 * 카카오 OG 캐시 초기화
 *
 * 카카오톡 공유 미리보기는 OG 태그를 캐싱함.
 * 청첩장 수정 후 미리보기가 갱신되지 않는 문제를 해결하기 위해
 * 카카오 스크래핑 API를 호출하여 캐시를 갱신.
 */

const KAKAO_SCRAPE_URL = 'https://kapi.kakao.com/v2/util/share/scrap';

/**
 * 카카오 OG 캐시 갱신 (스크래핑 API 호출)
 *
 * @param targetUrl - 캐시를 갱신할 URL
 * @returns 성공 여부
 */
export async function refreshKakaoOgCache(targetUrl: string): Promise<boolean> {
  const apiKey = process.env.KAKAO_CLIENT_ID;
  if (!apiKey) {
    console.warn('[kakao-og] KAKAO_CLIENT_ID 미설정, 캐시 갱신 건너뜀');
    return false;
  }

  try {
    const res = await fetch(KAKAO_SCRAPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ request_url: targetUrl }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[kakao-og] 스크래핑 실패 (${res.status}):`, body);
      return false;
    }

    console.log(`[kakao-og] 캐시 갱신 완료: ${targetUrl}`);
    return true;
  } catch (error) {
    console.error('[kakao-og] 스크래핑 요청 실패:', error);
    return false;
  }
}

/**
 * 청첩장 URL 생성
 */
export function getInvitationUrl(invitationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cuggu.com';
  return `${baseUrl}/inv/${invitationId}`;
}
