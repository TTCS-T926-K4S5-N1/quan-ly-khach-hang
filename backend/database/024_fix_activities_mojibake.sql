-- 024_fix_activities_mojibake.sql
-- Sửa lỗi mã hóa ký tự (double-encoded UTF-8 / mojibake) trong bảng activities
USE crm_db;
SET NAMES utf8mb4;

UPDATE activities 
SET subject = CONVERT(CAST(CONVERT(subject USING latin1) AS BINARY) USING utf8mb4),
    description = CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4)
WHERE HEX(subject) LIKE '%C386%' OR HEX(description) LIKE '%C386%';
