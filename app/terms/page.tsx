import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 - Cuggu",
  description: "Cuggu 서비스 이용약관",
};

export default async function TermsPage() {
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
          이용약관
        </h1>
        <p className="text-sm text-gray-500 mb-12">시행일: 2026년 2월 14일</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <Section title="제1조 (목적)">
            <p>
              이 약관은 Cuggu(이하 &quot;서비스&quot;)가 제공하는 모바일 청첩장
              제작 및 AI 사진 생성 서비스의 이용 조건과 절차, 회사와 이용자 간의
              권리·의무를 규정함을 목적으로 합니다.
            </p>
          </Section>

          <Section title="제2조 (용어의 정의)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                &quot;서비스&quot;란 Cuggu가 제공하는 모바일 청첩장 제작, AI 사진
                생성, AI 테마 생성 등 관련 서비스 일체를 말합니다.
              </li>
              <li>
                &quot;이용자&quot;란 이 약관에 동의하고 서비스를 이용하는 자를
                말합니다.
              </li>
              <li>
                &quot;크레딧&quot;이란 AI 사진 생성 등 유료 기능을 이용하기 위해
                필요한 서비스 내 이용 단위를 말합니다.
              </li>
              <li>
                &quot;청첩장&quot;이란 이용자가 서비스를 통해 제작한 모바일
                청첩장 콘텐츠를 말합니다.
              </li>
            </ol>
          </Section>

          <Section title="제3조 (약관의 효력 및 변경)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게
                공지함으로써 효력이 발생합니다.
              </li>
              <li>
                회사는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며,
                변경 시 적용일 7일 전부터 공지합니다.
              </li>
              <li>
                이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고
                탈퇴할 수 있습니다.
              </li>
            </ol>
          </Section>

          <Section title="제4조 (서비스 이용 계약)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                이용 계약은 이용자가 약관에 동의하고 소셜 로그인(카카오, 네이버)을
                통해 가입 신청한 후, 회사가 이를 승낙함으로써 성립합니다.
              </li>
              <li>
                회사는 다음 각 호에 해당하는 경우 가입을 거부하거나 제한할 수
                있습니다.
                <ul className="list-disc pl-5 mt-1">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>서비스 운영을 방해한 이력이 있는 경우</li>
                  <li>기타 관련 법령에 위반되는 경우</li>
                </ul>
              </li>
            </ol>
          </Section>

          <Section title="제5조 (서비스의 제공 및 변경)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                회사는 다음 서비스를 제공합니다.
                <ul className="list-disc pl-5 mt-1">
                  <li>모바일 청첩장 제작 및 관리</li>
                  <li>AI 사진 생성 (크레딧 차감)</li>
                  <li>AI 테마 생성</li>
                  <li>RSVP(참석 여부) 관리</li>
                  <li>카카오톡 등 SNS 공유</li>
                </ul>
              </li>
              <li>
                회사는 기술적 필요, 운영상 필요에 따라 서비스 내용을 변경할 수
                있으며, 중요 변경 시 사전 공지합니다.
              </li>
            </ol>
          </Section>

          <Section title="제6조 (유료 서비스 및 크레딧)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                AI 사진 생성 등 일부 기능은 크레딧을 소모하며, 크레딧은 유료로
                구매할 수 있습니다.
              </li>
              <li>
                신규 가입 시 무료 크레딧이 제공되며, 제공 수량은 회사 정책에 따라
                변경될 수 있습니다.
              </li>
              <li>
                구매한 크레딧은 구매일로부터 1년간 유효하며, 기간 경과 시
                소멸됩니다.
              </li>
              <li>
                AI 생성 실패 시 소모된 크레딧은 자동으로 환불됩니다.
              </li>
            </ol>
          </Section>

          <Section title="제7조 (환불 정책)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                미사용 크레딧은 구매 후 7일 이내에 환불 요청할 수 있습니다.
              </li>
              <li>
                이미 사용된 크레딧은 환불 대상에서 제외됩니다.
              </li>
              <li>
                프리미엄 플랜은 구매 후 14일 이내 미사용 시 전액 환불 가능하며,
                사용 이력이 있는 경우 일할 계산하여 환불합니다.
              </li>
              <li>
                환불은 contact@cuggu.co.kr로 요청해 주시기 바랍니다.
              </li>
            </ol>
          </Section>

          <Section title="제8조 (이용자의 의무)">
            <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>타인의 개인정보 또는 사진을 무단으로 사용하는 행위</li>
              <li>
                서비스를 이용하여 불법적이거나 공서양속에 반하는 콘텐츠를 생성하는
                행위
              </li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>AI 생성 기능을 자동화 도구 등으로 대량 악용하는 행위</li>
              <li>기타 관련 법령에 위반되는 행위</li>
            </ol>
          </Section>

          <Section title="제9조 (AI 생성 콘텐츠의 권리)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                AI로 생성된 사진 및 테마의 저작권에 대해 회사는 별도의 권리를
                주장하지 않습니다.
              </li>
              <li>
                이용자는 AI 생성 결과물을 개인적 용도(청첩장 등)로 자유롭게 사용할
                수 있습니다.
              </li>
              <li>
                AI 생성 결과물의 품질은 입력 데이터, AI 모델 특성에 따라 다를 수
                있으며, 회사는 특정 결과를 보장하지 않습니다.
              </li>
            </ol>
          </Section>

          <Section title="제10조 (서비스 이용 제한 및 계약 해지)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                이용자가 제8조를 위반한 경우 회사는 서비스 이용을 제한하거나 계약을
                해지할 수 있습니다.
              </li>
              <li>
                이용자는 언제든지 서비스 내 설정에서 탈퇴를 요청할 수 있으며,
                탈퇴 시 개인정보 및 청첩장 데이터는 즉시 삭제됩니다.
              </li>
            </ol>
          </Section>

          <Section title="제11조 (청첩장 자동 삭제)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                청첩장은 설정된 예식일로부터 90일이 경과하면 자동으로 삭제됩니다.
              </li>
              <li>
                삭제 전 이메일 등으로 사전 안내할 수 있으며, 이용자가 보존을
                원하는 경우 별도 요청할 수 있습니다.
              </li>
            </ol>
          </Section>

          <Section title="제12조 (면책 조항)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에
                대해 책임을 지지 않습니다.
              </li>
              <li>
                회사는 이용자가 서비스를 통해 제공하는 정보의 정확성이나 신뢰성에
                대해 보증하지 않습니다.
              </li>
              <li>
                AI 생성 결과물의 부정확성, 부적절성으로 인한 손해에 대해 회사는
                책임을 지지 않습니다.
              </li>
            </ol>
          </Section>

          <Section title="제13조 (분쟁 해결)">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                서비스 이용과 관련한 분쟁은 대한민국 법령에 따라 해결합니다.
              </li>
              <li>
                분쟁 발생 시 회사의 주된 사무소 소재지를 관할하는 법원을
                전속관할로 합니다.
              </li>
            </ol>
          </Section>

          <Section title="부칙">
            <p>이 약관은 2026년 2월 14일부터 시행합니다.</p>
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
