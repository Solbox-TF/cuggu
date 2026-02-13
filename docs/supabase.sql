-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  type character varying NOT NULL,
  provider character varying NOT NULL,
  provider_account_id character varying NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type character varying,
  scope character varying,
  id_token text,
  session_state character varying,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_albums (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  invitation_id character varying,
  name character varying NOT NULL DEFAULT 'My Album'::character varying,
  snap_type character varying,
  images jsonb DEFAULT '[]'::jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::ai_album_status,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  groups jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT ai_albums_pkey PRIMARY KEY (id),
  CONSTRAINT ai_albums_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_albums_invitation_id_invitations_id_fk FOREIGN KEY (invitation_id) REFERENCES public.invitations(id)
);
CREATE TABLE public.ai_credit_transactions (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  reference_type character varying,
  reference_id character varying,
  description character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_credit_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_credit_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_generation_jobs (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  album_id character varying,
  mode USER-DEFINED NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  total_images integer NOT NULL,
  completed_images integer NOT NULL DEFAULT 0,
  failed_images integer NOT NULL DEFAULT 0,
  credits_reserved integer NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::ai_job_status,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  completed_at timestamp without time zone,
  CONSTRAINT ai_generation_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_generation_jobs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_generation_jobs_album_id_ai_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.ai_albums(id)
);
CREATE TABLE public.ai_generations (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  original_url character varying NOT NULL,
  style USER-DEFINED NOT NULL,
  generated_urls ARRAY,
  selected_url character varying,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::ai_generation_status,
  credits_used integer NOT NULL DEFAULT 1,
  cost real NOT NULL,
  replicate_id character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  completed_at timestamp without time zone,
  provider_job_id character varying,
  provider_type character varying,
  album_id character varying,
  role character varying,
  is_favorited boolean NOT NULL DEFAULT false,
  model_id character varying,
  job_id character varying,
  CONSTRAINT ai_generations_pkey PRIMARY KEY (id),
  CONSTRAINT ai_generations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_generations_album_id_ai_albums_id_fk FOREIGN KEY (album_id) REFERENCES public.ai_albums(id),
  CONSTRAINT ai_generations_job_id_ai_generation_jobs_id_fk FOREIGN KEY (job_id) REFERENCES public.ai_generation_jobs(id)
);
CREATE TABLE public.ai_model_settings (
  model_id character varying NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  is_recommended boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_model_settings_pkey PRIMARY KEY (model_id)
);
CREATE TABLE public.ai_reference_photos (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  role character varying NOT NULL,
  original_url character varying NOT NULL,
  face_detected boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_reference_photos_pkey PRIMARY KEY (id),
  CONSTRAINT ai_reference_photos_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_themes (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  invitation_id character varying,
  prompt text NOT NULL,
  theme jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'completed'::ai_theme_status,
  fail_reason text,
  credits_used integer NOT NULL DEFAULT 1,
  input_tokens integer,
  output_tokens integer,
  cost real,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  model_id character varying,
  CONSTRAINT ai_themes_pkey PRIMARY KEY (id),
  CONSTRAINT ai_themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_themes_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.invitations(id)
);
CREATE TABLE public.app_settings (
  key character varying NOT NULL,
  value jsonb NOT NULL,
  category character varying NOT NULL,
  label character varying NOT NULL,
  description text,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.invitations (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  template_id character varying NOT NULL,
  groom_name character varying NOT NULL,
  bride_name character varying NOT NULL,
  wedding_date timestamp without time zone NOT NULL,
  venue_name character varying NOT NULL,
  venue_address character varying,
  intro_message text,
  gallery_images ARRAY,
  ai_photo_url character varying,
  is_password_protected boolean NOT NULL DEFAULT false,
  password_hash character varying,
  view_count integer NOT NULL DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'DRAFT'::invitation_status,
  expires_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  extended_data jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT invitations_template_id_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.payments (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  method USER-DEFINED NOT NULL,
  amount integer NOT NULL,
  credits_granted integer,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::payment_status,
  order_id character varying UNIQUE,
  payment_key character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.rsvps (
  id character varying NOT NULL,
  invitation_id character varying NOT NULL,
  guest_name character varying NOT NULL,
  guest_phone character varying,
  guest_email character varying,
  attendance USER-DEFINED NOT NULL,
  guest_count integer NOT NULL DEFAULT 1,
  meal_option USER-DEFINED,
  message text,
  submitted_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT rsvps_invitation_id_invitations_id_fk FOREIGN KEY (invitation_id) REFERENCES public.invitations(id)
);
CREATE TABLE public.sessions (
  session_token character varying NOT NULL,
  user_id character varying NOT NULL,
  expires timestamp without time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (session_token),
  CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.templates (
  id character varying NOT NULL,
  name character varying NOT NULL,
  category USER-DEFINED NOT NULL,
  tier USER-DEFINED NOT NULL DEFAULT 'FREE'::template_tier,
  thumbnail character varying NOT NULL,
  config text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  email_verified timestamp without time zone,
  name character varying,
  image character varying,
  role USER-DEFINED NOT NULL DEFAULT 'USER'::user_role,
  premium_plan USER-DEFINED NOT NULL DEFAULT 'FREE'::premium_plan,
  ai_credits integer NOT NULL DEFAULT 5,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  email_notifications boolean NOT NULL DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);