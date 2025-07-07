--
-- PostgreSQL database dump - Schema Only
-- Initial schema backup for production deployment
-- Generated: 2025-01-07
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

--
-- Name: group_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.group_type AS ENUM (
    'VM',
    'SERVER'
);

--
-- Name: dashboard_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dashboard_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres  
--

CREATE SEQUENCE public.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Table: user
--

CREATE TABLE public."user" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying NOT NULL,
    "firstName" character varying(100) NOT NULL,
    "lastName" character varying(100) NOT NULL,
    password character varying NOT NULL,
    email character varying,
    "isTwoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "lastLoggedIn" timestamp without time zone,
    "recoveryCodes" text[],
    active boolean DEFAULT false NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp without time zone,
    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id),
    CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username)
);

--
-- Table: role
--

CREATE TABLE public.role (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "canCreateServer" boolean DEFAULT false NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY (id)
);

--
-- Table: user_roles
--

CREATE TABLE public.user_roles (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId")
);

--
-- Table: room
--

CREATE TABLE public.room (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY (id)
);

--
-- Table: ups
--

CREATE TABLE public.ups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    grace_period_on integer NOT NULL,
    grace_period_off integer NOT NULL,
    "roomId" uuid NOT NULL,
    CONSTRAINT "PK_5f9511c6880d95b37867142d317" PRIMARY KEY (id),
    CONSTRAINT "UQ_540e343c3a99241274caeda3c0a" UNIQUE (ip)
);

--
-- Table: ilo
--

CREATE TABLE public.ilo (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    CONSTRAINT "PK_39b1ea0a330f51afb14de8b9508" PRIMARY KEY (id)
);

--
-- Table: groups
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY (id),
    CONSTRAINT "UQ_664ea405ae2a10c264d582ee563" UNIQUE (name)
);

--
-- Table: server
--

CREATE TABLE public.server (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    state character varying NOT NULL,
    grace_period_on integer NOT NULL,
    grace_period_off integer NOT NULL,
    "adminUrl" character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    type character varying NOT NULL,
    priority integer NOT NULL,
    group_id uuid,
    "roomId" uuid,
    "upsId" uuid,
    "iloId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY (id),
    CONSTRAINT "REL_f83b474ec058a91f8eda9f261d" UNIQUE ("iloId"),
    CONSTRAINT "UQ_c3980a47e3be508ba479409ed62" UNIQUE (ip)
);

--
-- Table: vm
--

CREATE TABLE public.vm (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    state character varying NOT NULL,
    grace_period_on integer NOT NULL,
    grace_period_off integer NOT NULL,
    os character varying NOT NULL,
    "adminUrl" character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    priority integer NOT NULL,
    group_id uuid,
    "serverId" uuid NOT NULL,
    CONSTRAINT "PK_3111768eccf1e167186faefd138" PRIMARY KEY (id),
    CONSTRAINT "UQ_e50fb323d0474977f2553f160f7" UNIQUE (ip)
);

--
-- Table: permission_server
--

CREATE TABLE public.permission_server (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    bitmask integer DEFAULT 0 NOT NULL,
    "serverId" uuid,
    CONSTRAINT "PK_ccf720167f56f51a66b3475a63b" PRIMARY KEY (id)
);

--
-- Table: permission_vm
--

CREATE TABLE public.permission_vm (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    bitmask integer DEFAULT 0 NOT NULL,
    "vmId" uuid,
    CONSTRAINT "PK_3c8690909447513028dc02361e0" PRIMARY KEY (id)
);

--
-- Table: history_event
--

CREATE TABLE public.history_event (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entity character varying NOT NULL,
    "entityId" character varying NOT NULL,
    action character varying NOT NULL,
    "userId" uuid,
    "oldValue" jsonb,
    "newValue" jsonb,
    metadata jsonb,
    "ipAddress" character varying,
    "userAgent" character varying,
    "correlationId" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_7fbfa45c0a68854e44cba8c6497" PRIMARY KEY (id)
);

--
-- Table: setup_progress
--

CREATE TABLE public.setup_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    step character varying NOT NULL,
    "completedAt" timestamp without time zone NOT NULL,
    "completedBy" character varying NOT NULL,
    metadata json,
    CONSTRAINT "PK_87d342514e0b5b68559ce5afee7" PRIMARY KEY (id)
);

