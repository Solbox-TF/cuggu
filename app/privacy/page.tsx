import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 - Cuggu",
  description: "Cuggu 개인정보처리방침",
};

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/"
          className="text-pink-500 font-bold text-lg hover:opacity-80 transition-opacity"
        >
          Cuggu
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-2">
          개인정보처리방침
        </h1>
        <p className="text-sm text-gray-500 mb-12">시행일: 2026년 2월 14일</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <Section title="1. 개인정보의 수집 항목 및 수집 방법">
            <h3 className="text-sm font-medium text-gray-800 mt-3 mb-2">
              가. 필수 수집 항목
            </h3>
            <Table
              headers={["구분", "수집 항목", "수집 방법"]}
              rows={[
                [
                  "소셜 로그인",
                  "이메일, 이름(닉네임), 프로필 이미지",
                  "카카오/네이버 OAuth",
                ],
                [
                  "청첩장 제작",
                  "신랑·신부 이름, 예식 일시, 예식장 정보, 인사말",
                  "이용자 직접 입력",
                ],
                [
                  "RSVP",
                  "하객 이름, 연락처, 참석 여부, 식사 여부, 동행 인원수",
                  "하객 직접 입력",
                ],
              ]}
            />

            <h3 className="text-sm font-medium text-gray-800 mt-4 mb-2">
              나. 선택 수집 항목
            </h3>
            <Table
              headers={["구분", "수집 항목", "수집 방법"]}
              rows={[
                [
                  "AI 사진 생성",
                  "얼굴 사진(참조 사진)",
                  "이용자 직접 업로드",
                ],
                [
                  "계좌 정보",
                  "은행명, 예금주, 계좌번호",
                  "이용자 직접 입력",
                ],
                [
                  "축의금 안내",
                  "카카오페이 링크",
                  "이용자 직접 입력",
                ],
              ]}
            />
          </Section>

          <Section title="2. 개인정보의 수집 및 이용 목적">
            <Table
              headers={["목적", "상세"]}
              rows={[
                ["서비스 제공", "모바일 청첩장 제작, AI 사진 생성, RSVP 관리"],
                [
                  "회원 관리",
                  "소셜 로그인을 통한 본인 확인, 서비스 이용 내역 관리",
                ],
                ["결제 및 크레딧", "유료 서비스 결제 처리, 크레딧 이력 관리"],
                [
                  "서비스 개선",
                  "이용 통계 분석, 서비스 품질 개선",
                ],
              ]}
            />
          </Section>

          <Section title="3. 개인정보의 보유 및 이용 기간">
            <Table
              headers={["구분", "보유 기간", "근거"]}
              rows={[
                [
                  "회원 정보",
                  "탈퇴 시 즉시 삭제",
                  "이용자 동의",
                ],
                [
                  "청첩장 데이터",
                  "예식일 후 90일",
                  "서비스 정책",
                ],
                [
                  "RSVP 데이터",
                  "청첩장 삭제 시 함께 삭제",
                  "서비스 정책",
                ],
                [
                  "AI 참조 사진",
                  "이용자 삭제 요청 시 또는 탈퇴 시",
                  "이용자 동의",
                ],
                [
                  "결제 이력",
                  "5년",
                  "전자상거래법",
                ],
                [
                  "접속 로그",
                  "3개월",
                  "통신비밀보호법",
                ],
              ]}
            />
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p>
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              다만 다음의 경우는 예외로 합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령에 의거하여 수사 목적으로 요청받은 경우</li>
            </ul>
          </Section>

          <Section title="5. 개인정보 처리 위탁">
            <Table
              headers={["수탁업체", "위탁 업무", "보유 기간"]}
              rows={[
                [
                  "Amazon Web Services (AWS)",
                  "데이터 저장 및 파일 호스팅 (S3, CloudFront)",
                  "위탁 계약 종료 시",
                ],
                [
                  "Supabase",
                  "데이터베이스 호스팅",
                  "위탁 계약 종료 시",
                ],
                [
                  "Upstash",
                  "캐싱 및 Rate Limiting",
                  "위탁 계약 종료 시",
                ],
                [
                  "Microsoft Azure",
                  "얼굴 감지 (Face API)",
                  "처리 즉시 삭제",
                ],
              ]}
            />
          </Section>

          <Section title="6. AI 서비스 관련 개인정보 처리">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                AI 사진 생성 시 업로드된 얼굴 사진은 이미지 생성 목적으로만
                사용되며, AI 모델 학습에 활용되지 않습니다.
              </li>
              <li>
                얼굴 감지(Azure Face API)는 사진 내 얼굴 존재 여부 확인
                목적으로만 사용되며, 얼굴 데이터는 처리 직후 삭제됩니다.
              </li>
              <li>
                AI 테마 생성 시 이용자의 이름, 연락처, 계좌 등 개인정보는 AI
                서비스에 전달되지 않습니다. 예식 장소 유형, 계절 등 비개인정보만
                사용됩니다.
              </li>
              <li>
                AI 생성에 사용되는 외부 서비스(Replicate, OpenAI, Google Gemini)는
                이용자의 데이터를 모델 학습에 사용하지 않습니다.
              </li>
            </ol>
          </Section>

          <Section title="7. RSVP 하객 정보 보호">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                하객이 RSVP 폼에 입력한 이름, 연락처 등의 개인정보는 해당
                청첩장의 소유자(신랑·신부)만 열람할 수 있습니다.
              </li>
              <li>
                하객 연락처는 암호화되어 저장되며, 목록 조회 시 마스킹 처리되어
                표시됩니다.
              </li>
              <li>
                청첩장 삭제 시 해당 RSVP 데이터는 함께 삭제됩니다.
              </li>
            </ol>
          </Section>

          <Section title="8. 개인정보의 파기 절차 및 방법">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>파기 절차</strong>: 보유 기간이 경과하거나 처리 목적이
                달성된 개인정보는 지체 없이 파기합니다.
              </li>
              <li>
                <strong>파기 방법</strong>: 전자적 파일은 복구 불가능한 방법으로
                삭제하며, 파일 저장소(S3)의 관련 파일도 함께 삭제합니다.
              </li>
              <li>
                <strong>자동 삭제</strong>: 예식일 90일 경과 청첩장, 만료된 세션
                데이터 등은 자동으로 삭제됩니다.
              </li>
            </ol>
          </Section>

          <Section title="9. 이용자의 권리와 행사 방법">
            <p>
              이용자는 언제든지 다음 권리를 행사할 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴 (서비스 내 설정에서 직접 가능)</li>
            </ul>
            <p className="mt-2">
              권리 행사는 서비스 내 설정 또는{" "}
              <a
                href="mailto:contact@cuggu.co.kr"
                className="text-pink-500 hover:underline"
              >
                contact@cuggu.co.kr
              </a>
              로 요청할 수 있으며, 지체 없이 처리합니다.
            </p>
          </Section>

          <Section title="10. 개인정보 보호를 위한 기술적·관리적 대책">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                비밀번호, 하객 연락처 등 민감 정보는 bcrypt 또는 AES 암호화하여
                저장합니다.
              </li>
              <li>HTTPS(TLS 1.3)를 통해 모든 통신을 암호화합니다.</li>
              <li>
                API Rate Limiting을 적용하여 비정상적인 접근을 차단합니다.
              </li>
              <li>
                관리자 접근은 별도의 인증 및 권한 체계로 보호합니다.
              </li>
            </ul>
          </Section>

          <Section title="11. 쿠키(Cookie) 사용">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                서비스는 로그인 세션 유지, 비밀번호 보호 청첩장 인증 등의
                목적으로 쿠키를 사용합니다.
              </li>
              <li>
                이용자는 브라우저 설정을 통해 쿠키 수집을 거부할 수 있으며,
                이 경우 일부 서비스 이용이 제한될 수 있습니다.
              </li>
            </ol>
          </Section>

          <Section title="12. 개인정보 보호책임자">
            <ul className="list-none space-y-1">
              <li>
                <strong>이메일</strong>: contact@cuggu.co.kr
              </li>
              <li>
                <strong>웹사이트</strong>: cuggu.co.kr
              </li>
            </ul>
            <p className="mt-2">
              개인정보 관련 문의, 불만 처리, 피해 구제를 위해 위 연락처로 문의해
              주시기 바랍니다.
            </p>
          </Section>

          <Section title="13. 고지 의무">
            <p>
              이 개인정보처리방침은 2026년 2월 14일부터 적용되며, 법령이나 서비스
              변경에 따라 내용이 추가·삭제·수정될 수 있습니다. 변경 시 시행일 7일
              전부터 서비스 내 공지합니다.
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <p>
            문의:{" "}
            <a
              href="mailto:contact@cuggu.co.kr"
              className="text-pink-500 hover:underline"
            >
              contact@cuggu.co.kr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2 px-3 bg-gray-50 border border-gray-200 font-medium text-gray-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="py-2 px-3 border border-gray-200 text-gray-600"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
