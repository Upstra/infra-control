--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

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


ALTER TYPE public.group_type OWNER TO postgres;

--
-- Name: setup_progress_step_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.setup_progress_step_enum AS ENUM (
    'welcome',
    'create-room',
    'create-ups',
    'create-server',
    'vm-discovery',
    'complete'
);


ALTER TYPE public.setup_progress_step_enum OWNER TO postgres;

--
-- Name: widget_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.widget_type AS ENUM (
    'stats',
    'activity-feed',
    'alerts',
    'resource-usage',
    'user-presence',
    'system-health',
    'ups-status'
);


ALTER TYPE public.widget_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dashboard_layouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_layouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    columns integer DEFAULT 12 NOT NULL,
    row_height integer DEFAULT 80 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_layouts OWNER TO postgres;

--
-- Name: dashboard_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    default_layout_id uuid,
    refresh_interval integer DEFAULT 30000 NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    notifications jsonb DEFAULT '{"alerts": true, "activities": false}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_preferences OWNER TO postgres;

--
-- Name: dashboard_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    preview character varying(500),
    widgets jsonb NOT NULL,
    columns integer DEFAULT 12 NOT NULL,
    row_height integer DEFAULT 80 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_templates OWNER TO postgres;

--
-- Name: dashboard_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dashboard_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dashboard_templates_id_seq OWNER TO postgres;

--
-- Name: dashboard_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dashboard_templates_id_seq OWNED BY public.dashboard_templates.id;


--
-- Name: dashboard_widgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dashboard_widgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.widget_type NOT NULL,
    title character varying(255) NOT NULL,
    "position" jsonb NOT NULL,
    settings jsonb,
    refresh_interval integer,
    visible boolean DEFAULT true NOT NULL,
    layout_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_widgets OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type public.group_type NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: history_event; Type: TABLE; Schema: public; Owner: postgres
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
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.history_event OWNER TO postgres;

--
-- Name: ilo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ilo (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL
);


ALTER TABLE public.ilo OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: permission_server; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_server (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    bitmask integer DEFAULT 0 NOT NULL,
    "serverId" uuid
);


ALTER TABLE public.permission_server OWNER TO postgres;

--
-- Name: permission_vm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_vm (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    bitmask integer DEFAULT 0 NOT NULL,
    "vmId" uuid
);


ALTER TABLE public.permission_vm OWNER TO postgres;

--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "canCreateServer" boolean DEFAULT false NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: room; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.room OWNER TO postgres;

--
-- Name: server; Type: TABLE; Schema: public; Owner: postgres
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
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.server OWNER TO postgres;

--
-- Name: setup_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setup_progress (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    step public.setup_progress_step_enum NOT NULL,
    "completedAt" timestamp without time zone NOT NULL,
    "completedBy" character varying NOT NULL,
    metadata json
);


ALTER TABLE public.setup_progress OWNER TO postgres;

--
-- Name: ups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    ip character varying NOT NULL,
    login character varying NOT NULL,
    password character varying NOT NULL,
    grace_period_on integer NOT NULL,
    grace_period_off integer NOT NULL,
    "roomId" uuid NOT NULL
);


ALTER TABLE public.ups OWNER TO postgres;

--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
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
    active boolean DEFAULT false NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: vm; Type: TABLE; Schema: public; Owner: postgres
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
    "serverId" uuid NOT NULL
);


ALTER TABLE public.vm OWNER TO postgres;

