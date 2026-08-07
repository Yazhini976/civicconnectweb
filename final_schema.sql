--
-- PostgreSQL database dump
--

\restrict 4PpQMwhVJYomI9CkkWuBRTax6X31cPfTAc76JBJyfnb8fw1x2ODobRPDQaQrdaa

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: ae1_field_teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ae1_field_teams (
    phone_number character varying(15) CONSTRAINT field_teams_phone_number_not_null NOT NULL,
    team_name character varying(100) CONSTRAINT field_teams_team_name_not_null NOT NULL,
    password_hash text CONSTRAINT field_teams_password_hash_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.ae1_field_teams OWNER TO postgres;

--
-- Name: ae2_field_teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ae2_field_teams (
    phone_number character varying(15) NOT NULL,
    team_name character varying(100) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.ae2_field_teams OWNER TO postgres;

--
-- Name: ae2_officers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ae2_officers (
    phone_number character varying(15) NOT NULL,
    team_name character varying(100) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.ae2_officers OWNER TO postgres;

--
-- Name: ae_module_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ae_module_mapping (
    mapping_id integer NOT NULL,
    ae_id integer NOT NULL,
    module_id integer NOT NULL
);


ALTER TABLE public.ae_module_mapping OWNER TO postgres;

--
-- Name: ae_module_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ae_module_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ae_module_mapping_mapping_id_seq OWNER TO postgres;

--
-- Name: ae_module_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ae_module_mapping_mapping_id_seq OWNED BY public.ae_module_mapping.mapping_id;


--
-- Name: ae_officers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ae_officers (
    ae_id integer NOT NULL,
    ae_name character varying(100) NOT NULL,
    phone_number character varying(15) NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ae_officers OWNER TO postgres;

--
-- Name: ae_officers_ae_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ae_officers_ae_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ae_officers_ae_id_seq OWNER TO postgres;

--
-- Name: ae_officers_ae_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ae_officers_ae_id_seq OWNED BY public.ae_officers.ae_id;


--
-- Name: complaint_updates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaint_updates (
    update_id integer NOT NULL,
    complaint_id uuid NOT NULL,
    ae_id integer,
    old_status character varying(30),
    new_status character varying(30) NOT NULL,
    remarks text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.complaint_updates OWNER TO postgres;

--
-- Name: complaint_updates_update_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.complaint_updates_update_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.complaint_updates_update_id_seq OWNER TO postgres;

--
-- Name: complaint_updates_update_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.complaint_updates_update_id_seq OWNED BY public.complaint_updates.update_id;


--
-- Name: complaints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complaints (
    complaint_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    user_phone character varying(15) NOT NULL,
    module_id integer NOT NULL,
    assigned_ae_id integer,
    location text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    complaint_photo text,
    reason character varying(150),
    description text,
    status character varying(30) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_officer_phone character varying(15),
    rejection_reason text,
    officer_rejection_reason text,
    pole_number character varying(100),
    feedback_rating character varying(50),
    feedback_comments text,
    feedback_submitted_at timestamp without time zone,
    CONSTRAINT valid_complaint_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACCEPTED'::character varying, 'IN_PROGRESS'::character varying, 'OFFICER_COMPLETED'::character varying, 'OFFICER_REJECTED'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.complaints OWNER TO postgres;

--
-- Name: eligible_couples; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eligible_couples (
    id integer NOT NULL,
    survey_id integer,
    ecno text,
    husband_name text,
    wife_name text,
    rchid text,
    reg_date date,
    bank_ac text,
    bank_branch text,
    husband_age_at_marriage text,
    wife_age_at_marriage text,
    mother_current_age text,
    total_pregnancies text,
    living_sons text,
    living_daughters text,
    abortions text,
    youngest_child_dob date,
    last_delivery_date date,
    pregnancy_test text,
    an_number text,
    anc_done text,
    anc_date date,
    next_visit date,
    planned_delivery_place text,
    current_health_status text,
    remarks text
);


ALTER TABLE public.eligible_couples OWNER TO postgres;

--
-- Name: eligible_couples_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eligible_couples_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eligible_couples_id_seq OWNER TO postgres;

--
-- Name: eligible_couples_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eligible_couples_id_seq OWNED BY public.eligible_couples.id;


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_members (
    id integer NOT NULL,
    survey_id integer,
    memno text,
    name text NOT NULL,
    rel text,
    dob date,
    age text,
    gender text,
    aadhar text,
    mobile text,
    blood text,
    marital text,
    edu text,
    occ text,
    income text,
    religion text,
    disability text,
    has_chronic_disease text,
    chronic_ncd text,
    chronic_cd text,
    treatment_place text,
    schemes text,
    vaccination text,
    remarks text
);


ALTER TABLE public.family_members OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_members_id_seq OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_members_id_seq OWNED BY public.family_members.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    module_id integer NOT NULL,
    module_name character varying(100) NOT NULL
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: modules_module_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_module_id_seq OWNER TO postgres;

--
-- Name: modules_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_module_id_seq OWNED BY public.modules.module_id;


--
-- Name: survey_corrections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_corrections (
    id integer NOT NULL,
    survey_id text,
    citizen_phone text,
    surveyor_name text,
    request_reason text,
    status character varying(30) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.survey_corrections OWNER TO postgres;

--
-- Name: survey_corrections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_corrections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_corrections_id_seq OWNER TO postgres;

--
-- Name: survey_corrections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_corrections_id_seq OWNED BY public.survey_corrections.id;


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.surveys (
    id integer NOT NULL,
    survey_id text,
    ward text NOT NULL,
    head text NOT NULL,
    phone text NOT NULL,
    door text NOT NULL,
    street text NOT NULL,
    famno text,
    ration text,
    abha text,
    pmja text,
    phr text,
    smartcard text,
    bpl text,
    caste text,
    insurance text,
    housing text,
    water text,
    toilet text,
    hh_size text,
    waste_amount text,
    waste_types text,
    waste_disposal text,
    waste_segregation text,
    waste_frequency text,
    status text DEFAULT 'Submitted'::text,
    collector text,
    survey_date text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.surveys OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.surveys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.surveys_id_seq OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.surveys_id_seq OWNED BY public.surveys.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    phone_number character varying(15) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(150)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: wards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wards (
    id integer NOT NULL,
    ward_no integer NOT NULL,
    ward_name text NOT NULL,
    lgd_code integer
);


ALTER TABLE public.wards OWNER TO postgres;

--
-- Name: wards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wards_id_seq OWNER TO postgres;

--
-- Name: wards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wards_id_seq OWNED BY public.wards.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: ae_module_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_module_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.ae_module_mapping_mapping_id_seq'::regclass);


--
-- Name: ae_officers ae_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_officers ALTER COLUMN ae_id SET DEFAULT nextval('public.ae_officers_ae_id_seq'::regclass);


--
-- Name: complaint_updates update_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates ALTER COLUMN update_id SET DEFAULT nextval('public.complaint_updates_update_id_seq'::regclass);


--
-- Name: eligible_couples id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eligible_couples ALTER COLUMN id SET DEFAULT nextval('public.eligible_couples_id_seq'::regclass);


--
-- Name: family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members ALTER COLUMN id SET DEFAULT nextval('public.family_members_id_seq'::regclass);


--
-- Name: modules module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN module_id SET DEFAULT nextval('public.modules_module_id_seq'::regclass);


--
-- Name: survey_corrections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_corrections ALTER COLUMN id SET DEFAULT nextval('public.survey_corrections_id_seq'::regclass);


--
-- Name: surveys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys ALTER COLUMN id SET DEFAULT nextval('public.surveys_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: wards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wards ALTER COLUMN id SET DEFAULT nextval('public.wards_id_seq'::regclass);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: ae2_field_teams ae2_field_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae2_field_teams
    ADD CONSTRAINT ae2_field_teams_pkey PRIMARY KEY (phone_number);


--
-- Name: ae2_officers ae2_officers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae2_officers
    ADD CONSTRAINT ae2_officers_pkey PRIMARY KEY (phone_number);


--
-- Name: ae_module_mapping ae_module_mapping_module_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_module_mapping
    ADD CONSTRAINT ae_module_mapping_module_id_key UNIQUE (module_id);


--
-- Name: ae_module_mapping ae_module_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_module_mapping
    ADD CONSTRAINT ae_module_mapping_pkey PRIMARY KEY (mapping_id);


--
-- Name: ae_officers ae_officers_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_officers
    ADD CONSTRAINT ae_officers_phone_number_key UNIQUE (phone_number);


--
-- Name: ae_officers ae_officers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_officers
    ADD CONSTRAINT ae_officers_pkey PRIMARY KEY (ae_id);


--
-- Name: complaint_updates complaint_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_pkey PRIMARY KEY (update_id);


--
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (complaint_id);


--
-- Name: eligible_couples eligible_couples_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eligible_couples
    ADD CONSTRAINT eligible_couples_pkey PRIMARY KEY (id);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- Name: ae1_field_teams field_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae1_field_teams
    ADD CONSTRAINT field_teams_pkey PRIMARY KEY (phone_number);


--
-- Name: modules modules_module_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_name_key UNIQUE (module_name);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


--
-- Name: survey_corrections survey_corrections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_corrections
    ADD CONSTRAINT survey_corrections_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: wards wards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wards
    ADD CONSTRAINT wards_pkey PRIMARY KEY (id);


--
-- Name: idx_complaints_ae; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_ae ON public.complaints USING btree (assigned_ae_id);


--
-- Name: idx_complaints_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_created_at ON public.complaints USING btree (created_at DESC);


--
-- Name: idx_complaints_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_module ON public.complaints USING btree (module_id);


--
-- Name: idx_complaints_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_phone ON public.complaints USING btree (user_phone);


--
-- Name: idx_complaints_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_status ON public.complaints USING btree (status);


--
-- Name: idx_complaints_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_complaints_user ON public.complaints USING btree (user_id);


--
-- Name: idx_surveys_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_surveys_address ON public.surveys USING btree (ward, door, street);


--
-- Name: idx_surveys_collector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_surveys_collector ON public.surveys USING btree (collector);


--
-- Name: ae_module_mapping ae_module_mapping_ae_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_module_mapping
    ADD CONSTRAINT ae_module_mapping_ae_id_fkey FOREIGN KEY (ae_id) REFERENCES public.ae_officers(ae_id);


--
-- Name: ae_module_mapping ae_module_mapping_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ae_module_mapping
    ADD CONSTRAINT ae_module_mapping_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id);


--
-- Name: complaint_updates complaint_updates_ae_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_ae_id_fkey FOREIGN KEY (ae_id) REFERENCES public.ae_officers(ae_id);


--
-- Name: complaint_updates complaint_updates_complaint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaint_updates
    ADD CONSTRAINT complaint_updates_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(complaint_id) ON DELETE CASCADE;


--
-- Name: complaints complaints_assigned_ae_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_assigned_ae_id_fkey FOREIGN KEY (assigned_ae_id) REFERENCES public.ae_officers(ae_id);


--
-- Name: complaints complaints_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id);


--
-- Name: complaints complaints_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: complaints complaints_user_phone_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_user_phone_fkey FOREIGN KEY (user_phone) REFERENCES public.users(phone_number);


--
-- Name: eligible_couples eligible_couples_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eligible_couples
    ADD CONSTRAINT eligible_couples_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- Name: family_members family_members_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 4PpQMwhVJYomI9CkkWuBRTax6X31cPfTAc76JBJyfnb8fw1x2ODobRPDQaQrdaa

