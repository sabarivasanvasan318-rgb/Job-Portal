-- =========================================
--  JobNest - Online Job Portal
--  database.sql — MySQL Schema
--  Database: MySQL
-- =========================================

-- Create and select database
CREATE DATABASE IF NOT EXISTS jobnest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jobnest_db;

-- =========================================
--  TABLE: users
--  Stores both job seekers and employers
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    role            ENUM('seeker', 'employer') NOT NULL DEFAULT 'seeker',
    phone           VARCHAR(20)     DEFAULT NULL,
    location        VARCHAR(100)    DEFAULT NULL,
    title           VARCHAR(150)    DEFAULT NULL,   -- Job title (seeker) / Company type (employer)
    skills          TEXT            DEFAULT NULL,   -- Comma-separated skills
    summary         TEXT            DEFAULT NULL,
    linkedin        VARCHAR(255)    DEFAULT NULL,
    github          VARCHAR(255)    DEFAULT NULL,
    expected_salary VARCHAR(50)     DEFAULT NULL,
    notice_period   VARCHAR(50)     DEFAULT NULL,
    resume_path     VARCHAR(255)    DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role  (role)
) ENGINE=InnoDB;


-- =========================================
--  TABLE: jobs
--  Job postings created by employers
-- =========================================
CREATE TABLE IF NOT EXISTS jobs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employer_id     INT             NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    department      VARCHAR(100)    DEFAULT NULL,
    location        VARCHAR(100)    NOT NULL,
    job_type        ENUM('Full-time', 'Part-time', 'Contract', 'Internship') NOT NULL DEFAULT 'Full-time',
    experience      ENUM('Fresher', '1-3 years', '3-5 years', '5+ years')   NOT NULL DEFAULT 'Fresher',
    salary_range    VARCHAR(50)     DEFAULT 'Competitive',
    skills          TEXT            DEFAULT NULL,   -- Required skills (comma-separated)
    deadline        DATE            DEFAULT NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employer  (employer_id),
    INDEX idx_location  (location),
    INDEX idx_job_type  (job_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;


-- =========================================
--  TABLE: applications
--  Job applications submitted by seekers
-- =========================================
CREATE TABLE IF NOT EXISTS applications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_id          INT             NOT NULL,
    seeker_id       INT             NOT NULL,
    cover_letter    TEXT            DEFAULT NULL,
    status          ENUM('pending', 'shortlisted', 'rejected') NOT NULL DEFAULT 'pending',
    applied_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_job    FOREIGN KEY (job_id)    REFERENCES jobs(id)   ON DELETE CASCADE,
    CONSTRAINT fk_app_seeker FOREIGN KEY (seeker_id) REFERENCES users(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_application (job_id, seeker_id),  -- Prevent duplicate applications
    INDEX idx_job_id    (job_id),
    INDEX idx_seeker_id (seeker_id),
    INDEX idx_status    (status)
) ENGINE=InnoDB;


-- =========================================
--  SAMPLE DATA — For Development/Testing
-- =========================================

-- Sample employer accounts (password = 'password123')
INSERT INTO users (name, email, password, role, location, title) VALUES
('TechCorp India',      'techcorp@example.com',    SHA2('password123', 256), 'employer', 'Bangalore', 'Technology Company'),
('DataSoft Solutions',  'datasoft@example.com',    SHA2('password123', 256), 'employer', 'Remote',    'Software Services'),
('Creative Labs',       'creativelabs@example.com',SHA2('password123', 256), 'employer', 'Mumbai',    'Design Studio'),
('Startup Hub',         'startuphub@example.com',  SHA2('password123', 256), 'employer', 'Chennai',   'Product Startup');

-- Sample seeker accounts (password = 'password123')
INSERT INTO users (name, email, password, role, location, title, skills, expected_salary, notice_period) VALUES
('Arjun Kumar',  'arjun@example.com', SHA2('password123', 256), 'seeker', 'Bangalore', 'Full Stack Developer', 'React, Python, Node.js, MySQL', '8-12 LPA', '1 month'),
('Priya Sharma', 'priya@example.com', SHA2('password123', 256), 'seeker', 'Mumbai',    'UI/UX Designer',       'Figma, Adobe XD, CSS, HTML',   '6-9 LPA',  'Immediate'),
('Rahul Verma',  'rahul@example.com', SHA2('password123', 256), 'seeker', 'Delhi',     'Python Developer',     'Python, Django, MySQL, REST',  '8-12 LPA', '15 days');

-- Sample job postings
INSERT INTO jobs (employer_id, title, description, department, location, job_type, experience, salary_range, skills, deadline) VALUES
(1, 'Senior React Developer',  'Build scalable frontend applications for our SaaS platform. Work with React, Redux, and TypeScript.', 'Engineering', 'Bangalore', 'Full-time', '3-5 years', '10-15 LPA', 'React, Redux, TypeScript, HTML, CSS',    '2026-04-30'),
(2, 'Python Backend Engineer', 'Develop RESTful APIs and microservices for our data platform.',                                         'Engineering', 'Remote',    'Full-time', '1-3 years', '8-12 LPA',  'Python, Django, MySQL, REST API, Docker','2026-04-25'),
(3, 'UI/UX Designer',          'Design beautiful and intuitive user interfaces for our web and mobile products.',                       'Design',      'Mumbai',    'Full-time', '1-3 years', '6-9 LPA',   'Figma, Adobe XD, CSS, User Research',   '2026-05-15'),
(4, 'Full Stack Developer',    'Join our growing team to build end-to-end web applications.',                                          'Product',     'Chennai',   'Full-time', '3-5 years', '12-18 LPA', 'React, Node.js, MongoDB, Express',      '2026-04-20'),
(1, 'DevOps Engineer',         'Manage cloud infrastructure and CI/CD pipelines for production systems.',                              'Infrastructure','Bangalore','Full-time', '3-5 years', '14-20 LPA', 'Docker, Kubernetes, AWS, Terraform',    '2026-05-01');

-- Sample applications
INSERT INTO applications (job_id, seeker_id, cover_letter, status) VALUES
(1, 5, 'I am excited about this role and have 3 years of experience with React.', 'shortlisted'),
(3, 6, 'My design background matches exactly what you need.',                       'pending'),
(2, 7, 'Passionate about Python and backend development.',                          'shortlisted'),
(4, 5, 'I have experience with the full MERN stack.',                               'rejected');


-- =========================================
--  USEFUL QUERIES FOR REFERENCE
-- =========================================

-- Get all jobs with company name:
-- SELECT j.*, u.name AS company_name FROM jobs j JOIN users u ON j.employer_id = u.id WHERE j.is_active = 1;

-- Get applications for a seeker:
-- SELECT a.*, j.title AS job_title, u.name AS company_name FROM applications a JOIN jobs j ON a.job_id = j.id JOIN users u ON j.employer_id = u.id WHERE a.seeker_id = 5;

-- Get applications for an employer:
-- SELECT a.*, j.title AS job_title, u.name AS candidate_name FROM applications a JOIN jobs j ON a.job_id = j.id JOIN users u ON a.seeker_id = u.id WHERE j.employer_id = 1;

-- Count applications per job:
-- SELECT j.title, COUNT(a.id) AS application_count FROM jobs j LEFT JOIN applications a ON j.id = a.job_id WHERE j.employer_id = 1 GROUP BY j.id;
