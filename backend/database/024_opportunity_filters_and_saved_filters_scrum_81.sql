-- ============================================================================
-- Migration: 024_opportunity_filters_and_saved_filters_scrum_81.sql
-- Mô tả: SCRUM-81: Tìm kiếm & lọc cơ hội theo nhiều điều kiện, lưu bộ lọc hay dùng
-- ============================================================================

-- 1. Đảm bảo bảng saved_filters đã tồn tại
CREATE TABLE IF NOT EXISTS saved_filters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    module VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    name VARCHAR(255) NOT NULL,
    filter_criteria JSON NOT NULL,
    is_preset TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_filters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_saved_filters_user_mod (user_id, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Đảm bảo bảng opportunity_items tồn tại để hỗ trợ lọc theo sản phẩm
CREATE TABLE IF NOT EXISTS opportunity_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    list_price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    product_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    billing_cycle VARCHAR(50) NULL,
    term_count INT NOT NULL DEFAULT 1,
    annual_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_items_opp_id (opportunity_id),
    INDEX idx_opp_items_prod_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tạo index hỗ trợ tìm kiếm và lọc cơ hội nhanh chóng
SET @exist_idx_opp_close_date = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'opportunities' AND index_name = 'idx_opp_close_date');
SET @exist_idx_opp_amount = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'opportunities' AND index_name = 'idx_opp_amount');

-- 4. Khởi tạo một số bộ lọc hay dùng mặc định (Presets) cho cơ hội bán hàng (OPPORTUNITY)
INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', 'Cơ hội chốt trong tuần này', '{"quickDate":"THIS_WEEK"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = 'Cơ hội chốt trong tuần này'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', 'Thương vụ lớn (> 100tr)', '{"minAmount":100000000}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = 'Thương vụ lớn (> 100tr)'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', 'Cơ hội do tôi phụ trách', '{"ownerFilter":"MINE"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = 'Cơ hội do tôi phụ trách'
  );

INSERT INTO saved_filters (user_id, module, name, filter_criteria, is_preset)
SELECT id, 'OPPORTUNITY', 'Cơ hội chốt trong tháng này', '{"quickDate":"THIS_MONTH"}', 1
FROM users
WHERE status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1 FROM saved_filters sf WHERE sf.user_id = users.id AND sf.module = 'OPPORTUNITY' AND sf.name = 'Cơ hội chốt trong tháng này'
  );
