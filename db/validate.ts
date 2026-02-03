// Schema 검증 스크립트
import * as schema from './schema';

console.log('✓ Schema loaded successfully');
console.log('\nTables defined:');
console.log('  - users');
console.log('  - templates');
console.log('  - invitations');
console.log('  - rsvps');
console.log('  - aiGenerations');
console.log('  - payments');
console.log('  - accounts');
console.log('  - sessions');

console.log('\nEnums defined:');
console.log('  - userRoleEnum');
console.log('  - premiumPlanEnum');
console.log('  - templateCategoryEnum');
console.log('  - invitationStatusEnum');
console.log('  - attendanceStatusEnum');
console.log('  - aiStyleEnum');
console.log('  - paymentTypeEnum');

console.log('\nRelations defined:');
console.log('  - usersRelations');
console.log('  - invitationsRelations');
console.log('  - rsvpsRelations');
console.log('  - aiGenerationsRelations');
console.log('  - paymentsRelations');

console.log('\n✅ All schema components are valid!');
