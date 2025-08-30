-- Department
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active'
);

-- Project Phases
CREATE TABLE project_phases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE risk_levels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level VARCHAR(20) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active'
);
-- Insert initial risk levels
INSERT INTO risk_levels (id, name, description, color, status) VALUES
(1, 'Low', 'Minimal impact on project objectives', 'Green', 'Active'),
(2, 'Medium', 'Moderate impact on project objectives', 'Yellow', 'Active'),
(3, 'High', 'Significant impact on project objectives', 'Red', 'Active'),
(4, 'Critical', 'Severe impact that may compromise project success', 'Red', 'Active');

-- System Configuration
CREATE TABLE system_configuration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organizationName VARCHAR(100),
    notificationEmail VARCHAR(100),
    defaultCurrency VARCHAR(10),
    autoEscalationDays INT,
    fiscalYearStart VARCHAR(20),
    backupFrequency VARCHAR(20)
);

-- Update Tools Table
ALTER TABLE tools ADD COLUMN status VARCHAR(20) DEFAULT 'Active';
-- Team
CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    lead_id INT,
    created_at DATETIME
);
ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL;

-- User (Staff)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    team_id INT,
    officeLocation VARCHAR(100),
    status VARCHAR(20),
    joined_at DATETIME,
    profile_picture_url VARCHAR(255),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Add lead_id foreign key after both tables exist
ALTER TABLE teams
ADD CONSTRAINT fk_lead_id FOREIGN KEY (lead_id) REFERENCES users(id);

-- Project
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    end_date DATE,
    status VARCHAR(30),
    owner_id INT,
    team_id INT,
    beneficiary VARCHAR(100),
    created_at DATETIME,
    timerStartTime DATETIME DEFAULT NULL,
    usedHours FLOAT DEFAULT 0,
    completedAt DATETIME NULL,
    phase VARCHAR(50) NULL,
    startDate DATETIME NULL,
    allocatedHours FLOAT DEFAULT 0,
    milestoneDate DATE DEFAULT NULL,
    team JSON,
    users JSON,
    toolsUsed JSON,
    latestComments JSON,
    additionalHours INT DEFAULT 0,
    savedHours INT DEFAULT 0,
    expectedSavedHours INT DEFAULT 0,
    lastUsedBy JSON,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Task
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    project_id INT,
    assigned_to INT,
    status VARCHAR(30),
    priority VARCHAR(20),
    due_date DATE,
    created_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Leave
CREATE TABLE leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    start_date DATE,
    end_date DATE,
    type VARCHAR(30),
    status VARCHAR(20),
    reason TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Risk/Issue
CREATE TABLE risks_issues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    reported_by INT,
    type VARCHAR(10),
    description TEXT,
    status VARCHAR(20),
    created_at DATETIME,
    resolved_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- Audit Log
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INT,
    timestamp DATETIME,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ToDo
CREATE TABLE todos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(100),
    description TEXT,
    status VARCHAR(20),
    due_date DATE,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tool
CREATE TABLE tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    description TEXT,
    project_id INT,
    added_by INT,
    created_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (added_by) REFERENCES users(id)
);

-- File
CREATE TABLE files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT,
    uploaded_by INT,
    file_url VARCHAR(255),
    file_type VARCHAR(50),
    uploaded_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
