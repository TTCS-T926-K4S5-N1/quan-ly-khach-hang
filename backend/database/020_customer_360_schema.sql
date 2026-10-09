-- Repair missing core CRM tables for existing crm_db.
-- Safe for repeated execution: creates missing tables and adds missing compatibility columns.
-- Does not DROP any existing table or erase existing data.
-- Select the target database explicitly; no business data is inserted or updated.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 name VARCHAR(255) NOT NULL,
 tax_code VARCHAR(50) NULL,
 status VARCHAR(50) NOT NULL DEFAULT 'TIEM_NANG',
 email VARCHAR(255) NULL, phone VARCHAR(50) NULL, website VARCHAR(255) NULL,
 address VARCHAR(500) NULL,
 industry_id BIGINT NULL, company_size_id BIGINT NULL,
 owner_user_id BIGINT NOT NULL,
 is_deleted TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_customers_owner_deleted(owner_user_id, is_deleted),
 KEY idx_customers_tax_code(tax_code),
 CONSTRAINT fk_customers_owner FOREIGN KEY(owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS opportunities (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 name VARCHAR(255) NOT NULL,
 customer_id BIGINT NULL,
 contact_name VARCHAR(255) NULL,
 amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 stage_id BIGINT NULL,
 probability INT NOT NULL DEFAULT 0,
 expected_close_date DATE NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
 win_reason_id BIGINT NULL, loss_reason_id BIGINT NULL,
 competitor_id BIGINT NULL, lost_reason TEXT NULL,
 owner_user_id BIGINT NOT NULL,
 is_deleted TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_opportunities_customer_status(customer_id,status,is_deleted),
 KEY idx_opportunities_owner(owner_user_id,is_deleted),
 CONSTRAINT fk_opportunities_customer FOREIGN KEY(customer_id) REFERENCES customers(id),
 CONSTRAINT fk_opportunities_owner FOREIGN KEY(owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 subject VARCHAR(255) NOT NULL,
 type VARCHAR(50) NOT NULL DEFAULT 'CALL',
 description TEXT NULL,
 status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
 due_date DATETIME NULL,
 customer_id BIGINT NULL,
 opportunity_id BIGINT NULL,
 owner_user_id BIGINT NOT NULL,
 is_deleted TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_activities_customer_timeline(customer_id,is_deleted,created_at,id),
 KEY idx_activities_owner(owner_user_id,is_deleted),
 CONSTRAINT fk_activities_customer FOREIGN KEY(customer_id) REFERENCES customers(id),
 CONSTRAINT fk_activities_opportunity FOREIGN KEY(opportunity_id) REFERENCES opportunities(id),
 CONSTRAINT fk_activities_owner FOREIGN KEY(owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quotes (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 quote_number VARCHAR(100) NOT NULL,
 title VARCHAR(255) NULL,
 customer_id BIGINT NULL,
 opportunity_id BIGINT NULL,
 discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
 subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
 total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
 requires_approval TINYINT(1) NOT NULL DEFAULT 0,
 owner_user_id BIGINT NOT NULL,
 is_deleted TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_quotes_customer(customer_id,is_deleted),
 CONSTRAINT fk_quotes_customer FOREIGN KEY(customer_id) REFERENCES customers(id),
 CONSTRAINT fk_quotes_opportunity FOREIGN KEY(opportunity_id) REFERENCES opportunities(id),
 CONSTRAINT fk_quotes_owner FOREIGN KEY(owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quote_items (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 quote_id BIGINT NOT NULL,
 product_id BIGINT NOT NULL,
 quantity INT NOT NULL DEFAULT 1,
 unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,
 discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
 amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 KEY idx_quote_items_quote(quote_id),
 CONSTRAINT fk_quote_items_quote FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
 CONSTRAINT fk_quote_items_product FOREIGN KEY(product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 016_seed_contacts_and_roles.sql
-- Quản lý người liên hệ, vai trò quyết định mua (Buying Role) và lịch sử chuyển công ty


SET NAMES utf8mb4;

-- 1. Bảng contacts (Người liên hệ)
CREATE TABLE IF NOT EXISTS contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    title VARCHAR(100) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    buying_role VARCHAR(50) NOT NULL DEFAULT 'INFLUENCER',
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    owner_user_id BIGINT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_contacts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_contacts_buying_role
        CHECK (buying_role IN ('DECISION_MAKER', 'INFLUENCER', 'END_USER', 'BLOCKER'))
);

-- 2. Bảng contact_company_history (Lịch sử công ty khi chuyển việc)
CREATE TABLE IF NOT EXISTS contact_company_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contact_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    job_title VARCHAR(100) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cch_contact
        FOREIGN KEY (contact_id)
        REFERENCES contacts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cch_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

-- 017_customer_360_complete.sql
-- Hoàn thiện dữ liệu và cấu trúc cho trang Khách hàng 360


SET NAMES utf8mb4;

-- 1. Bảng attachments (Tệp đính kèm của khách hàng)
CREATE TABLE IF NOT EXISTS attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'PDF',
    file_size BIGINT NOT NULL DEFAULT 0,
    file_url VARCHAR(500) NULL,
    uploaded_by_user_id BIGINT NULL DEFAULT 1,
    notes VARCHAR(255) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachments_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS custom_field_values (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 custom_field_id BIGINT NOT NULL,
 record_id BIGINT NOT NULL,
 field_value TEXT NULL,
 UNIQUE KEY uq_custom_field_record(custom_field_id, record_id),
 FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id)
);
CREATE TABLE IF NOT EXISTS customer_360_contracts (
 id BIGINT PRIMARY KEY AUTO_INCREMENT,
 customer_id BIGINT NOT NULL,
 contract_number VARCHAR(100) NULL,
 amount DECIMAL(18,2) NOT NULL DEFAULT 0,
 status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
 signed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_360_contracts_sum(customer_id,status),
 CONSTRAINT fk_360_contracts_customer FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Add only absent columns. Existing data and types remain unchanged.
DELIMITER $$
DROP PROCEDURE IF EXISTS S554AddColumn$$
CREATE PROCEDURE S554AddColumn(IN tbl VARCHAR(64), IN col VARCHAR(64), IN defn VARCHAR(255))
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=tbl AND COLUMN_NAME=col) THEN
  SET @s554_sql=CONCAT('ALTER TABLE `',tbl,'` ADD COLUMN `',col,'` ',defn);
  PREPARE s554_stmt FROM @s554_sql; EXECUTE s554_stmt; DEALLOCATE PREPARE s554_stmt;
 END IF;
END$$
DELIMITER ;
CALL S554AddColumn('pipeline_stages','exit_condition','VARCHAR(255) NULL');
CALL S554AddColumn('pipeline_stages','condition_required','TINYINT(1) NOT NULL DEFAULT 0');
CALL S554AddColumn('pipeline_stages','is_won','TINYINT(1) NOT NULL DEFAULT 0');
CALL S554AddColumn('pipeline_stages','is_lost','TINYINT(1) NOT NULL DEFAULT 0');
CALL S554AddColumn('pipeline_stages','code','VARCHAR(50) NULL');
CALL S554AddColumn('products','type','VARCHAR(50) NOT NULL DEFAULT ''ONE_TIME''');
CALL S554AddColumn('products','list_price','DECIMAL(18,2) NULL');
CALL S554AddColumn('products','floor_price','DECIMAL(18,2) NULL');
CALL S554AddColumn('products','cost_price','DECIMAL(18,2) NULL');
CALL S554AddColumn('audit_logs','before_value','LONGTEXT NULL');
CALL S554AddColumn('audit_logs','after_value','LONGTEXT NULL');
CALL S554AddColumn('activities','type','VARCHAR(50) NOT NULL DEFAULT ''CALL''');
CALL S554AddColumn('custom_fields','options_json','TEXT NULL');
CALL S554AddColumn('users','display_name','VARCHAR(150) NULL');
CALL S554AddColumn('users','email_signature','TEXT NULL');
CALL S554AddColumn('master_data','display_order','INT NOT NULL DEFAULT 1');
DROP PROCEDURE S554AddColumn;
SET @s554_sql = IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='activities' AND INDEX_NAME='idx_activities_customer_timeline'),
 'SELECT 1', 'CREATE INDEX idx_activities_customer_timeline ON activities(customer_id,is_deleted,created_at,id)');
PREPARE s554_stmt FROM @s554_sql; EXECUTE s554_stmt; DEALLOCATE PREPARE s554_stmt;