--
-- Table: dashboard_layouts
--

CREATE TABLE public.dashboard_layouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    columns integer DEFAULT 12 NOT NULL,
    row_height integer DEFAULT 80 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_1850c429674a715d8cb13769efb" PRIMARY KEY (id)
);

--
-- Table: dashboard_widgets
--

CREATE TABLE public.dashboard_widgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying NOT NULL,
    title character varying(255) NOT NULL,
    position jsonb NOT NULL,
    settings jsonb,
    refresh_interval integer,
    visible boolean DEFAULT true NOT NULL,
    layout_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_a77038e4644617970badd975284" PRIMARY KEY (id)
);

--
-- Table: dashboard_preferences
--

CREATE TABLE public.dashboard_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    default_layout_id uuid,
    refresh_interval integer DEFAULT 30000 NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    notifications jsonb DEFAULT '{"alerts": true, "activities": false}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_7fe68b766b0745c53bf95895d9f" PRIMARY KEY (id),
    CONSTRAINT "UQ_280fe6e94d2968dead6828ccce3" UNIQUE (user_id)
);

--
-- Table: dashboard_templates
--

CREATE TABLE public.dashboard_templates (
    id integer DEFAULT nextval('public.dashboard_templates_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    preview character varying(500),
    widgets jsonb NOT NULL,
    columns integer DEFAULT 12 NOT NULL,
    row_height integer DEFAULT 80 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_6c71c37f6487e2ed41a4de7212d" PRIMARY KEY (id),
    CONSTRAINT "UQ_17a92cc2e48efc2a3c168eec6b8" UNIQUE (name)
);

--
-- Add Foreign Key Constraints
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.ups
    ADD CONSTRAINT "FK_05d137f99b386620e64d51f341c" FOREIGN KEY ("roomId") REFERENCES public.room(id);

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_930179be61799a196d0704cd907" FOREIGN KEY (group_id) REFERENCES public.groups(id);

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_e4df170ae4c236d2005844e9076" FOREIGN KEY ("roomId") REFERENCES public.room(id);

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_be433e1eb33b226b5da737f5424" FOREIGN KEY ("upsId") REFERENCES public.ups(id);

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_f83b474ec058a91f8eda9f261d0" FOREIGN KEY ("iloId") REFERENCES public.ilo(id);

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "FK_ba05bdb9ba2dc67b899830fd83d" FOREIGN KEY (group_id) REFERENCES public.groups(id);

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "FK_c22deb8aa9293793c5c12650908" FOREIGN KEY ("serverId") REFERENCES public.server(id);

ALTER TABLE ONLY public.permission_server
    ADD CONSTRAINT "FK_e6e4b1fda3cf0b1fff9a15900b8" FOREIGN KEY ("roleId") REFERENCES public.role(id);

ALTER TABLE ONLY public.permission_server
    ADD CONSTRAINT "FK_d8106026a47302b3af6379c25a2" FOREIGN KEY ("serverId") REFERENCES public.server(id);

ALTER TABLE ONLY public.permission_vm
    ADD CONSTRAINT "FK_12fdfb375f0126cafdba33ee849" FOREIGN KEY ("roleId") REFERENCES public.role(id);

ALTER TABLE ONLY public.permission_vm
    ADD CONSTRAINT "FK_bfbb61f8f1d593b59375858c276" FOREIGN KEY ("vmId") REFERENCES public.vm(id);

ALTER TABLE ONLY public.history_event
    ADD CONSTRAINT "FK_2f9dbf5a1d7c6c471fd45d8bc6d" FOREIGN KEY ("userId") REFERENCES public."user"(id);

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT "FK_ddcbe1e4b5bca76d3a72ff21860" FOREIGN KEY (user_id) REFERENCES public."user"(id);

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT "FK_34ec67535e1a5c78ce512d8702c" FOREIGN KEY (layout_id) REFERENCES public.dashboard_layouts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT "FK_280fe6e94d2968dead6828ccce3" FOREIGN KEY (user_id) REFERENCES public."user"(id);

--
-- Create Indexes
--

CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON public.user_roles USING btree ("userId");
CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON public.user_roles USING btree ("roleId");

--
-- PostgreSQL database dump complete
--