-- Migration 001: Add RBAC and Phase 1 Core Objects
-- Purpose: Enhance users with roles, add companies, recruiters, resumes, cover letters, sources
-- Date: 2024-12-01

-- ============================================
-- PART 0: Enable Required Extensions
-- ============================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create trigger function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- PART 1: Create or Enhance Users Table with RBAC
-- ============================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'user';
-- Roles: 'admin' or 'user'

-- Add active status
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add last login tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add audit fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes for RBAC
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Add check constraint for valid roles
ALTER TABLE users ADD CONSTRAINT check_user_role 
    CHECK (role IN ('admin', 'user'));

-- ============================================
-- PART 2: User Authentication Logs (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS user_auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    -- 'login', 'logout', 'failed_login', 'password_change', 'role_change', 'password_reset'
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    
    -- For admin actions on users
    performed_by UUID REFERENCES users(id),
    -- If admin changed user's password/role, this is the admin's ID
    
    metadata JSONB,
    -- Additional context (e.g., old_role, new_role)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON user_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON user_auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON user_auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_performed_by ON user_auth_logs(performed_by);

-- ============================================
-- PART 3: Companies Table
-- ============================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Each user maintains their own company records
    
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    -- 'startup', 'small', 'medium', 'large', 'enterprise'
    
    website VARCHAR(500),
    headquarters_location VARCHAR(255),
    description TEXT,
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- User's notes and ratings
    notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    -- User's personal rating of the company
    
    glassdoor_rating DECIMAL(2,1),
    -- External rating (optional)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 4: Recruiters Table
-- ============================================

CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Each user maintains their own recruiter contacts
    
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    -- Optional - may be independent recruiter
    
    recruiter_type VARCHAR(50),
    -- 'internal_hr', 'external_agency', 'hiring_manager', 'independent', 'headhunter'
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    
    -- User's notes and ratings
    notes TEXT,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    -- User's rating of this recruiter
    
    is_active BOOLEAN DEFAULT true,
    -- Track if still working with this recruiter
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_company_id ON recruiters(company_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_name ON recruiters(name);
CREATE INDEX IF NOT EXISTS idx_recruiters_email ON recruiters(email);

-- Trigger for updated_at
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 5: Job Description Sources Table
-- ============================================

CREATE TABLE IF NOT EXISTS job_description_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source_type VARCHAR(50) NOT NULL,
    -- 'linkedin', 'indeed', 'glassdoor', 'company_website', 'recruiter', 
    -- 'referral', 'job_board', 'email', 'other'
    
    source_name VARCHAR(255) NOT NULL,
    -- e.g., "LinkedIn", "Indeed", "Recruiter: John Smith", "Referral: Jane Doe"
    
    source_url TEXT,
    -- Optional - link to original posting
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sources_type ON job_description_sources(source_type);

-- Seed common sources
INSERT INTO job_description_sources (source_type, source_name) VALUES
    ('linkedin', 'LinkedIn'),
    ('indeed', 'Indeed'),
    ('glassdoor', 'Glassdoor'),
    ('company_website', 'Company Website'),
    ('job_board', 'Job Board'),
    ('email', 'Email'),
    ('referral', 'Referral'),
    ('other', 'Other')
ON CONFLICT DO NOTHING;

-- ============================================
-- PART 6: Resumes Table
-- ============================================

CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    -- e.g., "Software Engineer Resume v2", "Consultant Resume"
    
    file_name VARCHAR(255),
    file_path TEXT,
    -- Where file is stored (local path or cloud URL)
    
    file_type VARCHAR(50),
    -- 'pdf', 'docx', 'txt'
    
    file_size_bytes INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    -- Current/default resume
    
    version_number INTEGER DEFAULT 1,
    -- Track resume versions
    
    content_summary TEXT,
    -- Optional - extracted text for analysis
    
    skills_highlighted TEXT[],
    -- Array of key skills emphasized in this resume
    
    notes TEXT,
    -- User's notes about this resume version
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_active ON resumes(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 7: Cover Letters Table
-- ============================================

CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    -- e.g., "Generic Cover Letter", "Tech Startup Template", "Consulting Letter"
    
    content TEXT,
    -- Full text of cover letter
    
    file_name VARCHAR(255),
    file_path TEXT,
    -- Where file is stored (if saved as file)
    
    file_type VARCHAR(50),
    -- 'pdf', 'docx', 'txt'
    
    is_template BOOLEAN DEFAULT false,
    -- Reusable template vs specific letter
    
    is_active BOOLEAN DEFAULT true,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_is_template ON cover_letters(is_template);
CREATE INDEX IF NOT EXISTS idx_cover_letters_is_active ON cover_letters(is_active);

-- Trigger for updated_at
CREATE TRIGGER update_cover_letters_updated_at BEFORE UPDATE ON cover_letters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 8: Create or Enhance Job Descriptions Table
-- ============================================

-- Create job_descriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description TEXT,
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON job_descriptions(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to existing job_descriptions table
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES job_description_sources(id) ON DELETE SET NULL;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL;

-- Add job details
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'full_time';
-- 'full_time', 'part_time', 'contract', 'consulting', 'freelance'

ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS remote_policy VARCHAR(50) DEFAULT 'onsite';
-- 'remote', 'hybrid', 'onsite'

ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS salary_range_min DECIMAL(12,2);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS salary_range_max DECIMAL(12,2);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'USD';

ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS consulting_rate VARCHAR(100);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS consulting_period VARCHAR(100);

-- Add tracking fields
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'saved';
-- 'saved', 'interested', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn', 'accepted'

ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS date_posted DATE;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS date_found DATE DEFAULT CURRENT_DATE;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS application_deadline DATE;

-- Add duplicate tracking
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS similarity_score DECIMAL(3,2);
-- Score between 0.00 and 1.00 for duplicate detection

-- Add contact info from JDAnalyzer form
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS contact_info TEXT;
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS job_info TEXT;

-- Add notes
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Rename 'title' to 'job_title' for clarity (if needed)
-- ALTER TABLE job_descriptions RENAME COLUMN title TO job_title;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_job_descriptions_source_id ON job_descriptions(source_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_company_id ON job_descriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_recruiter_id ON job_descriptions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_is_duplicate ON job_descriptions(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_date_found ON job_descriptions(date_found);

-- Add check constraint for valid status
ALTER TABLE job_descriptions ADD CONSTRAINT check_jd_status 
    CHECK (status IN ('saved', 'interested', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn', 'accepted'));

-- Add check constraint for valid job_type
ALTER TABLE job_descriptions ADD CONSTRAINT check_jd_job_type 
    CHECK (job_type IN ('full_time', 'part_time', 'contract', 'consulting', 'freelance'));

-- Add check constraint for valid remote_policy
ALTER TABLE job_descriptions ADD CONSTRAINT check_jd_remote_policy 
    CHECK (remote_policy IN ('remote', 'hybrid', 'onsite'));

-- ============================================
-- PART 9: Seed First Admin User
-- ============================================

-- Create first admin user (password: Admin123!)
-- Password hash generated with bcrypt, rounds=10
-- You should change this password immediately after first login!
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
    'System Admin',
    'admin@spexture-com.local',
    '$2b$10$rZ5LkH8K8xJQK5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K5Y5K',
    -- This is a placeholder hash - will be replaced by actual bcrypt hash
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Note: In production, generate the hash with:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('Admin123!', 10);

-- ============================================
-- PART 10: Create View for Admin User Management
-- ============================================

CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    creator.name as created_by_name,
    updater.name as updated_by_name,
    COUNT(DISTINCT jd.id) as job_descriptions_count,
    COUNT(DISTINCT r.id) as resumes_count,
    COUNT(DISTINCT cl.id) as cover_letters_count
FROM users u
LEFT JOIN users creator ON u.created_by = creator.id
LEFT JOIN users updater ON u.updated_by = updater.id
LEFT JOIN job_descriptions jd ON u.id = jd.user_id
LEFT JOIN resumes r ON u.id = r.user_id
LEFT JOIN cover_letters cl ON u.id = cl.user_id
GROUP BY u.id, creator.name, updater.name;

-- ============================================
-- PART 11: Comments for Documentation
-- ============================================

COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: admin or user';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active';
COMMENT ON COLUMN users.created_by IS 'Admin who created this user (for audit trail)';
COMMENT ON COLUMN users.updated_by IS 'Admin who last updated this user (for audit trail)';

COMMENT ON TABLE user_auth_logs IS 'Audit trail for authentication and admin actions';
COMMENT ON TABLE companies IS 'Companies offering jobs (user-specific records)';
COMMENT ON TABLE recruiters IS 'Recruiters and hiring contacts (user-specific records)';
COMMENT ON TABLE resumes IS 'User resume versions for tracking which was submitted';
COMMENT ON TABLE cover_letters IS 'User cover letter versions and templates';
COMMENT ON TABLE job_description_sources IS 'Sources where job descriptions were found';

