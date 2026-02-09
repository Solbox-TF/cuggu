/**
 * 기존 평문 개인정보를 AES-256-GCM으로 암호화하는 마이그레이션 스크립트
 *
 * 대상:
 * - rsvps.guestPhone, rsvps.guestEmail
 * - invitations.extendedData 내 계좌번호 (groom/bride account, parentAccounts)
 *
 * 실행: npx tsx scripts/encrypt-existing-data.ts
 * 주의: ENCRYPTION_KEY 환경변수 필수, 실행 전 DB 백업 권장
 */

import 'dotenv/config';
import { db } from '@/db';
import { rsvps, invitations } from '@/db/schema';
import { encrypt, isEncrypted } from '@/lib/crypto';
import { eq } from 'drizzle-orm';

async function encryptRsvps() {
  console.log('=== RSVP 개인정보 암호화 시작 ===');

  const allRsvps = await db.query.rsvps.findMany();
  let updated = 0;

  for (const rsvp of allRsvps) {
    const updates: Record<string, string> = {};

    if (rsvp.guestPhone && !isEncrypted(rsvp.guestPhone)) {
      updates.guestPhone = encrypt(rsvp.guestPhone);
    }
    if (rsvp.guestEmail && !isEncrypted(rsvp.guestEmail)) {
      updates.guestEmail = encrypt(rsvp.guestEmail);
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(rsvps)
        .set(updates as any)
        .where(eq(rsvps.id, rsvp.id));
      updated++;
    }
  }

  console.log(`RSVP: ${allRsvps.length}건 중 ${updated}건 암호화 완료`);
}

function encryptAccountInData(data: any): { changed: boolean; data: any } {
  let changed = false;

  for (const side of ['groom', 'bride'] as const) {
    if (!data[side]) continue;

    // 본인 계좌
    if (data[side].account?.accountNumber && !isEncrypted(data[side].account.accountNumber)) {
      data[side].account.accountNumber = encrypt(data[side].account.accountNumber);
      changed = true;
    }

    // 부모님 계좌
    if (data[side].parentAccounts) {
      for (const role of ['father', 'mother'] as const) {
        if (Array.isArray(data[side].parentAccounts[role])) {
          for (const acc of data[side].parentAccounts[role]) {
            if (acc.accountNumber && !isEncrypted(acc.accountNumber)) {
              acc.accountNumber = encrypt(acc.accountNumber);
              changed = true;
            }
          }
        }
      }
    }
  }

  return { changed, data };
}

async function encryptInvitations() {
  console.log('=== 청첩장 계좌번호 암호화 시작 ===');

  const allInvitations = await db.query.invitations.findMany();
  let updated = 0;

  for (const inv of allInvitations) {
    const extData = (inv.extendedData || {}) as Record<string, any>;
    const { changed, data } = encryptAccountInData({ ...extData });

    if (changed) {
      await db
        .update(invitations)
        .set({ extendedData: data })
        .where(eq(invitations.id, inv.id));
      updated++;
    }
  }

  console.log(`청첩장: ${allInvitations.length}건 중 ${updated}건 암호화 완료`);
}

async function main() {
  console.log('개인정보 암호화 마이그레이션 시작\n');

  if (!process.env.ENCRYPTION_KEY) {
    console.error('ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  await encryptRsvps();
  await encryptInvitations();

  console.log('\n마이그레이션 완료');
  process.exit(0);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
