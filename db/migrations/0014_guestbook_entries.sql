-- 방명록 테이블
CREATE TABLE "guestbook_entries" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"invitation_id" varchar(128) NOT NULL,
	"name" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- FK: 청첩장 삭제 시 cascade
ALTER TABLE "guestbook_entries"
  ADD CONSTRAINT "guestbook_entries_invitation_id_invitations_id_fk"
  FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id")
  ON DELETE cascade ON UPDATE no action;

-- 인덱스: 청첩장별 조회
CREATE INDEX "guestbook_entries_invitation_id_idx"
  ON "guestbook_entries" USING btree ("invitation_id");

-- 인덱스: 커서 페이지네이션용 (invitationId + createdAt DESC + id)
CREATE INDEX "guestbook_entries_pagination_idx"
  ON "guestbook_entries" USING btree ("invitation_id", "created_at", "id");
