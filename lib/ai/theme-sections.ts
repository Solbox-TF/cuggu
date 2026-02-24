export type ThemeSectionId =
  | 'cover'
  | 'greeting'
  | 'parents'
  | 'ceremony'
  | 'map'
  | 'gallery'
  | 'accounts'
  | 'rsvp'
  | 'ending'
  | 'guestbook';

export interface ThemeSectionPlanItem {
  id: ThemeSectionId;
  enabled: boolean;
  required: boolean;
  dataSummary?: string;
  uxGoal?: string;
}

export interface ThemeSectionPlan {
  sections: ThemeSectionPlanItem[];
}

const SECTION_ORDER: ThemeSectionId[] = [
  'cover',
  'greeting',
  'parents',
  'ceremony',
  'map',
  'gallery',
  'accounts',
  'rsvp',
  'ending',
  'guestbook',
];

interface ExtendedDataLike {
  settings?: {
    showParents?: boolean;
    showAccounts?: boolean;
    showMap?: boolean;
    enableRsvp?: boolean;
  };
  enabledSections?: {
    greeting?: boolean;
    gallery?: boolean;
    account?: boolean;
    rsvp?: boolean;
    guestbook?: boolean;
    ending?: boolean;
  };
  ending?: {
    imageUrl?: string;
    message?: string;
  };
}

export interface ThemeSectionSource {
  groomName?: string | null;
  brideName?: string | null;
  weddingDate?: Date | string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  introMessage?: string | null;
  galleryImages?: string[] | null;
  extendedData?: Record<string, unknown> | null;
}

function summarizeDate(weddingDate?: Date | string | null): string {
  if (!weddingDate) return '예식일 미입력';
  const d = typeof weddingDate === 'string' ? new Date(weddingDate) : weddingDate;
  if (Number.isNaN(d.getTime())) return '예식일 미입력';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function sectionLine(item: ThemeSectionPlanItem): string {
  const state = item.enabled ? 'ENABLED' : 'DISABLED';
  const level = item.required ? 'REQUIRED' : 'OPTIONAL';
  const summary = item.dataSummary ? ` | data=${item.dataSummary}` : '';
  const ux = item.uxGoal ? ` | ux=${item.uxGoal}` : '';
  return `- [${level}][${state}] ${item.id}${summary}${ux}`;
}

export function formatSectionPlanHint(plan: ThemeSectionPlan | null | undefined): string {
  if (!plan || plan.sections.length === 0) return '';

  const ordered = [...plan.sections].sort((a, b) => SECTION_ORDER.indexOf(a.id) - SECTION_ORDER.indexOf(b.id));
  return [
    '[Section Plan]',
    'Design section-by-section in this order and keep visual rhythm consistent.',
    ...ordered.map(sectionLine),
    'Instruction: Required+Enabled sections must feel complete and high-priority in hierarchy.',
    'Instruction: Optional+Disabled sections should not dominate accents, motion, or spacing choices.',
  ].join('\n');
}

export function createSectionPlanFromInvitation(source: ThemeSectionSource): ThemeSectionPlan {
  const extended = (source.extendedData ?? {}) as ExtendedDataLike;
  const settings = extended.settings ?? {};
  const enabledSections = extended.enabledSections ?? {};

  const greetingEnabled = enabledSections.greeting ?? !!source.introMessage;
  const galleryCount = source.galleryImages?.length ?? 0;
  const galleryEnabled = enabledSections.gallery ?? galleryCount > 0;
  const accountsEnabled = enabledSections.account ?? settings.showAccounts ?? true;
  const rsvpEnabled = enabledSections.rsvp ?? settings.enableRsvp ?? true;
  const guestbookEnabled = enabledSections.guestbook ?? false;
  const endingEnabled = enabledSections.ending ?? Boolean(extended.ending?.imageUrl || extended.ending?.message);
  const parentsEnabled = settings.showParents ?? true;
  const mapEnabled = settings.showMap ?? true;

  const nameSummary = [source.groomName, source.brideName].filter(Boolean).join('&') || '이름 미입력';
  const ceremonySummary = `${summarizeDate(source.weddingDate)} @ ${source.venueName || '예식장 미입력'}`;

  return {
    sections: [
      {
        id: 'cover',
        enabled: true,
        required: true,
        dataSummary: nameSummary,
        uxGoal: '첫 화면에서 이름/날짜 인지, 모바일 1뷰포트 내 핵심 정보 유지',
      },
      {
        id: 'greeting',
        enabled: greetingEnabled,
        required: false,
        dataSummary: source.introMessage ? `본문 ${source.introMessage.length}자` : '인사말 미입력',
        uxGoal: '긴 문장도 읽기 쉬운 줄간격/대비 유지',
      },
      {
        id: 'parents',
        enabled: parentsEnabled,
        required: true,
        dataSummary: '신랑·신부 양가 정보',
        uxGoal: '관계 정보 위계 명확, 과한 장식 금지',
      },
      {
        id: 'ceremony',
        enabled: true,
        required: true,
        dataSummary: ceremonySummary,
        uxGoal: '날짜/시간/장소 정보카드 가독성 최우선',
      },
      {
        id: 'map',
        enabled: mapEnabled,
        required: true,
        dataSummary: source.venueAddress || '주소 미입력',
        uxGoal: '길찾기/연락 CTA가 터치 친화적으로 보이게 구성',
      },
      {
        id: 'gallery',
        enabled: galleryEnabled,
        required: false,
        dataSummary: `${galleryCount}장`,
        uxGoal: '사진이 주인공, 레이아웃은 정보 영역과 시각 충돌 최소화',
      },
      {
        id: 'accounts',
        enabled: accountsEnabled,
        required: false,
        dataSummary: '계좌 안내',
        uxGoal: '복사/확인 UX가 명확한 카드 대비 유지',
      },
      {
        id: 'rsvp',
        enabled: rsvpEnabled,
        required: false,
        dataSummary: '참석 여부 입력 폼',
        uxGoal: '입력 필드/버튼 터치영역 확보 및 상태 구분 명확',
      },
      {
        id: 'ending',
        enabled: endingEnabled,
        required: false,
        dataSummary: endingEnabled ? '엔딩 이미지/메시지 사용' : '엔딩 미사용',
        uxGoal: '마무리 섹션은 간결하게 톤 정리',
      },
      {
        id: 'guestbook',
        enabled: guestbookEnabled,
        required: false,
        dataSummary: guestbookEnabled ? '방명록 사용' : '방명록 미사용',
        uxGoal: '사용 시 본문 대비 확보, 미사용 시 장식 비중 축소',
      },
    ],
  };
}
