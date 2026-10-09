-- 018_seed_500_activities.sql
-- Tạo 500 hoạt động cho Khách hàng 12 để kiểm thử hiệu năng tải dưới 1.5 giây
USE crm_db;

DELIMITER $$
DROP PROCEDURE IF EXISTS Seed500Activities$$
CREATE PROCEDURE Seed500Activities(IN custId BIGINT)
BEGIN
    DECLARE i INT DEFAULT 5;
    WHILE i <= 500 DO
        INSERT INTO activities (customer_id, type, subject, description, status, owner_user_id, created_at)
        VALUES (
            custId,
            ELT(1 + (i % 4), 'CALL', 'EMAIL', 'MEETING', 'NOTE'),
            CONCAT('Tương tác khách hàng #', i),
            CONCAT('Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số ', i),
            'COMPLETED',
            1,
            DATE_SUB(NOW(), INTERVAL i HOUR)
        );
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL Seed500Activities(12);
DROP PROCEDURE IF EXISTS Seed500Activities;
