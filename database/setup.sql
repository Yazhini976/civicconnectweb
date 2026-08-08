-- Create database (run this separately first if database doesn't exist)
-- CREATE DATABASE civic_db;

-- Connect to the database and run the rest
\c civic_db;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS escalations CASCADE;
DROP TABLE IF EXISTS complaint_feedback CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS faults CASCADE;
DROP TABLE IF EXISTS stp_maintenance_logs CASCADE;
DROP TABLE IF EXISTS stp_daily_logs CASCADE;
DROP TABLE IF EXISTS pumping_yearly_logs CASCADE;
DROP TABLE IF EXISTS pumping_monthly_logs CASCADE;
DROP TABLE IF EXISTS pumping_weekly_logs CASCADE;
DROP TABLE IF EXISTS pumping_daily_logs CASCADE;
DROP TABLE IF EXISTS lifting_yearly_logs CASCADE;
DROP TABLE IF EXISTS lifting_monthly_logs CASCADE;
DROP TABLE IF EXISTS lifting_weekly_logs CASCADE;
DROP TABLE IF EXISTS lifting_daily_logs CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS property_master CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now run the schema
\i 'C:/UGSS/ugss-command-center-full/database/migrations/001_initial_schema.sql'

-- Load seed data
\i 'C:/UGSS/ugss-command-center-full/database/seed/seed_data.sql'