--
-- Name: dashboard_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_templates ALTER COLUMN id SET DEFAULT nextval('public.dashboard_templates_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: dashboard_layouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dashboard_layouts (id, name, columns, row_height, is_default, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboard_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dashboard_preferences (id, user_id, default_layout_id, refresh_interval, theme, notifications, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboard_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dashboard_templates (id, name, description, preview, widgets, columns, row_height, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboard_widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dashboard_widgets (id, type, title, "position", settings, refresh_interval, visible, layout_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, description, type, is_active, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: history_event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.history_event (id, entity, "entityId", action, "userId", "oldValue", "newValue", metadata, "ipAddress", "userAgent", "correlationId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ilo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ilo (id, name, ip, login, password) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1725465600000	enhance-history-event-table1725465600000
2	1751559629881	AddGroupFieldsAndRelations1751559629881
3	1751644208200	MergeGroupTables1751644208200
4	1751678264805	RemoveVmPriorityUniqueConstraint1751678264805
5	1751726035833	RemoveUniqueConstraintOnGroupId1751726035833
\.


--
-- Data for Name: permission_server; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission_server (id, "roleId", bitmask, "serverId") FROM stdin;
\.


--
-- Data for Name: permission_vm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission_vm (id, "roleId", bitmask, "vmId") FROM stdin;
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (id, name, "canCreateServer", "isAdmin") FROM stdin;
\.


--
-- Data for Name: room; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.room (id, name) FROM stdin;
\.


--
-- Data for Name: server; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.server (id, name, state, grace_period_on, grace_period_off, "adminUrl", ip, login, password, type, priority, group_id, "roomId", "upsId", "iloId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: setup_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.setup_progress (id, step, "completedAt", "completedBy", metadata) FROM stdin;
\.


--
-- Data for Name: ups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ups (id, name, ip, login, password, grace_period_on, grace_period_off, "roomId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, username, "firstName", "lastName", password, email, "isTwoFactorEnabled", "twoFactorSecret", "createdAt", "updatedAt", "lastLoggedIn", "recoveryCodes", active) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles ("userId", "roleId") FROM stdin;
\.


--
-- Data for Name: vm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vm (id, name, state, grace_period_on, grace_period_off, os, "adminUrl", ip, login, password, priority, group_id, "serverId") FROM stdin;
\.


--
-- Name: dashboard_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dashboard_templates_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- Name: dashboard_layouts PK_1850c429674a715d8cb13769efb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT "PK_1850c429674a715d8cb13769efb" PRIMARY KEY (id);


--
-- Name: vm PK_3111768eccf1e167186faefd138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "PK_3111768eccf1e167186faefd138" PRIMARY KEY (id);


--
-- Name: ilo PK_39b1ea0a330f51afb14de8b9508; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ilo
    ADD CONSTRAINT "PK_39b1ea0a330f51afb14de8b9508" PRIMARY KEY (id);


--
-- Name: permission_vm PK_3c8690909447513028dc02361e0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_vm
    ADD CONSTRAINT "PK_3c8690909447513028dc02361e0" PRIMARY KEY (id);


--
-- Name: ups PK_5f9511c6880d95b37867142d317; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ups
    ADD CONSTRAINT "PK_5f9511c6880d95b37867142d317" PRIMARY KEY (id);


--
-- Name: groups PK_659d1483316afb28afd3a90646e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY (id);


--
-- Name: dashboard_templates PK_6c71c37f6487e2ed41a4de7212d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_templates
    ADD CONSTRAINT "PK_6c71c37f6487e2ed41a4de7212d" PRIMARY KEY (id);


--
-- Name: history_event PK_7fbfa45c0a68854e44cba8c6497; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.history_event
    ADD CONSTRAINT "PK_7fbfa45c0a68854e44cba8c6497" PRIMARY KEY (id);


--
-- Name: dashboard_preferences PK_7fe68b766b0745c53bf95895d9f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT "PK_7fe68b766b0745c53bf95895d9f" PRIMARY KEY (id);


--
-- Name: setup_progress PK_87d342514e0b5b68559ce5afee7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setup_progress
    ADD CONSTRAINT "PK_87d342514e0b5b68559ce5afee7" PRIMARY KEY (id);


--
-- Name: user_roles PK_88481b0c4ed9ada47e9fdd67475; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId");


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: dashboard_widgets PK_a77038e4644617970badd975284; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT "PK_a77038e4644617970badd975284" PRIMARY KEY (id);


--
-- Name: role PK_b36bcfe02fc8de3c57a8b2391c2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY (id);


--
-- Name: room PK_c6d46db005d623e691b2fbcba23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: permission_server PK_ccf720167f56f51a66b3475a63b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_server
    ADD CONSTRAINT "PK_ccf720167f56f51a66b3475a63b" PRIMARY KEY (id);


--
-- Name: server PK_f8b8af38bdc23b447c0a57c7937; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY (id);


--
-- Name: server REL_f83b474ec058a91f8eda9f261d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "REL_f83b474ec058a91f8eda9f261d" UNIQUE ("iloId");


--
-- Name: dashboard_templates UQ_17a92cc2e48efc2a3c168eec6b8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_templates
    ADD CONSTRAINT "UQ_17a92cc2e48efc2a3c168eec6b8" UNIQUE (name);


--
-- Name: dashboard_preferences UQ_280fe6e94d2968dead6828ccce3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT "UQ_280fe6e94d2968dead6828ccce3" UNIQUE (user_id);


--
-- Name: ups UQ_540e343c3a99241274caeda3c0a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ups
    ADD CONSTRAINT "UQ_540e343c3a99241274caeda3c0a" UNIQUE (ip);


--
-- Name: groups UQ_664ea405ae2a10c264d582ee563; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "UQ_664ea405ae2a10c264d582ee563" UNIQUE (name);


--
-- Name: user UQ_78a916df40e02a9deb1c4b75edb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username);


--
-- Name: server UQ_c3980a47e3be508ba479409ed62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "UQ_c3980a47e3be508ba479409ed62" UNIQUE (ip);


--
-- Name: vm UQ_e50fb323d0474977f2553f160f7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "UQ_e50fb323d0474977f2553f160f7" UNIQUE (ip);


--
-- Name: IDX_472b25323af01488f1f66a06b6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON public.user_roles USING btree ("userId");


--
-- Name: IDX_86033897c009fcca8b6505d6be; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON public.user_roles USING btree ("roleId");


--
-- Name: ups FK_05d137f99b386620e64d51f341c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ups
    ADD CONSTRAINT "FK_05d137f99b386620e64d51f341c" FOREIGN KEY ("roomId") REFERENCES public.room(id);


--
-- Name: permission_vm FK_12fdfb375f0126cafdba33ee849; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_vm
    ADD CONSTRAINT "FK_12fdfb375f0126cafdba33ee849" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: dashboard_preferences FK_280fe6e94d2968dead6828ccce3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT "FK_280fe6e94d2968dead6828ccce3" FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: history_event FK_2f9dbf5a1d7c6c471fd45d8bc6d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.history_event
    ADD CONSTRAINT "FK_2f9dbf5a1d7c6c471fd45d8bc6d" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: dashboard_widgets FK_34ec67535e1a5c78ce512d8702c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT "FK_34ec67535e1a5c78ce512d8702c" FOREIGN KEY (layout_id) REFERENCES public.dashboard_layouts(id) ON DELETE CASCADE;


--
-- Name: user_roles FK_472b25323af01488f1f66a06b67; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles FK_86033897c009fcca8b6505d6be2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: server FK_930179be61799a196d0704cd907; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_930179be61799a196d0704cd907" FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: vm FK_ba05bdb9ba2dc67b899830fd83d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "FK_ba05bdb9ba2dc67b899830fd83d" FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: server FK_be433e1eb33b226b5da737f5424; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_be433e1eb33b226b5da737f5424" FOREIGN KEY ("upsId") REFERENCES public.ups(id);


--
-- Name: permission_vm FK_bfbb61f8f1d593b59375858c276; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_vm
    ADD CONSTRAINT "FK_bfbb61f8f1d593b59375858c276" FOREIGN KEY ("vmId") REFERENCES public.vm(id) ON DELETE SET NULL;


--
-- Name: vm FK_c22deb8aa9293793c5c12650908; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vm
    ADD CONSTRAINT "FK_c22deb8aa9293793c5c12650908" FOREIGN KEY ("serverId") REFERENCES public.server(id);


--
-- Name: permission_server FK_d8106026a47302b3af6379c25a2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_server
    ADD CONSTRAINT "FK_d8106026a47302b3af6379c25a2" FOREIGN KEY ("serverId") REFERENCES public.server(id) ON DELETE CASCADE;


--
-- Name: dashboard_layouts FK_ddcbe1e4b5bca76d3a72ff21860; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT "FK_ddcbe1e4b5bca76d3a72ff21860" FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: server FK_e4df170ae4c236d2005844e9076; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_e4df170ae4c236d2005844e9076" FOREIGN KEY ("roomId") REFERENCES public.room(id);


--
-- Name: permission_server FK_e6e4b1fda3cf0b1fff9a15900b8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_server
    ADD CONSTRAINT "FK_e6e4b1fda3cf0b1fff9a15900b8" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: server FK_f83b474ec058a91f8eda9f261d0; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server
    ADD CONSTRAINT "FK_f83b474ec058a91f8eda9f261d0" FOREIGN KEY ("iloId") REFERENCES public.ilo(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

