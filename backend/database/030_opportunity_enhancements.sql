-- Migration 030: Cơ hội bán hàng - Liên hệ chính, Nguồn, Ghi chú xác suất, Thời gian giai đoạn
USE crm_db;

SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'opportunities'
      AND COLUMN_NAME = 'contact_id'
  ) > 0,
  "SELECT 1",
  "ALTER TABLE opportunities ADD COLUMN contact_id BIGINT NULL AFTER customer_id, ADD CONSTRAINT fk_opportunities_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'opportunities'
      AND COLUMN_NAME = 'lead_source'
  ) > 0,
  "SELECT 1",
  "ALTER TABLE opportunities ADD COLUMN lead_source VARCHAR(100) NULL AFTER expected_close_date"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'opportunities'
      AND COLUMN_NAME = 'probability_note'
  ) > 0,
  "SELECT 1",
  "ALTER TABLE opportunities ADD COLUMN probability_note VARCHAR(500) NULL AFTER probability"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = 'opportunities'
      AND COLUMN_NAME = 'stage_updated_at'
  ) > 0,
  "SELECT 1",
  "ALTER TABLE opportunities ADD COLUMN stage_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER stage_id"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Khởi tạo stage_updated_at từ created_at cho các cơ hội hiện có
UPDATE opportunities SET stage_updated_at = created_at WHERE stage_updated_at IS NULL;
