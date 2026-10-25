CREATE DATABASE IF NOT EXISTS \crm_db\ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE \crm_db\;\n
-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: crm_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_lock_logs`
--

DROP TABLE IF EXISTS `account_lock_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_lock_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `action_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `performed_by` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `account_lock_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `account_lock_logs_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_lock_logs`
--

LOCK TABLES `account_lock_logs` WRITE;
/*!40000 ALTER TABLE `account_lock_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_lock_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activities`
--

DROP TABLE IF EXISTS `activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CALL',
  `description` text COLLATE utf8mb4_unicode_ci,
  `outcome` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postpone_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `due_date` datetime DEFAULT NULL,
  `duration_minutes` int DEFAULT '0',
  `customer_id` bigint DEFAULT NULL,
  `contact_id` bigint DEFAULT NULL,
  `opportunity_id` bigint DEFAULT NULL,
  `owner_user_id` bigint DEFAULT NULL,
  `assigned_by_user_id` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_act_opp` (`opportunity_id`),
  KEY `fk_act_owner` (`owner_user_id`),
  KEY `idx_activities_customer_date` (`customer_id`,`created_at` DESC),
  KEY `idx_act_contact` (`contact_id`),
  KEY `idx_act_priority` (`priority`),
  KEY `idx_act_due` (`due_date`),
  CONSTRAINT `fk_act_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_act_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_act_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=655 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activities`
--

LOCK TABLES `activities` WRITE;
/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
INSERT INTO `activities` VALUES (1,'Họp demo tính năng CRM Phân quyền và Bảo mật','MEETING','Trình bày giải pháp phân quyền dữ liệu cho ban dự án VPBank',NULL,NULL,'COMPLETED','MEDIUM','2026-10-06 02:24:36',0,4,NULL,1,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(2,'Cuộc gọi xác nhận yêu cầu tích hợp Zalo OA','CALL','Xác nhận số điện thoại hotline và kịch bản gửi tin tự động cho NEM Fashion',NULL,NULL,'COMPLETED','MEDIUM','2026-10-07 02:24:36',0,5,NULL,2,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(3,'Gửi dự thảo Hợp đồng và Báo giá chính thức','EMAIL','Đã gửi file PDF báo giá có chữ ký duyệt cho đại diện LogiTech',NULL,NULL,'COMPLETED','MEDIUM','2026-10-08 02:24:36',0,9,NULL,4,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(4,'Khảo sát hạ tầng tổng đài điện thoại Viettravel','TASK','Thu thập thông tin nhà mạng và cấu hình IP tổng đài VoIP','Đã hoàn thành trong kỳ khảo sát',NULL,'COMPLETED','MEDIUM','2026-10-10 02:24:36',0,3,NULL,3,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(5,'Họp đàm phán hợp đồng & tiến độ triển khai An Sinh','MEETING','Thương thảo điều khoản thanh toán 3 đợt và thời gian golive','Đã hoàn thành trong kỳ khảo sát',NULL,'COMPLETED','MEDIUM','2026-10-11 02:24:36',0,6,NULL,5,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(6,'Gọi điện chăm sóc định kỳ khách hàng VIP GreenTech','CALL','Kiểm tra độ hài lòng sau 1 tháng vận hành tính năng BI','Đã hoàn thành trong kỳ khảo sát',NULL,'COMPLETED','MEDIUM','2026-10-13 02:24:36',0,11,NULL,7,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(7,'Tư vấn giải pháp quản lý chuỗi đại lý TocoToco','MEETING','Họp online qua Google Meet cùng giám đốc vận hành TocoToco',NULL,NULL,'COMPLETED','MEDIUM','2026-10-05 02:24:36',0,10,NULL,6,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(8,'Gửi email tài liệu kỹ thuật & API tổng đài Nam Á','EMAIL','Gửi tài liệu API Swagger và sơ đồ kết nối hệ thống','Đã hoàn thành trong kỳ khảo sát',NULL,'COMPLETED','MEDIUM','2026-10-12 02:24:36',0,7,NULL,8,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(9,'Trao đổi với Tổng Giám Đốc Nguyễn Văn Phát','CALL','Thảo luận về tiến độ triển khai chính thức gói Enterprise và chính sách bảo hành 24/7.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(10,'Họp demo trực tiếp tính năng quản lý đơn hàng B2B','MEETING','Demo thực tế tính năng chiết khấu nhiều cấp độ với Trưởng phòng Kinh doanh Lê Hoàng Long và đội ngũ sales.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(11,'Gửi tài liệu kiến trúc API & bảo mật','EMAIL','Gửi tài liệu mã hóa dữ liệu khách hàng và tài liệu kết nối API tổng đài cho Giám đốc CNTT Trần Thị Thu Hương.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(12,'Ghi chú tài chính từ Kế toán trưởng','NOTE','Kế toán trưởng Phạm Quốc Cường đề xuất chia thanh toán làm 3 đợt (40% - 40% - 20%). Đã chuyển thông tin cho ban giám đốc duyệt.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(13,'Tương tác khách hàng #5','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 5',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(14,'Tương tác khách hàng #6','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 6',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(15,'Tương tác khách hàng #7','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 7',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(16,'Tương tác khách hàng #8','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 8',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(17,'Tương tác khách hàng #9','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 9',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(18,'Tương tác khách hàng #10','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 10',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(19,'Tương tác khách hàng #11','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 11',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(20,'Tương tác khách hàng #12','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 12',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-03 09:30:00','2026-10-19 07:50:14'),(21,'Tương tác khách hàng #13','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 13',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(22,'Tương tác khách hàng #14','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 14',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(23,'Tương tác khách hàng #15','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 15',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(24,'Tương tác khách hàng #16','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 16',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(25,'Tương tác khách hàng #17','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 17',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(26,'Tương tác khách hàng #18','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 18',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(27,'Tương tác khách hàng #19','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 19',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(28,'Tương tác khách hàng #20','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 20',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(29,'Tương tác khách hàng #21','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 21',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(30,'Tương tác khách hàng #22','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 22',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(31,'Tương tác khách hàng #23','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 23',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(32,'Tương tác khách hàng #24','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 24',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(33,'Tương tác khách hàng #25','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 25',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(34,'Tương tác khách hàng #26','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 26',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(35,'Tương tác khách hàng #27','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 27',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(36,'Tương tác khách hàng #28','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 28',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(37,'Tương tác khách hàng #29','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 29',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(38,'Tương tác khách hàng #30','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 30',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(39,'Tương tác khách hàng #31','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 31',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(40,'Tương tác khách hàng #32','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 32',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(41,'Tương tác khách hàng #33','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 33',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(42,'Tương tác khách hàng #34','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 34',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(43,'Tương tác khách hàng #35','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 35',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(44,'Tương tác khách hàng #36','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 36',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(45,'Tương tác khách hàng #37','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 37',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-10 14:15:00','2026-10-19 07:50:14'),(46,'Tương tác khách hàng #38','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 38',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(47,'Tương tác khách hàng #39','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 39',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(48,'Tương tác khách hàng #40','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 40',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(49,'Tương tác khách hàng #41','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 41',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(50,'Tương tác khách hàng #42','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 42',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(51,'Tương tác khách hàng #43','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 43',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(52,'Tương tác khách hàng #44','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 44',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(53,'Tương tác khách hàng #45','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 45',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(54,'Tương tác khách hàng #46','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 46',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(55,'Tương tác khách hàng #47','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 47',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(56,'Tương tác khách hàng #48','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 48',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(57,'Tương tác khách hàng #49','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 49',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(58,'Tương tác khách hàng #50','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 50',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(59,'Tương tác khách hàng #51','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 51',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(60,'Tương tác khách hàng #52','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 52',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(61,'Tương tác khách hàng #53','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 53',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(62,'Tương tác khách hàng #54','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 54',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(63,'Tương tác khách hàng #55','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 55',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(64,'Tương tác khách hàng #56','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 56',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(65,'Tương tác khách hàng #57','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 57',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-16 11:00:00','2026-10-19 07:50:14'),(66,'Tương tác khách hàng #58','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 58',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(67,'Tương tác khách hàng #59','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 59',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(68,'Tương tác khách hàng #60','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 60',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(69,'Tương tác khách hàng #61','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 61',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(70,'Tương tác khách hàng #62','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 62',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(71,'Tương tác khách hàng #63','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 63',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(72,'Tương tác khách hàng #64','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 64',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(73,'Tương tác khách hàng #65','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 65',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(74,'Tương tác khách hàng #66','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 66',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(75,'Tương tác khách hàng #67','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 67',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(76,'Tương tác khách hàng #68','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 68',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(77,'Tương tác khách hàng #69','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 69',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(78,'Tương tác khách hàng #70','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 70',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(79,'Tương tác khách hàng #71','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 71',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(80,'Tương tác khách hàng #72','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 72',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(81,'Tương tác khách hàng #73','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 73',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(82,'Tương tác khách hàng #74','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 74',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(83,'Tương tác khách hàng #75','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 75',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(84,'Tương tác khách hàng #76','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 76',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(85,'Tương tác khách hàng #77','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 77',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-04 10:00:00','2026-10-19 07:50:14'),(86,'Tương tác khách hàng #78','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 78',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(87,'Tương tác khách hàng #79','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 79',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(88,'Tương tác khách hàng #80','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 80',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(89,'Tương tác khách hàng #81','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 81',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(90,'Tương tác khách hàng #82','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 82',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(91,'Tương tác khách hàng #83','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 83',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(92,'Tương tác khách hàng #84','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 84',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(93,'Tương tác khách hàng #85','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 85',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(94,'Tương tác khách hàng #86','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 86',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(95,'Tương tác khách hàng #87','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 87',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(96,'Tương tác khách hàng #88','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 88',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(97,'Tương tác khách hàng #89','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 89',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(98,'Tương tác khách hàng #90','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 90',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(99,'Tương tác khách hàng #91','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 91',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(100,'Tương tác khách hàng #92','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 92',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(101,'Tương tác khách hàng #93','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 93',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(102,'Tương tác khách hàng #94','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 94',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(103,'Tương tác khách hàng #95','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 95',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(104,'Tương tác khách hàng #96','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 96',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(105,'Tương tác khách hàng #97','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 97',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-11 15:30:00','2026-10-19 07:50:14'),(106,'Tương tác khách hàng #98','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 98',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(107,'Tương tác khách hàng #99','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 99',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(108,'Tương tác khách hàng #100','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 100',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(109,'Tương tác khách hàng #101','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 101',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(110,'Tương tác khách hàng #102','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 102',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(111,'Tương tác khách hàng #103','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 103',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(112,'Tương tác khách hàng #104','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 104',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(113,'Tương tác khách hàng #105','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 105',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(114,'Tương tác khách hàng #106','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 106',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(115,'Tương tác khách hàng #107','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 107',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(116,'Tương tác khách hàng #108','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 108',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(117,'Tương tác khách hàng #109','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 109',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(118,'Tương tác khách hàng #110','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 110',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(119,'Tương tác khách hàng #111','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 111',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(120,'Tương tác khách hàng #112','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 112',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(121,'Tương tác khách hàng #113','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 113',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(122,'Tương tác khách hàng #114','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 114',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(123,'Tương tác khách hàng #115','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 115',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(124,'Tương tác khách hàng #116','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 116',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(125,'Tương tác khách hàng #117','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 117',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,5,NULL,0,'2026-10-17 16:00:00','2026-10-19 07:50:14'),(126,'Tương tác khách hàng #118','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 118',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(127,'Tương tác khách hàng #119','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 119',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(128,'Tương tác khách hàng #120','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 120',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(129,'Tương tác khách hàng #121','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 121',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(130,'Tương tác khách hàng #122','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 122',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(131,'Tương tác khách hàng #123','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 123',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(132,'Tương tác khách hàng #124','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 124',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(133,'Tương tác khách hàng #125','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 125',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(134,'Tương tác khách hàng #126','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 126',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(135,'Tương tác khách hàng #127','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 127',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(136,'Tương tác khách hàng #128','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 128',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(137,'Tương tác khách hàng #129','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 129',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(138,'Tương tác khách hàng #130','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 130',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(139,'Tương tác khách hàng #131','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 131',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(140,'Tương tác khách hàng #132','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 132',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(141,'Tương tác khách hàng #133','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 133',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(142,'Tương tác khách hàng #134','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 134',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(143,'Tương tác khách hàng #135','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 135',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(144,'Tương tác khách hàng #136','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 136',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(145,'Tương tác khách hàng #137','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 137',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-05 08:45:00','2026-10-19 07:50:14'),(146,'Tương tác khách hàng #138','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 138',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(147,'Tương tác khách hàng #139','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 139',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(148,'Tương tác khách hàng #140','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 140',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(149,'Tương tác khách hàng #141','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 141',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(150,'Tương tác khách hàng #142','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 142',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(151,'Tương tác khách hàng #143','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 143',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(152,'Tương tác khách hàng #144','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 144',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(153,'Tương tác khách hàng #145','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 145',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(154,'Tương tác khách hàng #146','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 146',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(155,'Tương tác khách hàng #147','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 147',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(156,'Tương tác khách hàng #148','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 148',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(157,'Tương tác khách hàng #149','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 149',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(158,'Tương tác khách hàng #150','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 150',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(159,'Tương tác khách hàng #151','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 151',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(160,'Tương tác khách hàng #152','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 152',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(161,'Tương tác khách hàng #153','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 153',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(162,'Tương tác khách hàng #154','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 154',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(163,'Tương tác khách hàng #155','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 155',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(164,'Tương tác khách hàng #156','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 156',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(165,'Tương tác khách hàng #157','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 157',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-12 13:20:00','2026-10-19 07:50:14'),(166,'Tương tác khách hàng #158','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 158',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(167,'Tương tác khách hàng #159','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 159',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(168,'Tương tác khách hàng #160','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 160',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(169,'Tương tác khách hàng #161','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 161',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(170,'Tương tác khách hàng #162','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 162',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(171,'Tương tác khách hàng #163','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 163',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(172,'Tương tác khách hàng #164','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 164',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(173,'Tương tác khách hàng #165','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 165',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(174,'Tương tác khách hàng #166','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 166',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(175,'Tương tác khách hàng #167','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 167',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(176,'Tương tác khách hàng #168','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 168',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(177,'Tương tác khách hàng #169','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 169',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(178,'Tương tác khách hàng #170','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 170',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(179,'Tương tác khách hàng #171','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 171',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(180,'Tương tác khách hàng #172','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 172',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,7,NULL,0,'2026-10-18 10:30:00','2026-10-19 07:50:14'),(181,'Tương tác khách hàng #173','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 173',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(182,'Tương tác khách hàng #174','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 174',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(183,'Tương tác khách hàng #175','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 175',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(184,'Tương tác khách hàng #176','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 176',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(185,'Tương tác khách hàng #177','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 177',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(186,'Tương tác khách hàng #178','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 178',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(187,'Tương tác khách hàng #179','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 179',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(188,'Tương tác khách hàng #180','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 180',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(189,'Tương tác khách hàng #181','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 181',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(190,'Tương tác khách hàng #182','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 182',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(191,'Tương tác khách hàng #183','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 183',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(192,'Tương tác khách hàng #184','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 184',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(193,'Tương tác khách hàng #185','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 185',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(194,'Tương tác khách hàng #186','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 186',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(195,'Tương tác khách hàng #187','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 187',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(196,'Tương tác khách hàng #188','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 188',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(197,'Tương tác khách hàng #189','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 189',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(198,'Tương tác khách hàng #190','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 190',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(199,'Tương tác khách hàng #191','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 191',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(200,'Tương tác khách hàng #192','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 192',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-06 11:15:00','2026-10-19 07:50:14'),(201,'Tương tác khách hàng #193','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 193',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(202,'Tương tác khách hàng #194','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 194',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(203,'Tương tác khách hàng #195','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 195',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(204,'Tương tác khách hàng #196','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 196',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(205,'Tương tác khách hàng #197','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 197',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(206,'Tương tác khách hàng #198','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 198',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(207,'Tương tác khách hàng #199','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 199',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(208,'Tương tác khách hàng #200','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 200',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(209,'Tương tác khách hàng #201','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 201',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(210,'Tương tác khách hàng #202','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 202',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(211,'Tương tác khách hàng #203','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 203',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(212,'Tương tác khách hàng #204','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 204',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(213,'Tương tác khách hàng #205','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 205',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(214,'Tương tác khách hàng #206','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 206',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(215,'Tương tác khách hàng #207','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 207',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(216,'Tương tác khách hàng #208','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 208',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(217,'Tương tác khách hàng #209','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 209',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(218,'Tương tác khách hàng #210','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 210',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(219,'Tương tác khách hàng #211','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 211',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(220,'Tương tác khách hàng #212','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 212',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-13 14:00:00','2026-10-19 07:50:14'),(221,'Tương tác khách hàng #213','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 213',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(222,'Tương tác khách hàng #214','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 214',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(223,'Tương tác khách hàng #215','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 215',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(224,'Tương tác khách hàng #216','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 216',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(225,'Tương tác khách hàng #217','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 217',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(226,'Tương tác khách hàng #218','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 218',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(227,'Tương tác khách hàng #219','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 219',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(228,'Tương tác khách hàng #220','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 220',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(229,'Tương tác khách hàng #221','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 221',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(230,'Tương tác khách hàng #222','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 222',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(231,'Tương tác khách hàng #223','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 223',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(232,'Tương tác khách hàng #224','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 224',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(233,'Tương tác khách hàng #225','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 225',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(234,'Tương tác khách hàng #226','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 226',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(235,'Tương tác khách hàng #227','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 227',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(236,'Tương tác khách hàng #228','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 228',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(237,'Tương tác khách hàng #229','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 229',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(238,'Tương tác khách hàng #230','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 230',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(239,'Tương tác khách hàng #231','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 231',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(240,'Tương tác khách hàng #232','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 232',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,9,NULL,0,'2026-10-19 09:00:00','2026-10-19 07:50:14'),(241,'Tương tác khách hàng #233','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 233',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-07 16:00:00','2026-10-19 07:50:14'),(242,'Tương tác khách hàng #234','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 234',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-07 16:00:00','2026-10-19 07:50:14'),(243,'Tương tác khách hàng #235','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 235',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-07 16:00:00','2026-10-19 07:50:14'),(244,'Tương tác khách hàng #236','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 236',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-07 16:00:00','2026-10-19 07:50:14'),(245,'Tương tác khách hàng #237','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 237',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-07 16:00:00','2026-10-19 07:50:14'),(246,'Tương tác khách hàng #238','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 238',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-14 10:00:00','2026-10-19 07:50:14'),(247,'Tương tác khách hàng #239','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 239',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-14 10:00:00','2026-10-19 07:50:14'),(248,'Tương tác khách hàng #240','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 240',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-14 10:00:00','2026-10-19 07:50:14'),(249,'Tương tác khách hàng #241','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 241',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,10,NULL,0,'2026-10-14 10:00:00','2026-10-19 07:50:14'),(250,'Tương tác khách hàng #242','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 242',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 10:00:15','2026-10-12 08:15:18'),(251,'Tương tác khách hàng #243','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 243',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 09:00:15','2026-10-12 08:15:18'),(252,'Tương tác khách hàng #244','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 244',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 08:00:15','2026-10-12 08:15:18'),(253,'Tương tác khách hàng #245','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 245',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 07:00:15','2026-10-12 08:15:18'),(254,'Tương tác khách hàng #246','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 246',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 06:00:15','2026-10-12 08:15:18'),(255,'Tương tác khách hàng #247','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 247',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 05:00:15','2026-10-12 08:15:18'),(256,'Tương tác khách hàng #248','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 248',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 04:00:15','2026-10-12 08:15:18'),(257,'Tương tác khách hàng #249','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 249',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 03:00:15','2026-10-12 08:15:18'),(258,'Tương tác khách hàng #250','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 250',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 02:00:15','2026-10-12 08:15:18'),(259,'Tương tác khách hàng #251','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 251',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 01:00:15','2026-10-12 08:15:18'),(260,'Tương tác khách hàng #252','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 252',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-29 00:00:15','2026-10-12 08:15:18'),(261,'Tương tác khách hàng #253','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 253',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 23:00:15','2026-10-12 08:15:18'),(262,'Tương tác khách hàng #254','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 254',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 22:00:15','2026-10-12 08:15:18'),(263,'Tương tác khách hàng #255','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 255',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 21:00:15','2026-10-12 08:15:18'),(264,'Tương tác khách hàng #256','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 256',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 20:00:15','2026-10-12 08:15:18'),(265,'Tương tác khách hàng #257','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 257',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 19:00:15','2026-10-12 08:15:18'),(266,'Tương tác khách hàng #258','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 258',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 18:00:15','2026-10-12 08:15:18'),(267,'Tương tác khách hàng #259','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 259',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 17:00:15','2026-10-12 08:15:18'),(268,'Tương tác khách hàng #260','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 260',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 16:00:15','2026-10-12 08:15:18'),(269,'Tương tác khách hàng #261','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 261',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 15:00:15','2026-10-12 08:15:18'),(270,'Tương tác khách hàng #262','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 262',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 14:00:15','2026-10-12 08:15:18'),(271,'Tương tác khách hàng #263','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 263',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 13:00:15','2026-10-12 08:15:18'),(272,'Tương tác khách hàng #264','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 264',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 12:00:15','2026-10-12 08:15:18'),(273,'Tương tác khách hàng #265','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 265',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 11:00:15','2026-10-12 08:15:18'),(274,'Tương tác khách hàng #266','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 266',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 10:00:15','2026-10-12 08:15:18'),(275,'Tương tác khách hàng #267','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 267',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 09:00:15','2026-10-12 08:15:18'),(276,'Tương tác khách hàng #268','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 268',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 08:00:15','2026-10-12 08:15:18'),(277,'Tương tác khách hàng #269','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 269',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 07:00:15','2026-10-12 08:15:18'),(278,'Tương tác khách hàng #270','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 270',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 06:00:15','2026-10-12 08:15:18'),(279,'Tương tác khách hàng #271','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 271',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 05:00:15','2026-10-12 08:15:18'),(280,'Tương tác khách hàng #272','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 272',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 04:00:15','2026-10-12 08:15:18'),(281,'Tương tác khách hàng #273','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 273',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 03:00:15','2026-10-12 08:15:18'),(282,'Tương tác khách hàng #274','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 274',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 02:00:15','2026-10-12 08:15:18'),(283,'Tương tác khách hàng #275','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 275',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 01:00:15','2026-10-12 08:15:18'),(284,'Tương tác khách hàng #276','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 276',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-28 00:00:15','2026-10-12 08:15:18'),(285,'Tương tác khách hàng #277','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 277',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 23:00:15','2026-10-12 08:15:18'),(286,'Tương tác khách hàng #278','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 278',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 22:00:15','2026-10-12 08:15:18'),(287,'Tương tác khách hàng #279','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 279',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 21:00:15','2026-10-12 08:15:18'),(288,'Tương tác khách hàng #280','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 280',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 20:00:15','2026-10-12 08:15:18'),(289,'Tương tác khách hàng #281','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 281',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 19:00:15','2026-10-12 08:15:18'),(290,'Tương tác khách hàng #282','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 282',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 18:00:15','2026-10-12 08:15:18'),(291,'Tương tác khách hàng #283','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 283',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 17:00:15','2026-10-12 08:15:18'),(292,'Tương tác khách hàng #284','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 284',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 16:00:15','2026-10-12 08:15:18'),(293,'Tương tác khách hàng #285','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 285',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 15:00:15','2026-10-12 08:15:18'),(294,'Tương tác khách hàng #286','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 286',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 14:00:15','2026-10-12 08:15:18'),(295,'Tương tác khách hàng #287','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 287',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 13:00:15','2026-10-12 08:15:18'),(296,'Tương tác khách hàng #288','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 288',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 12:00:16','2026-10-12 08:15:18'),(297,'Tương tác khách hàng #289','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 289',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 11:00:16','2026-10-12 08:15:18'),(298,'Tương tác khách hàng #290','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 290',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 10:00:16','2026-10-12 08:15:18'),(299,'Tương tác khách hàng #291','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 291',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 09:00:16','2026-10-12 08:15:18'),(300,'Tương tác khách hàng #292','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 292',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 08:00:16','2026-10-12 08:15:18'),(301,'Tương tác khách hàng #293','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 293',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 07:00:16','2026-10-12 08:15:18'),(302,'Tương tác khách hàng #294','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 294',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 06:00:16','2026-10-12 08:15:18'),(303,'Tương tác khách hàng #295','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 295',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 05:00:16','2026-10-12 08:15:18'),(304,'Tương tác khách hàng #296','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 296',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 04:00:16','2026-10-12 08:15:18'),(305,'Tương tác khách hàng #297','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 297',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 03:00:16','2026-10-12 08:15:18'),(306,'Tương tác khách hàng #298','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 298',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 02:00:16','2026-10-12 08:15:18'),(307,'Tương tác khách hàng #299','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 299',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 01:00:16','2026-10-12 08:15:18'),(308,'Tương tác khách hàng #300','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 300',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-27 00:00:16','2026-10-12 08:15:18'),(309,'Tương tác khách hàng #301','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 301',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 23:00:16','2026-10-12 08:15:18'),(310,'Tương tác khách hàng #302','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 302',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 22:00:16','2026-10-12 08:15:18'),(311,'Tương tác khách hàng #303','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 303',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 21:00:16','2026-10-12 08:15:18'),(312,'Tương tác khách hàng #304','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 304',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 20:00:16','2026-10-12 08:15:18'),(313,'Tương tác khách hàng #305','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 305',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 19:00:16','2026-10-12 08:15:18'),(314,'Tương tác khách hàng #306','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 306',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 18:00:16','2026-10-12 08:15:18'),(315,'Tương tác khách hàng #307','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 307',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 17:00:16','2026-10-12 08:15:18'),(316,'Tương tác khách hàng #308','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 308',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 16:00:16','2026-10-12 08:15:18'),(317,'Tương tác khách hàng #309','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 309',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 15:00:16','2026-10-12 08:15:18'),(318,'Tương tác khách hàng #310','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 310',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 14:00:16','2026-10-12 08:15:18'),(319,'Tương tác khách hàng #311','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 311',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 13:00:16','2026-10-12 08:15:18'),(320,'Tương tác khách hàng #312','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 312',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 12:00:16','2026-10-12 08:15:18'),(321,'Tương tác khách hàng #313','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 313',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 11:00:16','2026-10-12 08:15:18'),(322,'Tương tác khách hàng #314','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 314',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 10:00:16','2026-10-12 08:15:18'),(323,'Tương tác khách hàng #315','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 315',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 09:00:16','2026-10-12 08:15:18'),(324,'Tương tác khách hàng #316','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 316',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 08:00:16','2026-10-12 08:15:18'),(325,'Tương tác khách hàng #317','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 317',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 07:00:16','2026-10-12 08:15:18'),(326,'Tương tác khách hàng #318','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 318',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 06:00:16','2026-10-12 08:15:18'),(327,'Tương tác khách hàng #319','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 319',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 05:00:16','2026-10-12 08:15:18'),(328,'Tương tác khách hàng #320','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 320',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 04:00:16','2026-10-12 08:15:18'),(329,'Tương tác khách hàng #321','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 321',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 03:00:16','2026-10-12 08:15:18'),(330,'Tương tác khách hàng #322','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 322',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 02:00:16','2026-10-12 08:15:18'),(331,'Tương tác khách hàng #323','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 323',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 01:00:16','2026-10-12 08:15:18'),(332,'Tương tác khách hàng #324','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 324',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-26 00:00:16','2026-10-12 08:15:18'),(333,'Tương tác khách hàng #325','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 325',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 23:00:16','2026-10-12 08:15:18'),(334,'Tương tác khách hàng #326','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 326',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 22:00:16','2026-10-12 08:15:18'),(335,'Tương tác khách hàng #327','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 327',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 21:00:16','2026-10-12 08:15:18'),(336,'Tương tác khách hàng #328','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 328',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 20:00:16','2026-10-12 08:15:18'),(337,'Tương tác khách hàng #329','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 329',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 19:00:16','2026-10-12 08:15:18'),(338,'Tương tác khách hàng #330','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 330',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 18:00:16','2026-10-12 08:15:18'),(339,'Tương tác khách hàng #331','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 331',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 17:00:16','2026-10-12 08:15:18'),(340,'Tương tác khách hàng #332','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 332',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 16:00:16','2026-10-12 08:15:18'),(341,'Tương tác khách hàng #333','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 333',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 15:00:16','2026-10-12 08:15:18'),(342,'Tương tác khách hàng #334','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 334',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 14:00:16','2026-10-12 08:15:18'),(343,'Tương tác khách hàng #335','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 335',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 13:00:16','2026-10-12 08:15:18'),(344,'Tương tác khách hàng #336','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 336',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 12:00:16','2026-10-12 08:15:18'),(345,'Tương tác khách hàng #337','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 337',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 11:00:16','2026-10-12 08:15:18'),(346,'Tương tác khách hàng #338','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 338',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 10:00:16','2026-10-12 08:15:18'),(347,'Tương tác khách hàng #339','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 339',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 09:00:16','2026-10-12 08:15:18'),(348,'Tương tác khách hàng #340','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 340',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 08:00:16','2026-10-12 08:15:18'),(349,'Tương tác khách hàng #341','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 341',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 07:00:16','2026-10-12 08:15:18'),(350,'Tương tác khách hàng #342','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 342',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 06:00:16','2026-10-12 08:15:18'),(351,'Tương tác khách hàng #343','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 343',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 05:00:16','2026-10-12 08:15:18'),(352,'Tương tác khách hàng #344','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 344',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 04:00:16','2026-10-12 08:15:18'),(353,'Tương tác khách hàng #345','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 345',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 03:00:16','2026-10-12 08:15:18'),(354,'Tương tác khách hàng #346','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 346',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 02:00:16','2026-10-12 08:15:18'),(355,'Tương tác khách hàng #347','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 347',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 01:00:16','2026-10-12 08:15:18'),(356,'Tương tác khách hàng #348','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 348',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-25 00:00:16','2026-10-12 08:15:18'),(357,'Tương tác khách hàng #349','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 349',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 23:00:16','2026-10-12 08:15:18'),(358,'Tương tác khách hàng #350','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 350',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 22:00:16','2026-10-12 08:15:18'),(359,'Tương tác khách hàng #351','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 351',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 21:00:16','2026-10-12 08:15:18'),(360,'Tương tác khách hàng #352','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 352',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 20:00:16','2026-10-12 08:15:18'),(361,'Tương tác khách hàng #353','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 353',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 19:00:16','2026-10-12 08:15:18'),(362,'Tương tác khách hàng #354','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 354',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 18:00:16','2026-10-12 08:15:18'),(363,'Tương tác khách hàng #355','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 355',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 17:00:16','2026-10-12 08:15:18'),(364,'Tương tác khách hàng #356','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 356',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 16:00:16','2026-10-12 08:15:18'),(365,'Tương tác khách hàng #357','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 357',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 15:00:16','2026-10-12 08:15:18'),(366,'Tương tác khách hàng #358','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 358',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 14:00:16','2026-10-12 08:15:18'),(367,'Tương tác khách hàng #359','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 359',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 13:00:16','2026-10-12 08:15:18'),(368,'Tương tác khách hàng #360','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 360',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 12:00:16','2026-10-12 08:15:18'),(369,'Tương tác khách hàng #361','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 361',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 11:00:16','2026-10-12 08:15:18'),(370,'Tương tác khách hàng #362','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 362',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 10:00:16','2026-10-12 08:15:18'),(371,'Tương tác khách hàng #363','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 363',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 09:00:16','2026-10-12 08:15:18'),(372,'Tương tác khách hàng #364','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 364',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 08:00:16','2026-10-12 08:15:18'),(373,'Tương tác khách hàng #365','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 365',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 07:00:16','2026-10-12 08:15:18'),(374,'Tương tác khách hàng #366','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 366',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 06:00:16','2026-10-12 08:15:18'),(375,'Tương tác khách hàng #367','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 367',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 05:00:16','2026-10-12 08:15:18'),(376,'Tương tác khách hàng #368','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 368',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 04:00:16','2026-10-12 08:15:18'),(377,'Tương tác khách hàng #369','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 369',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 03:00:16','2026-10-12 08:15:18'),(378,'Tương tác khách hàng #370','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 370',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 02:00:16','2026-10-12 08:15:18'),(379,'Tương tác khách hàng #371','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 371',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 01:00:16','2026-10-12 08:15:18'),(380,'Tương tác khách hàng #372','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 372',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-24 00:00:16','2026-10-12 08:15:18'),(381,'Tương tác khách hàng #373','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 373',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 23:00:16','2026-10-12 08:15:18'),(382,'Tương tác khách hàng #374','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 374',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 22:00:16','2026-10-12 08:15:18'),(383,'Tương tác khách hàng #375','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 375',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 21:00:16','2026-10-12 08:15:18'),(384,'Tương tác khách hàng #376','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 376',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 20:00:16','2026-10-12 08:15:18'),(385,'Tương tác khách hàng #377','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 377',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 19:00:16','2026-10-12 08:15:18'),(386,'Tương tác khách hàng #378','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 378',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 18:00:16','2026-10-12 08:15:18'),(387,'Tương tác khách hàng #379','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 379',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 17:00:16','2026-10-12 08:15:18'),(388,'Tương tác khách hàng #380','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 380',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 16:00:16','2026-10-12 08:15:18'),(389,'Tương tác khách hàng #381','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 381',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 15:00:16','2026-10-12 08:15:18'),(390,'Tương tác khách hàng #382','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 382',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 14:00:16','2026-10-12 08:15:18'),(391,'Tương tác khách hàng #383','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 383',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 13:00:16','2026-10-12 08:15:18'),(392,'Tương tác khách hàng #384','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 384',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 12:00:16','2026-10-12 08:15:18'),(393,'Tương tác khách hàng #385','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 385',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 11:00:16','2026-10-12 08:15:18'),(394,'Tương tác khách hàng #386','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 386',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 10:00:16','2026-10-12 08:15:18'),(395,'Tương tác khách hàng #387','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 387',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 09:00:16','2026-10-12 08:15:18'),(396,'Tương tác khách hàng #388','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 388',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 08:00:17','2026-10-12 08:15:18'),(397,'Tương tác khách hàng #389','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 389',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 07:00:17','2026-10-12 08:15:18'),(398,'Tương tác khách hàng #390','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 390',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 06:00:17','2026-10-12 08:15:18'),(399,'Tương tác khách hàng #391','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 391',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 05:00:17','2026-10-12 08:15:18'),(400,'Tương tác khách hàng #392','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 392',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 04:00:17','2026-10-12 08:15:18'),(401,'Tương tác khách hàng #393','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 393',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 03:00:17','2026-10-12 08:15:18'),(402,'Tương tác khách hàng #394','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 394',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 02:00:17','2026-10-12 08:15:18'),(403,'Tương tác khách hàng #395','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 395',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 01:00:17','2026-10-12 08:15:18'),(404,'Tương tác khách hàng #396','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 396',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-23 00:00:17','2026-10-12 08:15:18'),(405,'Tương tác khách hàng #397','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 397',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 23:00:17','2026-10-12 08:15:18'),(406,'Tương tác khách hàng #398','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 398',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 22:00:17','2026-10-12 08:15:18'),(407,'Tương tác khách hàng #399','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 399',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 21:00:17','2026-10-12 08:15:18'),(408,'Tương tác khách hàng #400','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 400',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 20:00:17','2026-10-12 08:15:18'),(409,'Tương tác khách hàng #401','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 401',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 19:00:17','2026-10-12 08:15:18'),(410,'Tương tác khách hàng #402','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 402',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 18:00:17','2026-10-12 08:15:18'),(411,'Tương tác khách hàng #403','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 403',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 17:00:17','2026-10-12 08:15:18'),(412,'Tương tác khách hàng #404','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 404',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 16:00:17','2026-10-12 08:15:18'),(413,'Tương tác khách hàng #405','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 405',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 15:00:17','2026-10-12 08:15:18'),(414,'Tương tác khách hàng #406','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 406',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 14:00:17','2026-10-12 08:15:18'),(415,'Tương tác khách hàng #407','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 407',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 13:00:17','2026-10-12 08:15:18'),(416,'Tương tác khách hàng #408','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 408',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 12:00:17','2026-10-12 08:15:18'),(417,'Tương tác khách hàng #409','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 409',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 11:00:17','2026-10-12 08:15:18'),(418,'Tương tác khách hàng #410','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 410',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 10:00:17','2026-10-12 08:15:18'),(419,'Tương tác khách hàng #411','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 411',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 09:00:17','2026-10-12 08:15:18'),(420,'Tương tác khách hàng #412','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 412',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 08:00:17','2026-10-12 08:15:18'),(421,'Tương tác khách hàng #413','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 413',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 07:00:17','2026-10-12 08:15:18'),(422,'Tương tác khách hàng #414','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 414',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 06:00:17','2026-10-12 08:15:18'),(423,'Tương tác khách hàng #415','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 415',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 05:00:17','2026-10-12 08:15:18'),(424,'Tương tác khách hàng #416','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 416',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 04:00:17','2026-10-12 08:15:18'),(425,'Tương tác khách hàng #417','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 417',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 03:00:17','2026-10-12 08:15:18'),(426,'Tương tác khách hàng #418','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 418',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 02:00:17','2026-10-12 08:15:18'),(427,'Tương tác khách hàng #419','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 419',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 01:00:17','2026-10-12 08:15:18'),(428,'Tương tác khách hàng #420','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 420',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-22 00:00:17','2026-10-12 08:15:18'),(429,'Tương tác khách hàng #421','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 421',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 23:00:17','2026-10-12 08:15:18'),(430,'Tương tác khách hàng #422','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 422',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 22:00:17','2026-10-12 08:15:18'),(431,'Tương tác khách hàng #423','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 423',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 21:00:17','2026-10-12 08:15:18'),(432,'Tương tác khách hàng #424','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 424',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 20:00:17','2026-10-12 08:15:18'),(433,'Tương tác khách hàng #425','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 425',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 19:00:17','2026-10-12 08:15:18'),(434,'Tương tác khách hàng #426','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 426',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 18:00:17','2026-10-12 08:15:18'),(435,'Tương tác khách hàng #427','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 427',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 17:00:17','2026-10-12 08:15:18'),(436,'Tương tác khách hàng #428','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 428',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 16:00:17','2026-10-12 08:15:18'),(437,'Tương tác khách hàng #429','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 429',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 15:00:17','2026-10-12 08:15:18'),(438,'Tương tác khách hàng #430','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 430',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 14:00:17','2026-10-12 08:15:18'),(439,'Tương tác khách hàng #431','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 431',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 13:00:17','2026-10-12 08:15:18'),(440,'Tương tác khách hàng #432','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 432',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 12:00:17','2026-10-12 08:15:18'),(441,'Tương tác khách hàng #433','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 433',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 11:00:17','2026-10-12 08:15:18'),(442,'Tương tác khách hàng #434','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 434',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 10:00:17','2026-10-12 08:15:18'),(443,'Tương tác khách hàng #435','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 435',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 09:00:17','2026-10-12 08:15:18'),(444,'Tương tác khách hàng #436','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 436',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 08:00:17','2026-10-12 08:15:18'),(445,'Tương tác khách hàng #437','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 437',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 07:00:17','2026-10-12 08:15:18'),(446,'Tương tác khách hàng #438','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 438',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 06:00:17','2026-10-12 08:15:18'),(447,'Tương tác khách hàng #439','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 439',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 05:00:17','2026-10-12 08:15:18'),(448,'Tương tác khách hàng #440','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 440',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 04:00:17','2026-10-12 08:15:18'),(449,'Tương tác khách hàng #441','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 441',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 03:00:17','2026-10-12 08:15:18'),(450,'Tương tác khách hàng #442','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 442',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 02:00:17','2026-10-12 08:15:18'),(451,'Tương tác khách hàng #443','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 443',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 01:00:17','2026-10-12 08:15:18'),(452,'Tương tác khách hàng #444','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 444',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-21 00:00:17','2026-10-12 08:15:18'),(453,'Tương tác khách hàng #445','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 445',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 23:00:17','2026-10-12 08:15:18'),(454,'Tương tác khách hàng #446','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 446',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 22:00:17','2026-10-12 08:15:18'),(455,'Tương tác khách hàng #447','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 447',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 21:00:17','2026-10-12 08:15:18'),(456,'Tương tác khách hàng #448','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 448',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 20:00:17','2026-10-12 08:15:18'),(457,'Tương tác khách hàng #449','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 449',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 19:00:17','2026-10-12 08:15:18'),(458,'Tương tác khách hàng #450','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 450',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 18:00:17','2026-10-12 08:15:18'),(459,'Tương tác khách hàng #451','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 451',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 17:00:17','2026-10-12 08:15:18'),(460,'Tương tác khách hàng #452','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 452',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 16:00:17','2026-10-12 08:15:18'),(461,'Tương tác khách hàng #453','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 453',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 15:00:17','2026-10-12 08:15:18'),(462,'Tương tác khách hàng #454','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 454',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 14:00:17','2026-10-12 08:15:18'),(463,'Tương tác khách hàng #455','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 455',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 13:00:17','2026-10-12 08:15:18'),(464,'Tương tác khách hàng #456','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 456',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 12:00:17','2026-10-12 08:15:18'),(465,'Tương tác khách hàng #457','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 457',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 11:00:17','2026-10-12 08:15:18'),(466,'Tương tác khách hàng #458','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 458',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 10:00:17','2026-10-12 08:15:18'),(467,'Tương tác khách hàng #459','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 459',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 09:00:17','2026-10-12 08:15:18'),(468,'Tương tác khách hàng #460','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 460',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 08:00:17','2026-10-12 08:15:18'),(469,'Tương tác khách hàng #461','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 461',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 07:00:17','2026-10-12 08:15:18'),(470,'Tương tác khách hàng #462','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 462',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 06:00:17','2026-10-12 08:15:18'),(471,'Tương tác khách hàng #463','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 463',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 05:00:17','2026-10-12 08:15:18'),(472,'Tương tác khách hàng #464','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 464',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 04:00:17','2026-10-12 08:15:18'),(473,'Tương tác khách hàng #465','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 465',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 03:00:17','2026-10-12 08:15:18'),(474,'Tương tác khách hàng #466','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 466',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 02:00:17','2026-10-12 08:15:18'),(475,'Tương tác khách hàng #467','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 467',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 01:00:17','2026-10-12 08:15:18'),(476,'Tương tác khách hàng #468','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 468',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-20 00:00:17','2026-10-12 08:15:18'),(477,'Tương tác khách hàng #469','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 469',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 23:00:17','2026-10-12 08:15:18'),(478,'Tương tác khách hàng #470','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 470',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 22:00:17','2026-10-12 08:15:18'),(479,'Tương tác khách hàng #471','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 471',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 21:00:17','2026-10-12 08:15:18'),(480,'Tương tác khách hàng #472','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 472',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 20:00:17','2026-10-12 08:15:18'),(481,'Tương tác khách hàng #473','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 473',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 19:00:17','2026-10-12 08:15:18'),(482,'Tương tác khách hàng #474','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 474',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 18:00:17','2026-10-12 08:15:18'),(483,'Tương tác khách hàng #475','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 475',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 17:00:17','2026-10-12 08:15:18'),(484,'Tương tác khách hàng #476','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 476',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 16:00:17','2026-10-12 08:15:18'),(485,'Tương tác khách hàng #477','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 477',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 15:00:17','2026-10-12 08:15:18'),(486,'Tương tác khách hàng #478','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 478',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 14:00:17','2026-10-12 08:15:18'),(487,'Tương tác khách hàng #479','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 479',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 13:00:17','2026-10-12 08:15:18'),(488,'Tương tác khách hàng #480','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 480',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 12:00:17','2026-10-12 08:15:18'),(489,'Tương tác khách hàng #481','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 481',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 11:00:17','2026-10-12 08:15:18'),(490,'Tương tác khách hàng #482','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 482',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 10:00:17','2026-10-12 08:15:18'),(491,'Tương tác khách hàng #483','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 483',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 09:00:17','2026-10-12 08:15:18'),(492,'Tương tác khách hàng #484','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 484',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 08:00:17','2026-10-12 08:15:18'),(493,'Tương tác khách hàng #485','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 485',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 07:00:17','2026-10-12 08:15:18'),(494,'Tương tác khách hàng #486','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 486',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 06:00:17','2026-10-12 08:15:18'),(495,'Tương tác khách hàng #487','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 487',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 05:00:17','2026-10-12 08:15:18'),(496,'Tương tác khách hàng #488','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 488',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 04:00:17','2026-10-12 08:15:18'),(497,'Tương tác khách hàng #489','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 489',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 03:00:17','2026-10-12 08:15:18'),(498,'Tương tác khách hàng #490','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 490',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 02:00:17','2026-10-12 08:15:18'),(499,'Tương tác khách hàng #491','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 491',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 01:00:18','2026-10-12 08:15:18'),(500,'Tương tác khách hàng #492','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 492',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-19 00:00:18','2026-10-12 08:15:18'),(501,'Tương tác khách hàng #493','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 493',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 23:00:18','2026-10-12 08:15:18'),(502,'Tương tác khách hàng #494','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 494',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 22:00:18','2026-10-12 08:15:18'),(503,'Tương tác khách hàng #495','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 495',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 21:00:18','2026-10-12 08:15:18'),(504,'Tương tác khách hàng #496','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 496',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 20:00:18','2026-10-12 08:15:18'),(505,'Tương tác khách hàng #497','EMAIL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 497',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 19:00:18','2026-10-12 08:15:18'),(506,'Tương tác khách hàng #498','MEETING','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 498',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 18:00:18','2026-10-12 08:15:18'),(507,'Tương tác khách hàng #499','NOTE','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 499',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 17:00:18','2026-10-12 08:15:18'),(508,'Tương tác khách hàng #500','CALL','Chi tiết nội dung trao đổi, đàm phán hợp đồng hoặc tư vấn giải pháp CRM số 500',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,1,NULL,0,'2026-09-18 16:00:18','2026-10-12 08:15:18'),(509,'Gọi điện chào giải pháp Server','CALL','Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-07 13:24:30','2026-10-10 02:59:59'),(510,'Gửi hồ sơ năng lực và catalog giải pháp','EMAIL','Đã gửi catalog giải pháp CRM & Server cho anh Huy',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-08 13:24:30','2026-10-10 02:59:59'),(511,'Gọi điện chào giải pháp Server','CALL','Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-07 13:24:52','2026-10-10 02:59:59'),(512,'Gửi hồ sơ năng lực và catalog giải pháp','EMAIL','Đã gửi catalog giải pháp CRM & Server cho anh Huy',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,4,NULL,0,'2026-10-08 13:24:52','2026-10-10 02:59:59'),(513,'Gộp khách hàng trùng lặp','NOTE','Đã gộp dữ liệu từ khách hàng \'Công ty Cổ phần Điện tử Đại Phát\' (Mã: #13) vào khách hàng này. Giữ lại toàn bộ 1 người liên hệ, 1 cơ hội, 4 hoạt động, 1 tệp đính kèm. Thực hiện bởi: Trần Thị Thu Hà.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,12,NULL,NULL,3,NULL,0,'2026-10-09 13:39:09','2026-10-10 02:59:59'),(514,'Gọi điện chào giải pháp Server','CALL','Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,13,NULL,NULL,4,NULL,0,'2026-10-07 13:39:26','2026-10-10 02:59:59'),(515,'Gửi hồ sơ năng lực và catalog giải pháp','EMAIL','Đã gửi catalog giải pháp CRM & Server cho anh Huy',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,13,NULL,NULL,4,NULL,0,'2026-10-08 13:39:26','2026-10-10 02:59:59'),(516,'Gọi điện chào giải pháp Server','CALL','Đã gọi cho anh Huy, anh hẹn tuần tới gửi báo giá chi tiết',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,13,NULL,NULL,4,NULL,0,'2026-10-08 02:58:45','2026-10-10 02:58:45'),(517,'Gửi hồ sơ năng lực và catalog giải pháp','EMAIL','Đã gửi catalog giải pháp CRM & Server cho anh Huy',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,13,NULL,NULL,4,NULL,0,'2026-10-09 02:58:45','2026-10-10 02:58:45'),(518,'Lead mới từ Website: Vũ Hải Đăng','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu tư vấn giải pháp Landing Page (Mã: wf_landingpage_tuvan)\n- Họ và tên: Vũ Hải Đăng\n- Email: haidang.vu@smarttech.vn\n- Số điện thoại: 0909123456\n- Công ty: Tập đoàn Công nghệ SmartTech\n- Nhu cầu quan tâm: Cần tích hợp Web-to-Lead và CRM Khách hàng 360 cho 50 nhân viên kinh doanh\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Website / Biểu mẫu\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-14 09:27:57',0,20,NULL,NULL,1,NULL,0,'2026-10-14 02:27:56','2026-10-17 06:08:46'),(519,'Lead mới từ Website: User 1','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu tư vấn giải pháp Landing Page (Mã: wf_landingpage_tuvan)\n- Họ và tên: User 1\n- Email: user1@test.vn\n- Số điện thoại: 0912345671\n- Công ty: Company 1\n- Nhu cầu quan tâm: Test rate limit\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Website / Biểu mẫu\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-14 09:28:35',0,21,NULL,NULL,1,NULL,0,'2026-10-14 02:28:35','2026-10-14 02:28:35'),(520,'Lead mới từ Website: User 2','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu tư vấn giải pháp Landing Page (Mã: wf_landingpage_tuvan)\n- Họ và tên: User 2\n- Email: user2@test.vn\n- Số điện thoại: 0912345672\n- Công ty: Company 2\n- Nhu cầu quan tâm: Test rate limit\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Website / Biểu mẫu\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-14 09:28:35',0,22,NULL,NULL,1,NULL,0,'2026-10-14 02:28:35','2026-10-14 02:28:35'),(521,'Lead mới từ Website: User 3','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu tư vấn giải pháp Landing Page (Mã: wf_landingpage_tuvan)\n- Họ và tên: User 3\n- Email: user3@test.vn\n- Số điện thoại: 0912345673\n- Công ty: Company 3\n- Nhu cầu quan tâm: Test rate limit\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Website / Biểu mẫu\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-14 09:28:35',0,23,NULL,NULL,1,NULL,0,'2026-10-14 02:28:35','2026-10-14 02:28:35'),(522,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Hội thảo VietBuild 2026 | Trao đổi/Nhu cầu: Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,24,NULL,NULL,1,NULL,0,'2026-10-14 12:41:02','2026-10-15 01:41:18'),(523,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Hội thảo VietBuild 2026 | Trao đổi/Nhu cầu: Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,25,NULL,NULL,1,NULL,0,'2026-10-14 13:05:06','2026-10-15 01:41:18'),(524,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Triển lãm Công nghệ TechExpo | Trao đổi/Nhu cầu: Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,26,NULL,NULL,1,NULL,0,'2026-10-14 13:06:41','2026-10-15 01:41:18'),(525,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Website / Tìm kiếm',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,27,NULL,NULL,1,NULL,0,'2026-10-14 13:06:41','2026-10-15 01:41:18'),(526,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Người quen giới thiệu',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,28,NULL,NULL,1,NULL,0,'2026-10-14 13:06:41','2026-10-15 01:41:18'),(527,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Triển lãm Công nghệ TechExpo | Trao đổi/Nhu cầu: Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,29,NULL,NULL,1,NULL,0,'2026-10-14 13:10:52','2026-10-15 01:41:18'),(528,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Website / Tìm kiếm',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,30,NULL,NULL,1,NULL,0,'2026-10-14 13:10:53','2026-10-15 01:41:18'),(529,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Người quen giới thiệu',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,31,NULL,NULL,1,NULL,0,'2026-10-14 13:10:53','2026-10-15 01:41:18'),(530,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Hội thảo / Sự kiện | Sự kiện: Triển lãm Công nghệ TechExpo | Trao đổi/Nhu cầu: Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,32,NULL,NULL,1,NULL,0,'2026-10-14 13:12:56','2026-10-15 01:41:18'),(531,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Website / Tìm kiếm',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,33,NULL,NULL,1,NULL,0,'2026-10-14 13:12:56','2026-10-15 01:41:18'),(532,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: Người quen giới thiệu',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,34,NULL,NULL,1,NULL,0,'2026-10-14 13:12:56','2026-10-15 01:41:18'),(533,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: HOI_THAO | Trao đổi/Nhu cầu: Trien khai CRM Cloud',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,35,NULL,NULL,1,NULL,0,'2026-10-14 13:46:02','2026-10-14 13:46:02'),(534,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: HOI_THAO | Trao đổi/Nhu cầu: Trien khai CRM Cloud',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,36,NULL,NULL,1,NULL,0,'2026-10-14 13:47:41','2026-10-14 13:47:41'),(535,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,36,NULL,NULL,1,NULL,0,'2026-10-14 13:47:41','2026-10-14 13:47:41'),(536,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: SU_KIEN',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,56,NULL,193,1,NULL,0,'2026-10-14 13:47:42','2026-10-15 02:24:44'),(537,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai địa bàn phụ trách - Khách ở Miền Nam',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,56,NULL,193,1,NULL,0,'2026-10-14 13:47:42','2026-10-15 02:24:44'),(538,'Cuộc gọi tư vấn lần 1','CALL','Đã gọi trao đổi nhu cầu CRM 50 users',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,36,NULL,NULL,1,NULL,0,'2026-10-14 13:47:42','2026-10-15 01:41:18'),(539,'Họp demo trực tuyến','MEETING','Demo tính năng cơ hội và báo giá',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,36,NULL,NULL,1,NULL,0,'2026-10-14 13:47:42','2026-10-15 01:41:18'),(540,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: HOI_THAO | Trao đổi/Nhu cầu: Trien khai CRM Cloud',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,40,NULL,172,1,NULL,0,'2026-10-14 13:49:12','2026-10-14 13:49:13'),(541,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,40,NULL,172,1,NULL,0,'2026-10-14 13:49:12','2026-10-14 13:49:13'),(542,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: SU_KIEN',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,39,NULL,NULL,1,NULL,0,'2026-10-14 13:49:13','2026-10-14 13:49:13'),(543,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai địa bàn phụ trách - Khách ở Miền Nam',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,39,NULL,NULL,1,NULL,0,'2026-10-14 13:49:13','2026-10-15 01:41:18'),(544,'Cuộc gọi tư vấn lần 1','CALL','Đã gọi trao đổi nhu cầu CRM 50 users',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,40,NULL,172,1,NULL,0,'2026-10-14 13:49:13','2026-10-15 01:41:18'),(545,'Họp demo trực tuyến','MEETING','Demo tính năng cơ hội và báo giá',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,40,NULL,172,1,NULL,0,'2026-10-14 13:49:13','2026-10-15 01:41:18'),(546,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #38 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #40 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #187 (Le Hoang Long), Cơ hội #172 (Trien khai CRM Enterprise cho Hoang Long Global).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,40,NULL,172,1,NULL,0,'2026-10-14 13:49:13','2026-10-14 13:49:13'),(547,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: HOI_THAO | Trao đổi/Nhu cầu: Trien khai CRM Cloud',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,43,NULL,173,1,NULL,0,'2026-10-14 13:50:19','2026-10-14 13:50:19'),(548,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,43,NULL,173,1,NULL,0,'2026-10-14 13:50:19','2026-10-14 13:50:19'),(549,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: SU_KIEN',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,42,NULL,NULL,1,NULL,0,'2026-10-14 13:50:19','2026-10-14 13:50:19'),(550,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai địa bàn phụ trách - Khách ở Miền Nam',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,42,NULL,NULL,1,NULL,0,'2026-10-14 13:50:19','2026-10-15 01:41:18'),(551,'Cuộc gọi tư vấn lần 1','CALL','Đã gọi trao đổi nhu cầu CRM 50 users',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,43,NULL,173,1,NULL,0,'2026-10-14 13:50:19','2026-10-15 01:41:18'),(552,'Họp demo trực tuyến','MEETING','Demo tính năng cơ hội và báo giá',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,43,NULL,173,1,NULL,0,'2026-10-14 13:50:19','2026-10-15 01:41:18'),(553,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #41 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #43 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #190 (Le Hoang Long), Cơ hội #173 (Trien khai CRM Enterprise cho Hoang Long Global).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,43,NULL,173,1,NULL,0,'2026-10-14 13:50:19','2026-10-14 13:50:19'),(554,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: HOI_THAO | Trao đổi/Nhu cầu: Trien khai CRM Cloud',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,46,NULL,174,1,NULL,0,'2026-10-14 13:50:42','2026-10-14 13:50:43'),(555,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,46,NULL,174,1,NULL,0,'2026-10-14 13:50:42','2026-10-14 13:50:43'),(556,'Thu thập lead thủ công','NOTE','Tạo lead thủ công từ nguồn: SU_KIEN',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-14 13:50:43','2026-10-19 04:48:09'),(557,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai địa bàn phụ trách - Khách ở Miền Nam',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-14 13:50:43','2026-10-19 04:48:09'),(558,'Cuộc gọi tư vấn lần 1','CALL','Đã gọi trao đổi nhu cầu CRM 50 users',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,46,NULL,174,1,NULL,0,'2026-10-14 13:50:43','2026-10-15 01:41:18'),(559,'Họp demo trực tuyến','MEETING','Demo tính năng cơ hội và báo giá',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,46,NULL,174,1,NULL,0,'2026-10-14 13:50:43','2026-10-15 01:41:18'),(560,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #44 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #46 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #193 (Le Hoang Long), Cơ hội #174 (Trien khai CRM Enterprise cho Hoang Long Global).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,46,NULL,174,1,NULL,0,'2026-10-14 13:50:43','2026-10-14 13:50:43'),(561,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#26) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,26,NULL,NULL,4,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(562,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#27) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,27,NULL,NULL,5,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(563,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#28) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,28,NULL,NULL,7,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(564,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#29) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,29,NULL,NULL,4,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(565,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#30) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,30,NULL,NULL,5,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(566,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#31) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,31,NULL,NULL,7,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(567,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#32) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,32,NULL,NULL,4,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(568,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#33) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,33,NULL,NULL,5,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(569,'⚠️ Cảnh báo: Vi phạm SLA phản hồi Lead','SYSTEM','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#34) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!',NULL,NULL,'PENDING','MEDIUM',NULL,0,34,NULL,NULL,7,NULL,0,'2026-10-15 00:10:04','2026-10-15 00:10:04'),(570,'Lead mới từ Website: Nguyen Van Test','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu đăng ký Demo trải nghiệm CRM (Mã: wf_demo_crm_q4)\n- Họ và tên: Nguyen Van Test\n- Email: testform@example.com\n- Số điện thoại: 0987654321\n- Công ty: Test Corp\n- Nhu cầu quan tâm: Demo CRM solutions\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Landing Page Chiến dịch Q4\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-15 08:19:20',0,47,NULL,NULL,1,NULL,0,'2026-10-15 01:19:20','2026-10-15 01:19:20'),(571,'Lead mới từ Website: Nguyen Van Test','NOTE','[Lead thu thập từ Biểu mẫu Web]\n- Biểu mẫu: Biểu mẫu đăng ký Demo trải nghiệm CRM (Mã: wf_demo_crm_q4)\n- Họ và tên: Nguyen Van Test\n- Email: testform@example.com\n- Số điện thoại: 0987654321\n- Công ty: Test Corp\n- Nhu cầu quan tâm: Demo CRM solutions\n- IP: 0:0:0:0:0:0:0:1\n- Nguồn: Landing Page Chiến dịch Q4\n',NULL,NULL,'COMPLETED','MEDIUM','2026-10-15 08:29:41',0,48,NULL,NULL,1,NULL,0,'2026-10-15 01:29:41','2026-10-15 01:29:41'),(572,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,1,NULL,NULL,1,NULL,0,'2026-10-15 01:45:44','2026-10-15 01:45:44'),(573,'Thu thập lead từ Excel','NOTE','Nhu cầu ban đầu: Gặp tại gian hàng VietBuild, quan tâm gói 30 nhân sự (Nguồn: Hội thảo / Sự kiện)',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,49,NULL,NULL,1,NULL,0,'2026-10-15 01:54:03','2026-10-15 01:54:03'),(574,'Thu thập lead từ Excel','NOTE','Nhu cầu ban đầu: Cần demo tính năng phân quyền dữ liệu và mobile app (Nguồn: Hội thảo / Sự kiện)',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,53,NULL,191,1,NULL,0,'2026-10-15 01:54:03','2026-10-15 02:20:31'),(575,'Thu thập lead từ Excel','NOTE','Nhu cầu ban đầu: Đăng ký tư vấn qua Facebook Lead Ads (Nguồn: Mạng xã hội)',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-15 01:54:03','2026-10-19 04:28:32'),(576,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #51 (Công ty TNHH Quảng cáo Sáng tạo Sunrise) đã được chuyển đổi thành Khách hàng #52 (Sunrise Test Corp), Người liên hệ #197 (Pháº¡m HoÃ ng Yáº¿n), Cơ hội #190 (Sunrise - GÃ³i CRM Pro 2026).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-15 02:09:20','2026-10-19 04:28:32'),(577,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-15 02:09:38','2026-10-19 04:28:32'),(578,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: KhÃ¡ch hÃ ng ngoÃ i khu vá»±c phá»¥ trÃ¡ch',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-15 02:09:38','2026-10-19 04:28:32'),(579,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #50 (Công ty Cổ phần Công nghệ SmartTech) đã được chuyển đổi thành Khách hàng #53 (SmartTech Enterprise Test), Người liên hệ #198 (Tráº§n Minh Tuáº¥n), Cơ hội #191 (SmartTech - GÃ³i Chuyá»ƒn Äá»•i Sá»‘).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,53,NULL,191,1,NULL,0,'2026-10-15 02:20:31','2026-10-15 02:20:31'),(580,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,49,NULL,NULL,1,NULL,0,'2026-10-15 02:21:09','2026-10-15 02:21:09'),(581,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai dia ban phu trach',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-15 02:21:09','2026-10-19 04:48:09'),(582,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-15 02:23:20','2026-10-19 04:48:09'),(583,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai dia ban phu trach',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,42,NULL,NULL,1,NULL,0,'2026-10-15 02:23:20','2026-10-15 02:23:20'),(585,'Tiếp nhận Lead chăm sóc','SYSTEM','Nhân viên kinh doanh đã tiếp nhận lead để bắt đầu liên hệ chăm sóc khách hàng.',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,42,NULL,NULL,1,NULL,0,'2026-10-15 02:24:44','2026-10-15 02:24:44'),(586,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai dia ban phu trach',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,39,NULL,NULL,1,NULL,0,'2026-10-15 02:24:44','2026-10-15 02:24:44'),(587,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #37 (Công ty TNHH Thời Trang Mai Vy) đã được chuyển đổi thành Khách hàng #56 (Nam Long Group Test), Người liên hệ #200 (Nguyen Hoang Nam), Cơ hội #193 (Nam Long - Hop dong Q4).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,56,NULL,193,1,NULL,0,'2026-10-15 02:24:44','2026-10-15 02:24:44'),(588,'🔄 Bàn giao cơ hội: Dự án Tổng đài Cloud CallCenter 50 Agents','NOTE','Chuyển quyền sở hữu từ [Lê Hoàng Nam] sang [Phạm Mai Phương].\nLý do: Nhân viên quá tải số lượng cơ hội (Cân bằng khối lượng công việc)\nGhi chú: Đã gặp mặt khách hàng tuần trước, cần Mai Phương gọi lại để chốt báo giá gói 50 agents.\nNgười thực hiện: Trần Thị Thu Hà',NULL,NULL,'COMPLETED','MEDIUM','2026-10-17 06:59:19',0,15,NULL,152,5,NULL,0,'2026-10-17 06:59:19','2026-10-17 06:59:19'),(589,'🔄 Bàn giao cơ hội: Triển khai CRM Enterprise cho VPBank Thăng Long','NOTE','Chuyển quyền sở hữu từ [Lê Hoàng Nam] sang [Phạm Mai Phương].\nLý do: Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày\nGhi chú: Bàn giao hàng loạt thương vụ miền Bắc cho Mai Phương tiếp quản trong thời gian Nam nghỉ phép.\nNgười thực hiện: Trần Thị Thu Hà',NULL,NULL,'COMPLETED','MEDIUM','2026-10-17 07:00:32',0,4,NULL,1,5,NULL,0,'2026-10-17 07:00:32','2026-10-17 07:00:32'),(590,'🔄 Bàn giao cơ hội: Hợp đồng Nâng cấp Băng thông Quốc tế & VPN','NOTE','Chuyển quyền sở hữu từ [Lê Hoàng Nam] sang [Phạm Mai Phương].\nLý do: Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày\nGhi chú: Bàn giao hàng loạt thương vụ miền Bắc cho Mai Phương tiếp quản trong thời gian Nam nghỉ phép.\nNgười thực hiện: Trần Thị Thu Hà',NULL,NULL,'COMPLETED','MEDIUM','2026-10-17 07:00:32',0,15,NULL,151,5,NULL,0,'2026-10-17 07:00:32','2026-10-17 07:00:32'),(591,'Goi dien trao doi ky thuat voi VPBank','CALL','Khach hang da dong y phuong an tich hop, cho ky hop dong',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 18:40:49',0,4,NULL,1,1,NULL,0,'2026-10-18 11:40:49','2026-10-18 11:40:49'),(592,'Gọi điện chốt tiến độ hợp đồng với ban dự án VPBank','CALL','Khách hàng đồng ý tiến độ nghiệm thu theo từng giai đoạn, dự kiến ký hợp đồng trong tuần tới.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 18:42:41',0,1,NULL,1,1,NULL,0,'2026-10-18 11:42:41','2026-10-18 11:42:41'),(593,'Gọi điện chốt tiến độ hợp đồng với ban dự án VPBank','CALL','Khách hàng đồng ý tiến độ nghiệm thu theo từng giai đoạn, dự kiến ký hợp đồng trong tuần tới.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 18:43:22',0,1,NULL,1,1,NULL,0,'2026-10-18 11:43:22','2026-10-18 11:43:22'),(594,'Gọi điện chốt tiến độ hợp đồng với ban dự án VPBank','CALL','Khách hàng đồng ý tiến độ nghiệm thu theo từng giai đoạn, dự kiến ký hợp đồng trong tuần tới.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 18:43:52',0,1,NULL,1,1,NULL,0,'2026-10-18 11:43:51','2026-10-18 11:43:51'),(595,'Gọi điện chốt tiến độ hợp đồng với ban dự án VPBank','CALL','Khách hàng đồng ý tiến độ nghiệm thu theo từng giai đoạn, dự kiến ký hợp đồng trong tuần tới.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 18:44:38',0,1,NULL,1,1,NULL,0,'2026-10-18 11:44:37','2026-10-18 11:44:37'),(596,'Họp trao đổi trực tiếp tại trụ sở VPBank','MEETING','Gặp Giám đốc CNTT VPBank trao đổi phương án tích hợp Core Banking và bảo mật SSO','Khách hàng đánh giá cao giải pháp, yêu cầu gửi lại bản đặc tả API trước thứ 6',NULL,'COMPLETED','MEDIUM','2026-10-16 12:16:08',60,1,1,1,1,NULL,0,'2026-10-16 12:16:08','2026-10-19 02:05:50'),(597,'Gọi điện thoại xác nhận lịch demo phòng ban','CALL','Gọi cho Trưởng phòng CSKH xác nhận tham dự buổi demo tính năng Omnichannel','Đã chốt lịch demo sáng thứ Ba tuần tới lúc 9h30',NULL,'COMPLETED','MEDIUM','2026-10-17 12:16:08',15,1,1,1,1,NULL,0,'2026-10-17 12:16:08','2026-10-19 02:05:50'),(598,'Gửi email tài liệu kiến trúc bảo mật & SLA','EMAIL','Gửi bộ tài liệu bảo mật SOC2, ISO27001 và cam kết thời gian phản hồi SLA','Đã chuyển tiếp cho đội IT Security xem xét',NULL,'COMPLETED','MEDIUM','2026-10-18 07:16:08',10,1,1,1,2,NULL,0,'2026-10-18 07:16:08','2026-10-19 02:05:50'),(599,'Ghi chú nhanh sau khi rời văn phòng NEM Fashion','NOTE','Gặp chị Hương tại showroom Bà Triệu. Khách muốn bổ sung thêm 3 chi nhánh mới vào gói CRM','Cần cập nhật báo giá bổ sung thêm 3 chi nhánh trong hôm nay',NULL,'COMPLETED','MEDIUM','2026-10-18 09:16:08',45,2,2,2,3,NULL,0,'2026-10-18 09:16:08','2026-10-19 02:05:50'),(600,'Họp rà soát điều khoản hợp đồng tại trụ sở khách hàng','CALL','Gặp Trưởng phòng CNTT và Ban giám đốc, giải đáp xong toàn bộ yêu cầu bảo mật thông tin.','Đồng ý ký hợp đồng tuần tới',NULL,'COMPLETED','MEDIUM','2026-10-18 08:31:00',45,1,1,1,4,NULL,0,'2026-10-18 12:31:34','2026-10-18 12:31:34'),(601,'Gọi điện xác nhận lịch ký hợp đồng','CALL','Anh Hùng xác nhận đã chuyển hợp đồng sang bộ phận pháp chế rà soát lần cuối.','Khách hẹn 9h sáng thứ 2',NULL,'COMPLETED','MEDIUM','2026-10-18 19:31:35',15,1,1,1,4,NULL,0,'2026-10-18 12:31:34','2026-10-18 12:31:34'),(602,'Họp trực tiếp tại trụ sở VPBank Thăng Long','CALL','Gặp anh Phát và chị Mai. Đã thống nhất biểu mẫu hợp đồng dịch vụ đám mây.','Khách hàng đồng ý tiến độ nghiệm thu giai đoạn 1',NULL,'COMPLETED','MEDIUM','2026-10-18 09:37:00',50,1,1,1,4,NULL,0,'2026-10-18 12:37:29','2026-10-18 12:37:29'),(603,'Gọi điện xác nhận bổ sung phụ lục bảo mật','CALL','Khách hàng đã nhận được bản NDA và hẹn phản hồi chiều nay.','Đã gửi bản cam kết NDA',NULL,'COMPLETED','MEDIUM','2026-10-18 19:37:30',15,1,1,1,4,NULL,0,'2026-10-18 12:37:29','2026-10-18 12:37:29'),(604,'Gửi bảng báo giá CRM Enterprise cho khách vào thứ Sáu','TASK','Rà soát biểu phí tích hợp Core Banking và gửi file báo giá chính thức cho anh Phát trước 17h thứ Sáu.',NULL,NULL,'OPEN','HIGH','2026-10-22 00:00:00',30,1,1,1,4,3,0,'2026-10-18 12:48:53','2026-10-19 02:05:50'),(605,'Kiểm tra lại phụ lục hợp đồng mẫu','TASK','Đã rà soát xong các điều khoản bảo mật với phòng pháp chế.','Đã hoàn thành và gửi duyệt',NULL,'COMPLETED','MEDIUM','2026-10-17 12:48:53',45,1,1,1,4,4,0,'2026-10-16 12:48:53','2026-10-19 02:05:50'),(606,'Gọi điện chốt lịch ký hợp đồng ba bên','TASK','Hẹn ban giám đốc và đối tác công nghệ chốt ngày ký hợp đồng.','Đã liên hệ nhưng khách hoãn lịch','Khách hàng bận họp Hội đồng quản trị đột xuất, yêu cầu dời lịch sang thứ Ba tuần sau.','POSTPONED','URGENT','2026-10-21 12:48:53',20,1,1,1,4,3,0,'2026-10-17 12:48:53','2026-10-19 02:05:50'),(607,'Họp demo giải pháp tích hợp CTI Tổng đài','MEETING','Demo trực tiếp tính năng click-to-call và ghi âm cuộc gọi cho đội CSKH VPBank',NULL,NULL,'OPEN','HIGH','2026-10-19 12:48:53',60,1,1,1,4,4,0,'2026-10-18 12:48:53','2026-10-19 02:05:50'),(608,'Cuộc gặp trao đổi yêu cầu với NEM Fashion','MEETING','Gặp chị Hương tại showroom Bà Triệu để khảo sát quy trình bán lẻ',NULL,NULL,'OPEN','MEDIUM','2026-10-20 12:48:53',90,2,2,2,5,3,0,'2026-10-18 12:48:53','2026-10-19 02:05:50'),(609,'Gửi báo giá giải pháp CRM Enterprise cho khách vào thứ Sáu','TASK','Lời hứa gửi báo giá chi tiết gồm 50 user và chiết khấu 10% trước 17h thứ Sáu','Đã hoàn thành','Khách hàng dời lịch họp để chờ TGĐ phê duyệt','COMPLETED','URGENT','2026-10-26 09:30:00',15,1,NULL,1,7,1,0,'2026-10-18 13:03:02','2026-10-18 13:03:02'),(610,'Gửi báo giá giải pháp CRM Enterprise cho khách vào thứ Sáu','TASK','Lời hứa gửi báo giá chi tiết gồm 50 user và chiết khấu 10% trước 17h thứ Sáu','Đã hoàn thành','Khách hàng dời lịch họp để chờ TGĐ phê duyệt','COMPLETED','URGENT','2026-10-26 09:30:00',15,1,NULL,1,7,1,0,'2026-10-18 13:03:20','2026-10-18 13:03:20'),(611,'Gửi báo giá giải pháp CRM Enterprise cho khách vào thứ Sáu','TASK','Lời hứa gửi báo giá chi tiết gồm 50 user và chiết khấu 10% trước 17h thứ Sáu','Đã hoàn thành','Khách hàng dời lịch họp để chờ TGĐ phê duyệt','COMPLETED','URGENT','2026-10-26 09:30:00',15,1,NULL,1,7,1,0,'2026-10-18 13:03:46','2026-10-18 13:03:47'),(612,'Gửi hợp đồng nguyên tắc triển khai CRM cho VPBank Thăng Long','TASK','Hợp đồng NDA và thỏa thuận dịch vụ cung ứng giải pháp CRM.',NULL,NULL,'OPEN','URGENT','2026-10-18 02:18:42',30,4,NULL,1,1,NULL,0,'2026-10-14 13:08:43','2026-10-19 02:18:42'),(613,'Phê duyệt đề xuất chiết khấu dự án NEM Fashion','TASK','Yêu cầu phê duyệt chiết khấu 8% từ chuyên viên kinh doanh.',NULL,NULL,'OPEN','HIGH','2026-10-18 14:18:42',15,5,NULL,2,1,NULL,0,'2026-10-17 13:08:43','2026-10-19 02:18:42'),(614,'Gọi điện xác nhận lịch triển khai với VPBank Thăng Long','TASK','Liên hệ anh Phát để chốt phòng họp kỹ thuật.','Đã chốt lịch họp kỹ thuật',NULL,'COMPLETED','URGENT','2026-10-17 13:08:43',20,4,NULL,1,4,NULL,0,'2026-10-15 13:08:43','2026-10-19 02:18:42'),(615,'Hoàn thiện hồ sơ năng lực gói CRM Cloud cho NEM Fashion','TASK','Hồ sơ dự thầu phần mềm quản lý quan hệ khách hàng.','Đã gửi bộ hồ sơ năng lực cho khách',NULL,'COMPLETED','MEDIUM','2026-10-15 13:08:43',60,5,NULL,2,4,NULL,0,'2026-10-13 13:08:43','2026-10-19 02:18:42'),(616,'Bổ sung chứng nhận an toàn thông tin ISO 27001 cho VPBank Thăng Long','TASK','Khách hàng yêu cầu gửi kèm phụ lục an ninh mạng.','Đã bổ sung chứng chỉ kiểm định',NULL,'COMPLETED','HIGH','2026-10-18 01:08:43',30,4,NULL,1,5,NULL,0,'2026-10-16 13:08:43','2026-10-19 02:18:42'),(617,'Chuẩn bị tài liệu buổi họp demo giải pháp VPBank Thăng Long','TASK','Kiểm tra tài khoản demo và kịch bản CSKH đa kênh.','Đã chuẩn bị xong kịch bản demo',NULL,'COMPLETED','HIGH','2026-10-18 13:53:43',30,4,NULL,1,1,NULL,0,'2026-10-18 13:08:43','2026-10-19 02:18:42'),(618,'Gửi email nhắc khách hàng Nem Fashion về buổi webinar','TASK','Email thông báo kèm link Zoom và tài liệu hướng dẫn.','Đã gửi email tự động',NULL,'COMPLETED','MEDIUM','2026-10-18 15:08:43',20,5,NULL,2,1,NULL,0,'2026-10-18 13:08:43','2026-10-19 02:18:42'),(619,'Gọi điện chăm sóc định kỳ cho Viettravel Sun','TASK','Hỏi thăm phản hồi sau 1 tuần dùng thử bản Enterprise.','Khách phản hồi hệ thống ổn định',NULL,'COMPLETED','MEDIUM','2026-10-18 14:38:43',15,3,NULL,3,4,NULL,0,'2026-10-18 13:08:43','2026-10-19 02:18:42'),(620,'Gọi tư vấn gói CRM Pro cho NEM Fashion','CALL','Tư vấn tích hợp POS và SMS Marketing.','Khách hẹn tuần sau họp chốt phương án',NULL,'COMPLETED','HIGH',NULL,15,2,NULL,2,4,NULL,0,'2026-10-17 13:08:43','2026-10-19 02:05:50'),(621,'Gặp mặt trao đổi tiến độ với Tập đoàn Sunhouse','MEETING','Họp với Giám đốc IT về kết nối API ERP.','Đã thống nhất tài liệu đặc tả kỹ thuật',NULL,'COMPLETED','HIGH',NULL,60,3,NULL,3,4,NULL,0,'2026-10-16 13:08:43','2026-10-19 02:05:50'),(622,'Gửi báo giá tùy biến tính năng thẻ VIP','EMAIL','Gửi bảng chiết tính chi phí phát triển module riêng.','Đã gửi, đang chờ khách hàng phản hồi',NULL,'COMPLETED','MEDIUM',NULL,10,1,NULL,1,5,NULL,0,'2026-10-17 13:08:43','2026-10-19 02:05:50'),(623,'Gọi điện xác minh thông tin doanh nghiệp mới','CALL','Kiểm tra quy mô và nhu cầu phần mềm.','Số điện thoại đúng, đã gửi profile công ty',NULL,'COMPLETED','LOW',NULL,5,2,NULL,2,5,NULL,0,'2026-10-18 09:08:43','2026-10-19 02:05:50'),(624,'Tư vấn chuyển đổi số cho Chuỗi nhà thuốc Pharma','CALL','Giới thiệu giải pháp CRM quản lý điểm bán lẻ.','Khách hàng quan tâm và xin dùng thử 14 ngày',NULL,'COMPLETED','LOW',NULL,3,3,NULL,3,5,NULL,0,'2026-10-18 11:08:43','2026-10-19 02:05:50'),(625,'Cuộc gọi với Công ty Cổ phần Công nghệ ABC (Nghe máy - Quan tâm)','CALL','Khách hàng rất quan tâm đến gói ERP Cloud, cần gửi báo giá chi tiết trong tuần','Nghe máy - Quan tâm',NULL,'COMPLETED','MEDIUM','2026-10-18 20:29:10',2,1,NULL,189,1,1,0,'2026-10-18 13:29:09','2026-10-18 13:29:09'),(626,'Gọi lại cho Công ty Cổ phần Công nghệ ABC (Theo hẹn: Nghe máy - Quan tâm)','TASK','Lịch gọi lại tự động tạo từ cuộc gọi nhanh lúc 20:29 18/10/2026. Ghi chú trước đó: Khách hàng rất quan tâm đến gói ERP Cloud, cần gửi báo giá chi tiết trong tuần',NULL,NULL,'OPEN','HIGH','2026-10-19 09:30:00',15,1,NULL,189,1,1,0,'2026-10-18 13:29:09','2026-10-18 13:29:09'),(627,'Cuộc gọi với Công ty Cổ phần Công nghệ ABC (Nghe máy - Quan tâm)','CALL','Khách hàng rất quan tâm đến gói ERP Cloud, cần gửi báo giá chi tiết trong tuần','Nghe máy - Quan tâm',NULL,'COMPLETED','MEDIUM','2026-10-18 20:29:26',2,1,NULL,189,1,1,0,'2026-10-18 13:29:25','2026-10-18 13:29:25'),(628,'Gọi lại cho Công ty Cổ phần Công nghệ ABC (Theo hẹn: Nghe máy - Quan tâm)','TASK','Lịch gọi lại tự động tạo từ cuộc gọi nhanh lúc 20:29 18/10/2026. Ghi chú trước đó: Khách hàng rất quan tâm đến gói ERP Cloud, cần gửi báo giá chi tiết trong tuần',NULL,NULL,'OPEN','HIGH','2026-10-19 09:30:00',15,1,NULL,189,1,1,0,'2026-10-18 13:29:25','2026-10-18 13:29:25'),(629,'Gửi email báo giá BG-600046','EMAIL','Đã gửi email báo giá tới customer.test@example.com kèm liên kết trực tuyến: /public-quote.html?token=1f5519a55d724e788c08812c51928373\nLời nhắn: Kính gửi quý khách báo giá giải pháp CRM.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:26:40',0,56,NULL,193,1,NULL,0,'2026-10-18 14:26:40','2026-10-18 14:26:40'),(630,'Khách hàng ĐỒNG Ý báo giá: BG-600046','FEEDBACK','Khách hàng đã CHẤP NHẬN báo giá qua liên kết bảo mật.\nÝ kiến phản hồi: Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:26:40',0,56,NULL,193,1,NULL,0,'2026-10-18 14:26:40','2026-10-18 14:26:40'),(631,'Gửi email báo giá BG-684519','EMAIL','Đã gửi email báo giá tới customer.test@example.com kèm liên kết trực tuyến: /public-quote.html?token=fb69d637bf354fa083120a0a85610dd6\nLời nhắn: Kính gửi quý khách báo giá giải pháp CRM.',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:28:04',0,56,NULL,193,1,NULL,0,'2026-10-18 14:28:04','2026-10-18 14:28:04'),(632,'Khách hàng ĐỒNG Ý báo giá: BG-684519','FEEDBACK','Khách hàng đã CHẤP NHẬN báo giá qua liên kết bảo mật.\nÝ kiến phản hồi: Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:28:04',0,56,NULL,193,1,NULL,0,'2026-10-18 14:28:04','2026-10-18 14:28:04'),(633,'Ký kết hợp đồng: HD-TEST-1792333685067','CONTRACT','Hợp đồng kinh tế HD-TEST-1792333685067 đã được xác lập thành công với giá trị 27075000.00 ₫. Cơ hội tự động chuyển sang Đóng Thắng (WON).',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:28:05',0,56,NULL,193,1,NULL,0,'2026-10-18 14:28:05','2026-10-18 14:28:05'),(634,'Gửi email báo giá BG-685533','EMAIL','Đã gửi email báo giá tới exp@example.com kèm liên kết trực tuyến: /public-quote.html?token=36abaf401c134f2ea209868b865e283f',NULL,NULL,'COMPLETED','MEDIUM','2026-10-18 14:28:05',0,56,NULL,193,1,NULL,0,'2026-10-18 14:28:05','2026-10-18 14:28:05'),(635,'Gửi báo giá giải pháp CRM Enterprise cho khách vào thứ Sáu','TASK','Lời hứa gửi báo giá chi tiết gồm 50 user và chiết khấu 10% trước 17h thứ Sáu','Đã hoàn thành','Khách hàng dời lịch họp để chờ TGĐ phê duyệt','COMPLETED','URGENT','2026-10-26 09:30:00',15,1,NULL,1,7,1,0,'2026-10-18 14:28:24','2026-10-18 14:28:24'),(636,'Tạo cơ hội gia hạn từ HĐ #HD-SAMPLE-EXPIRED-5D','NOTE','Đã khởi tạo cơ hội gia hạn #194 (Gia hạn HD-SAMPLE-EXPIRED-5D - Kế toán phụ trách) từ Hợp đồng #HD-SAMPLE-EXPIRED-5D sắp hết hạn. Ghi chú: Khách hàng có nhu cầu tiếp tục sử dụng dịch vụ năm tới',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,2,NULL,194,1,NULL,0,'2026-10-18 15:19:02','2026-10-18 15:19:02'),(637,'Tạo cơ hội gia hạn từ HĐ #HD-SAMPLE-EXP-7D','NOTE','Đã khởi tạo cơ hội gia hạn #195 (Gia hạn HD-SAMPLE-EXP-7D - Kế toán phụ trách) từ Hợp đồng #HD-SAMPLE-EXP-7D sắp hết hạn. Ghi chú: Khách hàng có nhu cầu tiếp tục sử dụng dịch vụ năm tới',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,4,NULL,195,1,NULL,0,'2026-10-18 15:19:44','2026-10-18 15:19:44'),(638,'Tạo cơ hội gia hạn từ HĐ #HD-TEST-1792333685067','NOTE','Đã khởi tạo cơ hội gia hạn #196 (Gia hạn HD-TEST-1792333685067 - Kế toán phụ trách) từ Hợp đồng #HD-TEST-1792333685067 sắp hết hạn. Ghi chú: Khách hàng có nhu cầu tiếp tục sử dụng dịch vụ năm tới',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,56,NULL,196,1,NULL,0,'2026-10-18 15:20:04','2026-10-18 15:20:04'),(639,'Tạo cơ hội gia hạn từ HĐ #HD-SAMPLE-EXP-15D','NOTE','Đã khởi tạo cơ hội gia hạn #197 (Gia hạn HĐ HD-SAMPLE-EXP-15D - Kế toán phụ trách năm 2027) từ Hợp đồng #HD-SAMPLE-EXP-15D sắp hết hạn. Ghi chú: Khách hàng đồng ý tiếp tục ký hợp đồng gói dịch vụ năm sau',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,5,NULL,197,1,NULL,0,'2026-10-18 15:26:25','2026-10-18 15:26:25'),(640,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Test ly do tu choi lead',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-19 04:24:48','2026-10-19 04:28:32'),(641,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #52 (Sunrise Test Corp) đã được chuyển đổi thành Khách hàng #57 (Cong Ty Test Convert 52), Người liên hệ #201 (Nguyen Van Test), Cơ hội #198 (Co hoi Test Convert).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,57,NULL,198,1,NULL,0,'2026-10-19 04:28:32','2026-10-19 04:28:32'),(642,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai dia ban hoac khong phu hop',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-19 04:47:24','2026-10-19 04:48:09'),(643,'Từ chối nhận lead','SYSTEM','Nhân viên từ chối lead. Lý do: Sai dia ban hoac khong phu hop',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-19 04:47:53','2026-10-19 04:48:09'),(644,'Chuyển đổi thành công từ Lead','SYSTEM','Lead #45 (Công ty TNHH Thời Trang Mai Vy) đã được chuyển đổi thành Khách hàng #58 (Cong Ty Thoi Trang Mai Vy VIP), Người liên hệ #202 (Mai Thi Vy), Cơ hội #199 (Goi thiet ke thoi trang cao cap).',NULL,NULL,'COMPLETED','MEDIUM',NULL,0,58,NULL,199,1,NULL,0,'2026-10-19 04:48:09','2026-10-19 04:48:09'),(645,'G?i l?i ki?m tra ph?n h?i sau b?o gi?','CALL','T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?',NULL,NULL,'OPEN','MEDIUM','2026-10-22 16:15:44',0,1,NULL,1,4,1,0,'2026-10-19 09:15:44','2026-10-19 09:15:44'),(646,'G?i l?i ki?m tra ph?n h?i sau b?o gi?','CALL','T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?',NULL,NULL,'OPEN','MEDIUM','2026-10-22 16:26:05',0,1,NULL,1,4,1,0,'2026-10-19 09:26:05','2026-10-19 09:26:05'),(647,'Email gửi khách: Giới thiệu giải pháp CRM cho VPBank','EMAIL','Đã gửi email giới thiệu giải pháp CRM Enterprise cho anh Nguyễn Tấn Phát (VPBank). Nội dung thư bao gồm giới thiệu bộ tính năng phễu bán hàng, dòng thời gian 360 và tự động hoá thông minh.','Đã gửi qua hệ thống',NULL,'COMPLETED','MEDIUM',NULL,5,1,1,1,4,4,0,'2026-10-19 07:32:42','2026-10-19 09:32:42'),(648,'Email gửi khách: Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','EMAIL','KÃ­nh gá»­i Anh Nguyá»…n Táº¥n PhÃ¡t , bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC .','Đã gửi qua hệ thống',NULL,'COMPLETED','MEDIUM',NULL,0,1,NULL,NULL,4,NULL,0,'2026-10-19 09:54:51','2026-10-19 09:54:51'),(649,'Email gửi khách: Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','EMAIL','KÃ­nh gá»­i Anh Nguyá»…n Táº¥n PhÃ¡t , bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC .','Đã gửi qua hệ thống',NULL,'COMPLETED','MEDIUM',NULL,0,1,NULL,NULL,4,NULL,0,'2026-10-19 09:56:23','2026-10-19 09:56:23'),(650,'Email gửi khách: Giới thiệu giải pháp CRM cho VPBank','EMAIL','Đã gửi email giới thiệu giải pháp CRM Enterprise cho anh Nguyễn Tấn Phát (VPBank). Nội dung thư bao gồm giới thiệu bộ tính năng phễu bán hàng, dòng thời gian 360 và tự động hoá thông minh.','Đã gửi qua hệ thống',NULL,'COMPLETED','MEDIUM',NULL,5,1,1,1,4,4,0,'2026-10-19 07:56:40','2026-10-19 09:56:40'),(651,'Email gửi khách: Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','EMAIL','KÃ­nh gá»­i Anh Nguyá»…n Táº¥n PhÃ¡t , bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC .','Đã gửi qua hệ thống',NULL,'COMPLETED','MEDIUM',NULL,0,1,NULL,NULL,4,NULL,0,'2026-10-19 09:57:02','2026-10-19 09:57:02'),(652,'G?i l?i ki?m tra ph?n h?i sau b?o gi?','CALL','T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?',NULL,NULL,'OPEN','MEDIUM','2026-10-25 07:29:46',0,46,NULL,179,1,1,0,'2026-10-22 00:29:46','2026-10-22 00:29:46'),(653,'G?i l?i ki?m tra ph?n h?i sau b?o gi?','CALL','T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?',NULL,NULL,'OPEN','MEDIUM','2026-10-25 07:29:47',0,46,NULL,177,1,1,0,'2026-10-22 00:29:46','2026-10-22 00:29:46'),(654,'G?i l?i ki?m tra ph?n h?i sau b?o gi?','CALL','T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?',NULL,NULL,'OPEN','MEDIUM','2026-10-25 07:30:07',0,1,NULL,185,1,1,0,'2026-10-22 00:30:06','2026-10-22 00:30:06');
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint DEFAULT NULL,
  `opportunity_id` bigint DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PDF',
  `file_size` bigint NOT NULL DEFAULT '0',
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by_user_id` bigint DEFAULT '1',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attachments_customer_date` (`customer_id`,`created_at` DESC),
  KEY `idx_att_opp` (`opportunity_id`),
  CONSTRAINT `fk_attachments_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
INSERT INTO `attachments` VALUES (1,12,NULL,'Hop_dong_trien_khai_pilot_so_01.pdf','PDF',2541000,'#',1,'Hợp đồng thử nghiệm đã ký kết 2 bên',0,'2026-08-30 11:59:16'),(2,12,NULL,'Bang_chao_gia_CRM_Enterprise_DaiPhat_v2.xlsx','XLSX',485000,'#',1,'Bảng bóc tách chi phí bản quyền và dịch vụ tùy biến',0,'2026-10-04 11:59:16'),(3,12,NULL,'Kien_truc_tich_hop_Tong_dai_CTI_va_ERP.png','PNG',1250000,'#',1,'Sơ đồ luồng dữ liệu kết nối tổng đài ảo',0,'2026-09-27 11:59:16'),(4,12,NULL,'Bien_ban_khao_sat_quy_trinh_ban_si.docx','DOCX',760000,'#',1,'Ghi nhận 12 luồng nghiệp vụ phê duyệt đơn hàng',0,'2026-09-21 11:59:16'),(5,12,NULL,'Ho_so_nang_luc_Dai_Phat_2026.pdf','pdf',3250585,'/uploads/Ho_so_nang_luc_Dai_Phat_2026.pdf',4,NULL,0,'2026-10-08 13:24:52'),(6,13,NULL,'Ho_so_nang_luc_Dai_Phat_2026.pdf','pdf',3250585,'/uploads/Ho_so_nang_luc_Dai_Phat_2026.pdf',4,NULL,0,'2026-10-08 13:39:26'),(7,13,NULL,'Ho_so_nang_luc_Dai_Phat_2026.pdf','pdf',3250585,'/uploads/Ho_so_nang_luc_Dai_Phat_2026.pdf',4,NULL,0,'2026-10-09 02:58:45'),(8,1,1,'Ho_so_thau_CRM_VPBank_v2.pdf','PDF',4521980,'uploads/attachments/Ho_so_thau_CRM_VPBank_v2.pdf',1,'Hồ sơ kỹ thuật và năng lực đấu thầu',0,'2026-10-16 12:16:08'),(9,1,1,'Bien_ban_hop_thuong_thao_hop_dong_VPBank.docx','DOCX',1845200,'uploads/attachments/Bien_ban_hop_thuong_thao_hop_dong_VPBank.docx',2,'Biên bản thống nhất phạm vi triển khai giai đoạn 1',0,'2026-10-17 12:16:08'),(10,2,2,'Bao_gia_CRM_Cloud_NEM_Fashion.pdf','PDF',1240000,'uploads/attachments/Bao_gia_CRM_Cloud_NEM_Fashion.pdf',3,'Báo giá chính thức đã ký duyệt',0,'2026-10-15 12:16:08'),(11,NULL,1,'Ho_so_thau_2026.docx','DOCX',74,'uploads/attachments/1792326693520_a94ceec6_Ho_so_thau_2026.docx',1,NULL,0,'2026-10-18 12:31:33'),(12,NULL,5,'Ho_so_thau_mat_2026.pdf','PDF',79,'uploads/attachments/1792326827223_175c9a8d_Ho_so_thau_mat_2026.pdf',1,'Tài liệu mật chỉ dành cho ban điều hành và người phụ trách cơ hội',0,'2026-10-18 12:33:47'),(13,NULL,5,'Ho_so_thau_mat_2026.pdf','PDF',79,'uploads/attachments/1792326848641_fcd6c1ae_Ho_so_thau_mat_2026.pdf',1,'Tài liệu mật chỉ dành cho ban điều hành và người phụ trách cơ hội',0,'2026-10-18 12:34:08'),(14,NULL,5,'Ho_so_thau_mat_2026.pdf','PDF',79,'uploads/attachments/1792327047747_e8c43bea_Ho_so_thau_mat_2026.pdf',1,'Tài liệu mật chỉ dành cho ban điều hành và người phụ trách cơ hội',0,'2026-10-18 12:37:27');
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actor_user_id` bigint DEFAULT NULL,
  `object_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `object_id` bigint DEFAULT NULL,
  `before_value` longtext COLLATE utf8mb4_unicode_ci,
  `after_value` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'USER','10','UPDATE_USER','Cập nhật thông tin người dùng','2026-10-08 02:21:58',1,'USER',10,'{\"fullName\":\"Trương Tuấn Kiệt\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}','{\"fullName\":\"Trương Tuấn Anh\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}'),(2,1,'USER_PERMISSION','10','ASSIGN_ROLES','Cập nhật role và phạm vi dữ liệu','2026-10-08 02:21:58',1,'USER_PERMISSION',10,'{\"userId\":10,\"roles\":[{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}','{\"userId\":10,\"roles\":[{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}'),(3,1,'USER','10','UPDATE_USER','Cập nhật thông tin người dùng','2026-10-10 07:23:06',1,'USER',10,'{\"fullName\":\"Trương Tuấn Anh\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}','{\"fullName\":\"Trương Tuấn Anh\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}'),(4,1,'USER_PERMISSION','10','ASSIGN_ROLES','Cập nhật role và phạm vi dữ liệu','2026-10-10 07:23:06',1,'USER_PERMISSION',10,'{\"userId\":10,\"roles\":[{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.delete\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}','{\"userId\":10,\"roles\":[{\"id\":7,\"code\":\"MARKETING\",\"name\":\"Nhân viên Marketing\"},{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.manage\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.delete\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.assign\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}'),(5,1,'USER_ROLE','10','UPDATE_ROLE','Cập nhật vai trò người dùng (Trương Tuấn Anh)','2026-10-10 07:23:06',1,'USER_ROLE',10,'Nhân viên kinh doanh','Nhân viên Marketing, Nhân viên kinh doanh'),(6,1,'USER','10','UPDATE_USER','Cập nhật thông tin người dùng','2026-10-10 07:23:11',1,'USER',10,'{\"fullName\":\"Trương Tuấn Anh\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}','{\"fullName\":\"Trương Tuấn Anh\",\"email\":\"sale.hcm2@crm.local\",\"status\":\"ACTIVE\"}'),(7,1,'USER_PERMISSION','10','ASSIGN_ROLES','Cập nhật role và phạm vi dữ liệu','2026-10-10 07:23:12',1,'USER_PERMISSION',10,'{\"userId\":10,\"roles\":[{\"id\":7,\"code\":\"MARKETING\",\"name\":\"Nhân viên Marketing\"},{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.manage\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.delete\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.assign\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}','{\"userId\":10,\"roles\":[{\"id\":6,\"code\":\"SALES_REP\",\"name\":\"Nhân viên kinh doanh\"}],\"dataScope\":\"SELF\",\"permissions\":[\"activity.create\",\"activity.export\",\"activity.read\",\"activity.update\",\"automation.read\",\"competitor.read\",\"contact.create\",\"contact.delete\",\"contact.read\",\"contact.update\",\"contract.read\",\"customer.create\",\"customer.delete\",\"customer.export\",\"customer.read\",\"customer.update\",\"customfield.read\",\"dashboard.read\",\"kpi.read\",\"lead.create\",\"lead.read\",\"lead.update\",\"masterdata.read\",\"notification.read\",\"opportunity.close\",\"opportunity.create\",\"opportunity.export\",\"opportunity.read\",\"opportunity.update\",\"organization.read\",\"pipeline.read\",\"pricebook.read\",\"product.read\",\"quote.create\",\"quote.export\",\"quote.read\",\"quote.update\",\"report.read\",\"task.create\",\"task.read\",\"task.update\",\"winloss.read\"]}'),(8,1,'USER_ROLE','10','UPDATE_ROLE','Cập nhật vai trò người dùng (Trương Tuấn Anh)','2026-10-10 07:23:12',1,'USER_ROLE',10,'Nhân viên Marketing, Nhân viên kinh doanh','Nhân viên kinh doanh'),(9,1,'OPPORTUNITY','185','STAGE_OVERRIDE','Ghi đè điều kiện rời giai đoạn \'Mới tiếp cận\'. Lý do: KhÃ¡ch hÃ ng Ä‘Ã£ trao Ä‘á»•i trá»±c tiáº¿p vÃ  xÃ¡c nháº­n Ä‘áº§y Ä‘á»§ qua hotline, TrÆ°á»Ÿng nhÃ³m duyá»‡t chuyá»ƒn giai Ä‘oáº¡n.','2026-10-14 16:40:09',1,'OPPORTUNITY',185,NULL,NULL),(10,1,'OPPORTUNITY','186','CLOSE_WON','Đóng cơ hội với kết quả WON, giá trị chốt: 1.25E+8 đ, ngày ký: 2026-10-15','2026-10-15 00:42:08',1,'OPPORTUNITY',186,NULL,NULL),(11,1,'OPPORTUNITY','187','CLOSE_WON','Đóng cơ hội với kết quả WON, giá trị chốt: 1.25E+8 đ, ngày ký: 2026-10-15','2026-10-15 00:42:33',1,'OPPORTUNITY',187,NULL,NULL),(12,1,'OPPORTUNITY','187','REOPEN','Mở lại cơ hội đã đóng (WON). Lý do: KhÃ¡ch hÃ ng yÃªu cáº§u thÆ°Æ¡ng tháº£o bá»• sung thÃªm 2 module nÃ¢ng cao','2026-10-15 00:42:33',1,'OPPORTUNITY',187,NULL,NULL),(13,1,'OPPORTUNITY','188','CLOSE_WON','Đóng cơ hội với kết quả WON, giá trị chốt: 1.25E+8 đ, ngày ký: 2026-10-15','2026-10-15 00:43:01',1,'OPPORTUNITY',188,NULL,NULL),(14,1,'OPPORTUNITY','188','REOPEN','Mở lại cơ hội đã đóng (WON). Lý do: KhÃ¡ch hÃ ng yÃªu cáº§u thÆ°Æ¡ng tháº£o bá»• sung thÃªm 2 module nÃ¢ng cao','2026-10-15 00:43:01',1,'OPPORTUNITY',188,NULL,NULL),(15,1,'OPPORTUNITY','189','CLOSE_WON','Đóng cơ hội với kết quả WON, giá trị chốt: 1.25E+8 đ, ngày ký: 2026-10-15','2026-10-15 00:43:58',1,'OPPORTUNITY',189,NULL,NULL),(16,1,'OPPORTUNITY','189','REOPEN','Mở lại cơ hội đã đóng (WON). Lý do: KhÃ¡ch hÃ ng yÃªu cáº§u thÆ°Æ¡ng tháº£o bá»• sung thÃªm 2 module nÃ¢ng cao','2026-10-15 00:43:58',1,'OPPORTUNITY',189,NULL,NULL),(17,3,'OPPORTUNITY','152','REASSIGN','Chuyển cơ hội \'Dự án Tổng đài Cloud CallCenter 50 Agents\' từ Lê Hoàng Nam sang Phạm Mai Phương. Lý do: Nhân viên quá tải số lượng cơ hội (Cân bằng khối lượng công việc)','2026-10-17 06:59:19',3,'OPPORTUNITY',152,'4','5'),(18,3,'OPPORTUNITY','1','REASSIGN','Chuyển cơ hội \'Triển khai CRM Enterprise cho VPBank Thăng Long\' từ Lê Hoàng Nam sang Phạm Mai Phương. Lý do: Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày','2026-10-17 07:00:32',3,'OPPORTUNITY',1,'4','5'),(19,3,'OPPORTUNITY','151','REASSIGN','Chuyển cơ hội \'Hợp đồng Nâng cấp Băng thông Quốc tế & VPN\' từ Lê Hoàng Nam sang Phạm Mai Phương. Lý do: Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày','2026-10-17 07:00:32',3,'OPPORTUNITY',151,'4','5'),(20,1,'OPPORTUNITY','1','ADD_MEMBER','Thêm thành viên ID 7 vào cơ hội với vai trò: Chuyên viên Tư vấn Giải pháp','2026-10-18 11:42:41',1,'OPPORTUNITY',1,NULL,NULL),(21,1,'OPPORTUNITY','1','REMOVE_MEMBER','Xóa thành viên ID 7 khỏi đội ngũ cơ hội','2026-10-18 11:42:41',1,'OPPORTUNITY',1,NULL,NULL),(22,1,'OPPORTUNITY','1','ADD_MEMBER','Thêm thành viên ID 7 vào cơ hội với vai trò: Chuyên viên Tư vấn Giải pháp','2026-10-18 11:43:22',1,'OPPORTUNITY',1,NULL,NULL),(23,1,'OPPORTUNITY','1','REMOVE_MEMBER','Xóa thành viên ID 7 khỏi đội ngũ cơ hội','2026-10-18 11:43:22',1,'OPPORTUNITY',1,NULL,NULL),(24,1,'OPPORTUNITY','1','ADD_MEMBER','Thêm thành viên ID 7 vào cơ hội với vai trò: Chuyên viên Tư vấn Giải pháp','2026-10-18 11:43:51',1,'OPPORTUNITY',1,NULL,NULL),(25,1,'OPPORTUNITY','1','REMOVE_MEMBER','Xóa thành viên ID 7 khỏi đội ngũ cơ hội','2026-10-18 11:43:52',1,'OPPORTUNITY',1,NULL,NULL),(26,1,'OPPORTUNITY','1','ADD_MEMBER','Thêm thành viên ID 7 vào cơ hội với vai trò: Chuyên viên Tư vấn Giải pháp','2026-10-18 11:44:37',1,'OPPORTUNITY',1,NULL,NULL),(27,1,'OPPORTUNITY','1','REMOVE_MEMBER','Xóa thành viên ID 7 khỏi đội ngũ cơ hội','2026-10-18 11:44:37',1,'OPPORTUNITY',1,NULL,NULL),(28,4,'QUOTE','QUOTE-8','CREATE_QUOTE','Lưu báo giá: tổng tiền 45125000.00, chiết khấu tổng 9.75% [Cấp duyệt: NONE]','2026-10-18 13:51:27',4,'QUOTE',0,NULL,'DRAFT'),(29,4,'QUOTE','QUOTE-9','CREATE_QUOTE','Lưu báo giá: tổng tiền 23000000.00, chiết khấu tổng 8.00% [Cấp duyệt: NONE]','2026-10-18 13:51:27',4,'QUOTE',0,NULL,'APPROVED'),(30,4,'QUOTE','QUOTE-10','CREATE_QUOTE','Lưu báo giá: tổng tiền 21250000.00, chiết khấu tổng 15.00% [Cấp duyệt: TEAM_LEAD]','2026-10-18 13:51:27',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(31,4,'QUOTE','QUOTE-11','CREATE_QUOTE','Lưu báo giá: tổng tiền 18750000.00, chiết khấu tổng 25.00% [Cấp duyệt: DIRECTOR]','2026-10-18 13:51:27',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(32,4,'QUOTE','QUOTE-12','CREATE_QUOTE','Lưu báo giá: tổng tiền 19950000.00, chiết khấu tổng 0.00% [Cấp duyệt: DIRECTOR]','2026-10-18 13:51:27',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(33,1,'QUOTE_APPROVAL','BG-487617','REQUEST_CHANGES_QUOTE','Yêu cầu sửa lại báo giá BG-487617. Ý kiến: Vui lòng hạ bớt chiết khấu xuống dưới 20%','2026-10-18 13:51:28',1,'QUOTE_APPROVAL',0,'PENDING_APPROVAL','CHANGES_REQUESTED'),(34,1,'QUOTE_APPROVAL','BG-487617','APPROVE_QUOTE','Duyệt báo giá BG-487617: Giám đốc đã đồng ý phê duyệt đặc cách','2026-10-18 13:51:28',1,'QUOTE_APPROVAL',0,'CHANGES_REQUESTED','APPROVED'),(35,1,'QUOTE','BG-487617','SEND_QUOTE_CUSTOMER','Gửi báo giá BG-487617 cho khách hàng.','2026-10-18 13:51:28',1,'QUOTE',0,'APPROVED','SENT'),(36,1,'QUOTE_VERSION','BG-487617','CLONE_VERSION','Tạo phiên bản mới từ báo giá BG-487617','2026-10-18 13:51:28',1,'QUOTE_VERSION',0,NULL,'DRAFT'),(37,4,'QUOTE','QUOTE-14','CREATE_QUOTE','Lưu báo giá: tổng tiền 45125000.00, chiết khấu tổng 10.38% [Cấp duyệt: DIRECTOR]','2026-10-18 14:00:35',4,'QUOTE',0,NULL,'DRAFT'),(38,4,'QUOTE','QUOTE-14','UPDATE_QUOTE','Lưu báo giá: tổng tiền 67687500.00, chiết khấu tổng 10.17% [Cấp duyệt: DIRECTOR]','2026-10-18 14:00:35',4,'QUOTE',0,NULL,'DRAFT'),(39,4,'QUOTE','QUOTE-15','CREATE_QUOTE','Lưu báo giá: tổng tiền 23250000.00, chiết khấu tổng 7.00% [Cấp duyệt: NONE]','2026-10-18 14:00:35',4,'QUOTE',0,NULL,'APPROVED'),(40,4,'QUOTE','QUOTE-16','CREATE_QUOTE','Lưu báo giá: tổng tiền 21000000.00, chiết khấu tổng 16.00% [Cấp duyệt: TEAM_LEAD]','2026-10-18 14:00:35',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(41,4,'QUOTE','QUOTE-17','CREATE_QUOTE','Lưu báo giá: tổng tiền 18750000.00, chiết khấu tổng 25.00% [Cấp duyệt: DIRECTOR]','2026-10-18 14:00:35',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(42,4,'QUOTE','QUOTE-18','CREATE_QUOTE','Lưu báo giá: tổng tiền 19000000.00, chiết khấu tổng 0.00% [Cấp duyệt: DIRECTOR]','2026-10-18 14:00:36',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(43,1,'QUOTE_APPROVAL','BG-35894','REQUEST_CHANGES_QUOTE','Yêu cầu sửa lại báo giá BG-35894. Ý kiến: Mức chiết khấu 25% quá cao, đề nghị giảm xuống dưới 18% để đảm bảo biên lợi nhuận.','2026-10-18 14:00:36',1,'QUOTE_APPROVAL',0,'PENDING_APPROVAL','CHANGES_REQUESTED'),(44,1,'QUOTE_APPROVAL','BG-35894','APPROVE_QUOTE','Duyệt báo giá BG-35894: Giám đốc đồng ý phê duyệt đặc cách theo cam kết doanh số quý 4.','2026-10-18 14:00:36',1,'QUOTE_APPROVAL',0,'CHANGES_REQUESTED','APPROVED'),(45,1,'QUOTE','BG-35894','SEND_QUOTE_CUSTOMER','Gửi báo giá BG-35894 cho khách hàng.','2026-10-18 14:00:36',1,'QUOTE',0,'APPROVED','SENT'),(46,1,'QUOTE_VERSION','BG-35894','CLONE_VERSION','Tạo phiên bản mới từ báo giá BG-35894','2026-10-18 14:00:36',1,'QUOTE_VERSION',0,NULL,'DRAFT'),(47,1,'QUOTE','QUOTE-19','UPDATE_QUOTE','Lưu báo giá: tổng tiền 38950000.00, chiết khấu tổng 22.10% [Cấp duyệt: DIRECTOR]','2026-10-18 14:00:37',1,'QUOTE',0,NULL,'DRAFT'),(48,1,'QUOTE_VERSION','BG-35894-V2','SET_ACTIVE_VERSION','Kích hoạt phiên bản 2 làm hiệu lực duy nhất.','2026-10-18 14:00:37',1,'QUOTE_VERSION',0,NULL,'ACTIVE'),(49,4,'QUOTE','QUOTE-20','CREATE_QUOTE','Lưu báo giá: tổng tiền 45125000.00, chiết khấu tổng 10.38% [Cấp duyệt: DIRECTOR]','2026-10-18 14:01:41',4,'QUOTE',0,NULL,'DRAFT'),(50,4,'QUOTE','QUOTE-20','UPDATE_QUOTE','Lưu báo giá: tổng tiền 67687500.00, chiết khấu tổng 10.17% [Cấp duyệt: DIRECTOR]','2026-10-18 14:01:41',4,'QUOTE',0,NULL,'DRAFT'),(51,4,'QUOTE','QUOTE-21','CREATE_QUOTE','Lưu báo giá: tổng tiền 23250000.00, chiết khấu tổng 7.00% [Cấp duyệt: NONE]','2026-10-18 14:01:41',4,'QUOTE',0,NULL,'APPROVED'),(52,4,'QUOTE','QUOTE-22','CREATE_QUOTE','Lưu báo giá: tổng tiền 21000000.00, chiết khấu tổng 16.00% [Cấp duyệt: TEAM_LEAD]','2026-10-18 14:01:42',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(53,4,'QUOTE','QUOTE-23','CREATE_QUOTE','Lưu báo giá: tổng tiền 18750000.00, chiết khấu tổng 25.00% [Cấp duyệt: DIRECTOR]','2026-10-18 14:01:42',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(54,4,'QUOTE','QUOTE-24','CREATE_QUOTE','Lưu báo giá: tổng tiền 19000000.00, chiết khấu tổng 0.00% [Cấp duyệt: DIRECTOR]','2026-10-18 14:01:42',4,'QUOTE',0,NULL,'PENDING_APPROVAL'),(55,1,'QUOTE_APPROVAL','BG-102179','REQUEST_CHANGES_QUOTE','Yêu cầu sửa lại báo giá BG-102179. Ý kiến: Mức chiết khấu 25% quá cao, đề nghị giảm xuống dưới 18% để đảm bảo biên lợi nhuận.','2026-10-18 14:01:42',1,'QUOTE_APPROVAL',0,'PENDING_APPROVAL','CHANGES_REQUESTED'),(56,1,'QUOTE_APPROVAL','BG-102179','APPROVE_QUOTE','Duyệt báo giá BG-102179: Giám đốc đồng ý phê duyệt đặc cách theo cam kết doanh số quý 4.','2026-10-18 14:01:42',1,'QUOTE_APPROVAL',0,'CHANGES_REQUESTED','APPROVED'),(57,1,'QUOTE','BG-102179','SEND_QUOTE_CUSTOMER','Gửi báo giá BG-102179 cho khách hàng.','2026-10-18 14:01:43',1,'QUOTE',0,'APPROVED','SENT'),(58,1,'QUOTE_VERSION','BG-102179','CLONE_VERSION','Tạo phiên bản mới từ báo giá BG-102179','2026-10-18 14:01:43',1,'QUOTE_VERSION',0,NULL,'DRAFT'),(59,1,'QUOTE','QUOTE-25','UPDATE_QUOTE','Lưu báo giá: tổng tiền 38950000.00, chiết khấu tổng 22.10% [Cấp duyệt: DIRECTOR]','2026-10-18 14:01:43',1,'QUOTE',0,NULL,'DRAFT'),(60,1,'QUOTE_VERSION','BG-102179-V2','SET_ACTIVE_VERSION','Kích hoạt phiên bản 2 làm hiệu lực duy nhất.','2026-10-18 14:01:43',1,'QUOTE_VERSION',0,NULL,'ACTIVE'),(61,1,'QUOTE','QUOTE-26','CREATE_QUOTE','Lưu báo giá: tổng tiền 27075000.00, chiết khấu tổng 9.75% [Cấp duyệt: NONE]','2026-10-18 14:25:16',1,'QUOTE',0,NULL,'APPROVED'),(62,1,'QUOTE','QUOTE-27','CREATE_QUOTE','Lưu báo giá: tổng tiền 27075000.00, chiết khấu tổng 9.75% [Cấp duyệt: NONE]','2026-10-18 14:26:40',1,'QUOTE',0,NULL,'APPROVED'),(63,1,'QUOTE','BG-600046','SEND_QUOTE_EMAIL','Gửi email báo giá kèm liên kết trực tuyến tới customer.test@example.com','2026-10-18 14:26:40',1,'QUOTE',0,'APPROVED','SENT'),(64,1,'QUOTE_FEEDBACK','BG-600046','CUSTOMER_ACCEPT','Khách hàng ĐỒNG Ý báo giá: BG-600046. Khách hàng đã CHẤP NHẬN báo giá qua liên kết bảo mật.\nÝ kiến phản hồi: Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!','2026-10-18 14:26:40',1,'QUOTE_FEEDBACK',0,'SENT','ACCEPTED'),(65,1,'QUOTE','QUOTE-28','CREATE_QUOTE','Lưu báo giá: tổng tiền 27075000.00, chiết khấu tổng 9.75% [Cấp duyệt: NONE]','2026-10-18 14:28:04',1,'QUOTE',0,NULL,'APPROVED'),(66,1,'QUOTE','BG-684519','SEND_QUOTE_EMAIL','Gửi email báo giá kèm liên kết trực tuyến tới customer.test@example.com','2026-10-18 14:28:04',1,'QUOTE',0,'APPROVED','SENT'),(67,1,'QUOTE_FEEDBACK','BG-684519','CUSTOMER_ACCEPT','Khách hàng ĐỒNG Ý báo giá: BG-684519. Khách hàng đã CHẤP NHẬN báo giá qua liên kết bảo mật.\nÝ kiến phản hồi: Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!','2026-10-18 14:28:05',1,'QUOTE_FEEDBACK',0,'SENT','ACCEPTED'),(68,1,'CONTRACT','HD-TEST-1792333685067','CREATE_CONTRACT_FROM_QUOTE','Chuyển báo giá BG-684519 thành hợp đồng HD-TEST-1792333685067. Giá trị: 27075000.00 ₫. Cơ hội chuyển sang Đóng thắng (WON).','2026-10-18 14:28:05',1,'CONTRACT',0,NULL,'ACTIVE'),(69,1,'QUOTE','QUOTE-29','CREATE_QUOTE','Lưu báo giá: tổng tiền 28500000.00, chiết khấu tổng 5.00% [Cấp duyệt: NONE]','2026-10-18 14:28:05',1,'QUOTE',0,NULL,'APPROVED'),(70,1,'QUOTE','BG-685533','SEND_QUOTE_EMAIL','Gửi email báo giá kèm liên kết trực tuyến tới exp@example.com','2026-10-18 14:28:05',1,'QUOTE',0,'EXPIRED','SENT'),(71,1,'CONTRACT','HD-SAMPLE-EXPIRED-5D','RENEWAL_OPPORTUNITY_CREATED','Đã tạo cơ hội gia hạn #194 (Gia hạn HD-SAMPLE-EXPIRED-5D - Kế toán phụ trách) từ hợp đồng #HD-SAMPLE-EXPIRED-5D','2026-10-18 15:19:02',1,'CONTRACT',0,NULL,'RENEWED'),(72,1,'SALES_TARGET','34','CREATE_SALES_TARGET','Khai báo chỉ tiêu doanh số: 3.2E+8 ₫ cho kỳ Tháng 12/2026','2026-10-18 15:19:03',1,'SALES_TARGET',34,NULL,'3.2E+8'),(73,1,'CONTRACT','HD-SAMPLE-EXP-7D','RENEWAL_OPPORTUNITY_CREATED','Đã tạo cơ hội gia hạn #195 (Gia hạn HD-SAMPLE-EXP-7D - Kế toán phụ trách) từ hợp đồng #HD-SAMPLE-EXP-7D','2026-10-18 15:19:44',1,'CONTRACT',0,NULL,'RENEWED'),(74,1,'SALES_TARGET','34','CREATE_SALES_TARGET','Khai báo chỉ tiêu doanh số: 3.2E+8 ₫ cho kỳ Tháng 12/2026','2026-10-18 15:19:44',1,'SALES_TARGET',34,NULL,'3.2E+8'),(75,1,'CONTRACT','HD-TEST-1792333685067','RENEWAL_OPPORTUNITY_CREATED','Đã tạo cơ hội gia hạn #196 (Gia hạn HD-TEST-1792333685067 - Kế toán phụ trách) từ hợp đồng #HD-TEST-1792333685067','2026-10-18 15:20:04',1,'CONTRACT',0,NULL,'RENEWED'),(76,1,'SALES_TARGET','34','CREATE_SALES_TARGET','Khai báo chỉ tiêu doanh số: 3.2E+8 ₫ cho kỳ Tháng 12/2026','2026-10-18 15:20:05',1,'SALES_TARGET',34,NULL,'3.2E+8'),(77,1,'SALES_TARGET','34','DELETE_SALES_TARGET','Xóa chỉ tiêu doanh số #34','2026-10-18 15:20:05',1,'SALES_TARGET',34,NULL,'DELETED'),(78,1,'CONTRACT_SETTINGS','expiring_threshold_days','UPDATE_SETTINGS','Cập nhật ngưỡng cảnh báo hợp đồng sắp hết hạn thành 45 ngày.','2026-10-18 15:26:24',1,'CONTRACT_SETTINGS',0,NULL,'45'),(79,1,'CONTRACT_SETTINGS','expiring_threshold_days','UPDATE_SETTINGS','Cập nhật ngưỡng cảnh báo hợp đồng sắp hết hạn thành 30 ngày.','2026-10-18 15:26:25',1,'CONTRACT_SETTINGS',0,NULL,'30'),(80,1,'CONTRACT','HD-SAMPLE-EXP-15D','RENEWAL_OPPORTUNITY_CREATED','Đã tạo cơ hội gia hạn #197 (Gia hạn HĐ HD-SAMPLE-EXP-15D - Kế toán phụ trách năm 2027) từ hợp đồng #HD-SAMPLE-EXP-15D','2026-10-18 15:26:25',1,'CONTRACT',0,NULL,'RENEWED'),(81,1,'SALES_TARGET','35','CREATE_SALES_TARGET','Khai báo chỉ tiêu doanh số: 3.5E+8 ₫ cho kỳ Tháng 12/2026','2026-10-18 15:26:25',1,'SALES_TARGET',35,NULL,'3.5E+8'),(82,1,'SALES_TARGET','35','DELETE_SALES_TARGET','Xóa chỉ tiêu doanh số #35','2026-10-18 15:26:25',1,'SALES_TARGET',35,NULL,'DELETED');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_logs_sync_bi` BEFORE INSERT ON `audit_logs` FOR EACH ROW BEGIN
    IF NEW.user_id IS NOT NULL AND NEW.actor_user_id IS NULL THEN
        SET NEW.actor_user_id = NEW.user_id;
    ELSEIF NEW.actor_user_id IS NOT NULL AND NEW.user_id IS NULL THEN
        SET NEW.user_id = NEW.actor_user_id;
    END IF;

    IF NEW.entity_type IS NOT NULL AND NEW.object_type IS NULL THEN
        SET NEW.object_type = NEW.entity_type;
    ELSEIF NEW.object_type IS NOT NULL AND NEW.entity_type IS NULL THEN
        SET NEW.entity_type = NEW.object_type;
    END IF;

    IF NEW.entity_id IS NOT NULL AND NEW.object_id IS NULL THEN
        BEGIN
            DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
            SET NEW.object_id = CAST(NEW.entity_id AS UNSIGNED);
        END;
    ELSEIF NEW.object_id IS NOT NULL AND NEW.entity_id IS NULL THEN
        SET NEW.entity_id = CAST(NEW.object_id AS CHAR);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `automation_logs`
--

DROP TABLE IF EXISTS `automation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rule_id` bigint NOT NULL,
  `rule_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_event` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint NOT NULL,
  `entity_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_summary` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'SUCCESS',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auto_logs_rule` (`rule_id`),
  KEY `idx_auto_logs_date` (`executed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_logs`
--

LOCK TABLES `automation_logs` WRITE;
/*!40000 ALTER TABLE `automation_logs` DISABLE KEYS */;
INSERT INTO `automation_logs` VALUES (1,1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','STAGE_CHANGED','OPPORTUNITY',1,'Co hoi nang cap he thong ERP Vingroup','CREATE_TASK','Đã tự động tạo công việc \'G?i l?i ki?m tra ph?n h?i sau b?o gi?\' (hạn sau 3 ngày) giao cho nhân sự phụ trách','SUCCESS',NULL,'2026-10-19 09:15:44'),(2,1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','STAGE_CHANGED','OPPORTUNITY',1,'Co hoi nang cap he thong ERP Vingroup','CREATE_TASK','Đã tự động tạo công việc \'G?i l?i ki?m tra ph?n h?i sau b?o gi?\' (hạn sau 3 ngày) giao cho nhân sự phụ trách','SUCCESS',NULL,'2026-10-19 09:26:05'),(3,1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','STAGE_CHANGED','OPPORTUNITY',179,'Cơ hội nâng cấp hệ thống ERP 2026','CREATE_TASK','Đã tự động tạo công việc \'G?i l?i ki?m tra ph?n h?i sau b?o gi?\' (hạn sau 3 ngày) giao cho nhân sự phụ trách','SUCCESS',NULL,'2026-10-22 00:29:46'),(4,1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','STAGE_CHANGED','OPPORTUNITY',177,'Cơ hội nâng cấp hệ thống ERP 2026','CREATE_TASK','Đã tự động tạo công việc \'G?i l?i ki?m tra ph?n h?i sau b?o gi?\' (hạn sau 3 ngày) giao cho nhân sự phụ trách','SUCCESS',NULL,'2026-10-22 00:29:46'),(5,2,'Th?ng b?o khi c? h?i b??c v?o Th??ng l??ng','STAGE_CHANGED','OPPORTUNITY',198,'Co hoi Test Convert','SEND_NOTIFICATION','Đã gửi thông báo trong ứng dụng cho người phụ trách: C? h?i b??c v?o giai ?o?n Th??ng l??ng','SUCCESS',NULL,'2026-10-22 00:29:51'),(6,1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','STAGE_CHANGED','OPPORTUNITY',185,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao','CREATE_TASK','Đã tự động tạo công việc \'G?i l?i ki?m tra ph?n h?i sau b?o gi?\' (hạn sau 3 ngày) giao cho nhân sự phụ trách','SUCCESS',NULL,'2026-10-22 00:30:06');
/*!40000 ALTER TABLE `automation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automation_rules`
--

DROP TABLE IF EXISTS `automation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `trigger_event` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_entity` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition_field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition_operator` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'EQUALS',
  `condition_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_params` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_rules`
--

LOCK TABLES `automation_rules` WRITE;
/*!40000 ALTER TABLE `automation_rules` DISABLE KEYS */;
INSERT INTO `automation_rules` VALUES (1,'Nh?c g?i l?i sau 3 ng?y g?i b?o gi?','Khi c? h?i chuy?n sang giai ?o?n B?o gi? th? t? ??ng t?o c?ng vi?c nh?c nh?n vi?n g?i l?i sau 3 ng?y','STAGE_CHANGED','OPPORTUNITY','stage_id','EQUALS','3','CREATE_TASK','{\"subject\":\"G?i l?i ki?m tra ph?n h?i sau b?o gi?\",\"type\":\"CALL\",\"dueDays\":3,\"description\":\"T? ??ng t?o b?i quy t?c Khi-Th? khi c? h?i v?o giai ?o?n B?o gi?\"}',1,1,'2026-10-19 08:59:47','2026-10-19 09:26:05'),(2,'Th?ng b?o khi c? h?i b??c v?o Th??ng l??ng','Khi c? h?i chuy?n sang giai ?o?n Th??ng l??ng th? g?i th?ng b?o ch?c m?ng v? nh?c nh? ?i?u kho?n','STAGE_CHANGED','OPPORTUNITY','stage_id','EQUALS','4','SEND_NOTIFICATION','{\"title\":\"C? h?i b??c v?o giai ?o?n Th??ng l??ng\",\"content\":\"C? h?i ?? ??t 80% x?c su?t th?ng, h?y chu?n b? k? c?c ?i?u kho?n ch?t h?p ??ng\"}',1,1,'2026-10-19 08:59:47','2026-10-19 08:59:47'),(3,'T? ??ng t?o l?ch ch?m s?c khi c? h?i b? ??nh tr?','Khi c? h?i b? g?n c? ??nh tr? th? t? ??ng t?o c?ng vi?c r? so?t v? k?ch ho?t l?i deal','STAGNANT_FLAGGED','OPPORTUNITY','is_stagnant','EQUALS','1','CREATE_TASK','{\"subject\":\"C? h?i b? ??nh tr?: L?n ph??ng ?n t?i ti?p c?n\",\"type\":\"MEETING\",\"dueDays\":2,\"description\":\"T? ??ng k?ch ho?t khi ph?t hi?n c? h?i kh?ng c? t??ng t?c qu? th?i gian quy ??nh\"}',1,1,'2026-10-19 08:59:47','2026-10-19 08:59:47');
/*!40000 ALTER TABLE `automation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOI_THAO',
  `budget` decimal(15,2) NOT NULL DEFAULT '0.00',
  `expected_revenue` decimal(15,2) DEFAULT '0.00',
  `actual_cost` decimal(15,2) DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `owner_user_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_campaign_owner` (`owner_user_id`),
  CONSTRAINT `fk_campaign_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES (1,'CAMP-VIETBUILD-2026','Hội thảo & Triển lãm Ngành Xây dựng VietBuild 2026','HOI_THAO',50000000.00,350000000.00,48500000.00,'2026-10-01','2026-10-31','ACTIVE','Thu thập thông tin khách hàng B2B ngành xây dựng và thiết bị tại triển lãm',1,'2026-10-14 12:13:28','2026-10-14 15:27:22'),(2,'CAMP-FB-B2B-Q4','Chiến dịch Quảng cáo Facebook Lead Ads B2B Quý 4','FACEBOOK',35000000.00,200000000.00,31200000.00,'2026-10-05','2026-11-20','ACTIVE','Quảng cáo form lead trên Facebook nhắm đối tượng chủ doanh nghiệp SME',1,'2026-10-14 12:13:28','2026-10-14 15:27:22'),(3,'CAMP-GOOGLE-SEARCH','Google Search Ads - Giải pháp Phần mềm Quản trị CRM Doanh nghiệp','GOOGLE_ADS',45000000.00,400000000.00,42000000.00,'2026-09-15','2026-12-31','ACTIVE','Chạy từ khóa tìm kiếm Google nhu cầu mua phần mềm CRM',1,'2026-10-14 12:13:28','2026-10-14 15:27:22'),(4,'CAMP-EMAIL-REACTIVATE','Email Marketing Nuôi dưỡng & Kích hoạt lại Khách hàng Cũ','EMAIL',10000000.00,120000000.00,8500000.00,'2026-10-10','2026-11-10','ACTIVE','Gửi chuỗi email chăm sóc và ưu đãi nâng cấp bản quyền phần mềm',1,'2026-10-14 12:13:28','2026-10-14 15:27:22');
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competitors`
--

DROP TABLE IF EXISTS `competitors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competitors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competitors`
--

LOCK TABLES `competitors` WRITE;
/*!40000 ALTER TABLE `competitors` DISABLE KEYS */;
INSERT INTO `competitors` VALUES (1,'Tập đoàn Công nghệ AlphaTech','Mạnh về giải pháp On-Premise và quan hệ đối tác truyền thống',1,'2026-10-19 07:50:14'),(2,'Công ty Cổ phần Giải pháp Số VinaCloud','Cạnh tranh mạnh về chi phí và hạ tầng điện toán đám mây nội địa',1,'2026-10-19 07:50:14'),(3,'NextGen Software Solution','Đối thủ mới gia nhập thị trường với nhiều tính năng AI hiện đại',1,'2026-10-19 07:50:14'),(4,'FastERP Global System','Mạnh về hệ sinh thái ERP tích hợp toàn diện',1,'2026-10-19 07:50:14');
/*!40000 ALTER TABLE `competitors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_company_history`
--

DROP TABLE IF EXISTS `contact_company_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_company_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contact_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  `job_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cch_contact` (`contact_id`),
  KEY `fk_cch_customer` (`customer_id`),
  CONSTRAINT `fk_cch_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cch_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_company_history`
--

LOCK TABLES `contact_company_history` WRITE;
/*!40000 ALTER TABLE `contact_company_history` DISABLE KEYS */;
INSERT INTO `contact_company_history` VALUES (1,7,11,'Kỹ sư Giải pháp IT','2023-01-15','2025-12-31','Đã chuyển công tác sang Công ty CP Công nghệ ABC từ đầu năm 2026. Lịch sử tương tác và ghi chú cũ được lưu giữ nguyên vẹn.','2026-10-09 11:38:28');
/*!40000 ALTER TABLE `contact_company_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` bigint NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buying_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFLUENCER',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `owner_user_id` bigint DEFAULT '1',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_contacts_customer` (`customer_id`),
  KEY `idx_contacts_phone` (`phone`),
  CONSTRAINT `fk_contacts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_contacts_buying_role` CHECK ((`buying_role` in (_utf8mb4'DECISION_MAKER',_utf8mb4'INFLUENCER',_utf8mb4'END_USER',_utf8mb4'BLOCKER')))
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,12,'Nguyễn Văn Phát','Tổng Giám Đốc','phat.nv@daiphat-elec.vn','0944556677','DECISION_MAKER',1,'Người ký hợp đồng và duyệt ngân sách cuối cùng, quan tâm ROI và tiến độ triển khai.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(2,12,'Trần Thị Thu Hương','Giám đốc CNTT & Chuyển đổi số','huong.tt@daiphat-elec.vn','0912334455','INFLUENCER',0,'Đánh giá kỹ thuật, kiến trúc tích hợp hệ thống ERP và bảo mật dữ liệu.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(3,12,'Lê Hoàng Long','Trưởng phòng Kinh doanh B2B','long.lh@daiphat-elec.vn','0933221100','END_USER',0,'Đội ngũ trực tiếp sử dụng CRM hàng ngày, cần giao diện dễ dùng và app mobile mượt mà.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(4,12,'Phạm Quốc Cường','Kế toán trưởng / Giám đốc Tài chính','cuong.pq@daiphat-elec.vn','0908776655','BLOCKER',0,'Lo ngại vượt định mức ngân sách quý 4, yêu cầu đàm phán chính sách chiết khấu và thanh toán linh hoạt.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(5,1,'Đỗ Minh Tuấn','Giám đốc Điều hành (CEO)','tuan.dm@abc-tech.vn','0912345678','DECISION_MAKER',1,'Quyết định chốt giải pháp tổng thể.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(6,1,'Nguyễn Hải Yến','Trưởng phòng Mua hàng','yen.nh@abc-tech.vn','0987654321','INFLUENCER',0,'Phụ trách đấu thầu và hồ sơ năng lực nhà cung cấp.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(7,1,'Vũ Đức Thắng','Trưởng nhóm Kỹ thuật','thang.vd@abc-tech.vn','0909112233','END_USER',0,'Đánh giá API và kết nối hệ thống.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(8,2,'Hoàng Đình Trọng','Phó Chủ tịch HĐQT','trong.hd@hoanggia-group.vn','0988776655','DECISION_MAKER',1,'Người phê duyệt chủ trương đầu tư CRM toàn tập đoàn.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(9,2,'Bùi Phương Lan','Giám đốc Vận hành','lan.bp@hoanggia-group.vn','0977665544','INFLUENCER',0,'Thúc đẩy chuẩn hóa quy trình chăm sóc khách hàng VIP.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(10,3,'Trịnh Anh Quân','Giám đốc Dịch vụ Khách hàng','quan.ta@viettravelsun.vn','0903124578','DECISION_MAKER',1,'Đầu mối chính quản lý dự án CRM ngành du lịch.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(11,4,'Lương Thế Vinh','Trưởng khối Công nghệ Bán lẻ','vinh.lt@vpbankthanglong.vn','02439288888','INFLUENCER',1,'Đánh giá tiêu chuẩn an toàn bảo mật và tích hợp ngân hàng số.',1,0,'2026-10-09 11:38:28','2026-10-09 11:38:28'),(12,12,'Test Lien He Moi','Tro ly Ban Giam Doc','troly@daiphat-elec.vn','0988112233','INFLUENCER',0,'Lien he ho tro sap xep lich hop',1,1,'2026-10-09 11:48:32','2026-10-09 11:48:32'),(101,13,'Ngô Quang Huy','Phó Giám đốc Kỹ thuật','huynq@daiphat-elec.vn','0912998877','INFLUENCER',1,'Quan tâm công nghệ hạ tầng',1,0,'2026-10-09 13:22:48','2026-10-10 02:59:59'),(151,15,'Vũ Đình Toàn','Giám đốc Khối Viễn thông','toanvd@daiphatgroup.vn','0913554433','DECISION_MAKER',1,'Người quyết định duyệt giải pháp viễn thông',1,0,'2026-10-09 13:55:05','2026-10-10 02:59:59'),(161,16,'Đặng Thùy Dung','Phó Giám đốc Trung tâm Số hóa','dungdt@daiphatgroup.vn','0988112244','INFLUENCER',1,'Phụ trách kiến trúc phần mềm số hóa',1,0,'2026-10-09 13:55:05','2026-10-10 02:59:59'),(162,5,'Nguyễn Thu Trang','Giám đốc Chuỗi Bán lẻ','trang.nt@nemfashion.vn','0904567890','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(163,6,'BS. Phan Thanh Tùng','Giám đốc Y khoa & Mua sắm','tung.pt@ansinhmed.vn','0913456789','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(164,7,'KTS. Lê Văn Đức','Phó Tổng Giám đốc Kỹ thuật','duc.lv@nama-corp.vn','0903987654','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(165,8,'ThS. Đào Mai Chi','Trưởng phòng Tuyển sinh & Hợp tác','chi.dm@asianschool.edu.vn','0989123456','INFLUENCER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(166,9,'Trần Văn Bách','Trưởng phòng Khai thác & Điều vận','bach.tv@logitechvn.com','0908889922','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(167,10,'Nguyễn Phương Thảo','Giám đốc Chuỗi Nhượng quyền','thao.np@tacotoco.vn','0918776622','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(168,11,'Vũ Minh Quân','Giám đốc R&D Công nghệ Xanh','quan.vm@greentech.vn','0905123888','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(169,14,'Hoàng Minh Trí','Trưởng ban Pháp chế & Dự án','tri.hm@hoanggia-group.vn','0988776650','INFLUENCER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(170,17,'Phạm Quốc Hưng','Giám đốc Ban Quản lý Dự án','hung.pq@hoanggia-urban.vn','0977889900','DECISION_MAKER',1,NULL,1,0,'2026-10-10 07:27:33','2026-10-10 07:27:33'),(171,24,'Hoàng Tuấn Anh','Giám đốc Mua sắm','tuananh.namviet@nv.vn','0981239999','INFLUENCER',1,'Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh',1,0,'2026-10-14 12:41:02','2026-10-15 01:41:17'),(172,25,'Hoàng Tuấn Anh','Giám đốc Mua sắm','tuananh.namviet@nv.vn','0981239999','INFLUENCER',1,'Quan tâm triển khai CRM cho 40 chuyên viên kinh doanh',1,0,'2026-10-14 13:05:06','2026-10-15 01:41:17'),(173,26,'Đặng Vũ Hưng',NULL,'hung.alpha@alphatech.vn','0977881122','INFLUENCER',1,'Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',1,0,'2026-10-14 13:06:41','2026-10-15 01:41:17'),(174,27,'Trần Bích Thủy',NULL,'thuy.tb@bacviet-logistics.com','0966554433','INFLUENCER',1,NULL,1,0,'2026-10-14 13:06:41','2026-10-15 01:41:17'),(175,28,'Nguyễn Hữu Trí',NULL,'tri.nh@solargreen.vn','0933221144','INFLUENCER',1,NULL,1,0,'2026-10-14 13:06:41','2026-10-15 01:41:17'),(176,29,'Đặng Vũ Hưng',NULL,'hung.alpha@alphatech.vn','0977881122','INFLUENCER',1,'Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',1,0,'2026-10-14 13:10:52','2026-10-15 01:41:17'),(177,30,'Trần Bích Thủy',NULL,'thuy.tb@bacviet-logistics.com','0966554433','INFLUENCER',1,NULL,1,0,'2026-10-14 13:10:53','2026-10-15 01:41:17'),(178,31,'Nguyễn Hữu Trí',NULL,'tri.nh@solargreen.vn','0933221144','INFLUENCER',1,NULL,1,0,'2026-10-14 13:10:53','2026-10-15 01:41:17'),(179,32,'Đặng Vũ Hưng',NULL,'hung.alpha@alphatech.vn','0977881122','INFLUENCER',1,'Cần triển khai giải pháp CRM doanh nghiệp ngay trong tháng này',1,0,'2026-10-14 13:12:56','2026-10-15 01:41:17'),(180,33,'Trần Bích Thủy',NULL,'thuy.tb@bacviet-logistics.com','0966554433','INFLUENCER',1,NULL,1,0,'2026-10-14 13:12:56','2026-10-15 01:41:17'),(181,34,'Nguyễn Hữu Trí',NULL,'tri.nh@solargreen.vn','0933221144','INFLUENCER',1,NULL,1,0,'2026-10-14 13:12:56','2026-10-15 01:41:17'),(182,35,'Lê Hoàng Long','CTO','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,'Triển khai CRM Cloud',1,0,'2026-10-14 13:46:02','2026-10-15 01:41:17'),(183,36,'Lê Hoàng Long','CTO','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,'Triển khai CRM Cloud',1,0,'2026-10-14 13:47:41','2026-10-15 01:41:17'),(184,37,'Trần Thị Mai','Chủ cơ sở','mai.tran@maivyfashion.com','0912334455','INFLUENCER',1,NULL,1,0,'2026-10-14 13:47:42','2026-10-15 01:41:17'),(185,38,'Lê Hoàng Long','CTO','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,'Triển khai CRM Cloud',1,0,'2026-10-14 13:49:12','2026-10-15 01:41:17'),(186,39,'Trần Thị Mai','Chủ cơ sở','mai.tran@maivyfashion.com','0912334455','INFLUENCER',1,NULL,1,0,'2026-10-14 13:49:13','2026-10-15 01:41:17'),(187,40,'Lê Hoàng Long','CTO & Đồng sáng lập','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,NULL,1,0,'2026-10-14 13:49:13','2026-10-15 01:41:18'),(188,41,'Lê Hoàng Long','CTO','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,'Triển khai CRM Cloud',1,0,'2026-10-14 13:50:19','2026-10-15 01:41:17'),(189,42,'Trần Thị Mai','Chủ cơ sở','mai.tran@maivyfashion.com','0912334455','INFLUENCER',1,NULL,1,0,'2026-10-14 13:50:19','2026-10-15 01:41:17'),(190,43,'Lê Hoàng Long','CTO & Đồng sáng lập','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,NULL,1,0,'2026-10-14 13:50:19','2026-10-15 01:41:18'),(191,44,'Lê Hoàng Long','CTO','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,'Triển khai CRM Cloud',1,0,'2026-10-14 13:50:42','2026-10-15 01:41:17'),(192,45,'Trần Thị Mai','Chủ cơ sở','mai.tran@maivyfashion.com','0912334455','INFLUENCER',1,NULL,1,0,'2026-10-14 13:50:43','2026-10-15 01:41:17'),(193,46,'Lê Hoàng Long','CTO & Đồng sáng lập','long.le@hoanglongtech.vn','0987112233','INFLUENCER',1,NULL,1,0,'2026-10-14 13:50:43','2026-10-15 01:41:18'),(194,49,'Nguyễn Hoàng Nam','Trưởng phòng Mua hàng','hoangnam.build@namlong.vn','0912345678','INFLUENCER',1,'Gặp tại gian hàng VietBuild, quan tâm gói 30 nhân sự',1,0,'2026-10-15 01:54:03','2026-10-15 01:54:03'),(195,50,'Trần Minh Tuấn','Giám đốc Vận hành','tuan.tm@smarttech.vn','0988776655','INFLUENCER',1,'Cần demo tính năng phân quyền dữ liệu và mobile app',1,0,'2026-10-15 01:54:03','2026-10-15 01:54:03'),(196,51,'Phạm Hoàng Yến','Trưởng nhóm Marketing','yen.pham@sunrise-ad.com','0903123456','INFLUENCER',1,'Đăng ký tư vấn qua Facebook Lead Ads',1,0,'2026-10-15 01:54:03','2026-10-15 01:54:03'),(197,52,'Phạm Hoàng Yến','Trưởng nhóm Marketing','yen.pham@sunrise-ad.com','0903123456','INFLUENCER',1,NULL,1,0,'2026-10-15 02:09:20','2026-10-17 05:56:42'),(198,53,'Trần Minh Tuấn','Giám đốc Vận hành','tuan.tran@smarttech-test.vn','0988776655','DECISION_MAKER',1,NULL,1,0,'2026-10-15 02:20:31','2026-10-17 05:56:42'),(200,56,'Nguyễn Hoàng Nam','Trưởng phòng Mua hàng','nam.nguyen@testcorp.vn','0912345678','INFLUENCER',1,NULL,1,0,'2026-10-15 02:24:44','2026-10-17 05:56:42'),(201,57,'Nguyen Van Test','Giam Doc','contact@testconvert.com','0901234567','DECISION_MAKER',1,NULL,1,0,'2026-10-19 04:28:32','2026-10-19 04:28:32'),(202,58,'Mai Thi Vy','Tong Giam Doc','maivy@fashion.com','0909123456','DECISION_MAKER',1,NULL,1,0,'2026-10-19 04:48:09','2026-10-19 04:48:09');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_items`
--

DROP TABLE IF EXISTS `contract_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contract_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PERCENT',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `amount` decimal(15,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_contract_items_contract` (`contract_id`),
  KEY `fk_contract_items_product` (`product_id`),
  CONSTRAINT `fk_contract_items_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contract_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_items`
--

LOCK TABLES `contract_items` WRITE;
/*!40000 ALTER TABLE `contract_items` DISABLE KEYS */;
INSERT INTO `contract_items` VALUES (1,1,1,2,15000000.00,'PERCENT',5.00,1500000.00,28500000.00,NULL),(2,2,1,1,150000000.00,'PERCENT',0.00,0.00,150000000.00,'G?i b?o tr? h? th?ng h?ng n?m'),(3,3,2,12,7000000.00,'PERCENT',5.00,4200000.00,79800000.00,'Thu? bao d?ch v? Cloud 12 th?ng'),(4,4,3,1,45000000.00,'PERCENT',0.00,0.00,45000000.00,'Ch?ng ch? SSL doanh nghi?p EV v? h? t?ng VPN');
/*!40000 ALTER TABLE `contract_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_settings`
--

DROP TABLE IF EXISTS `contract_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_settings`
--

LOCK TABLES `contract_settings` WRITE;
/*!40000 ALTER TABLE `contract_settings` DISABLE KEYS */;
INSERT INTO `contract_settings` VALUES (1,'expiring_threshold_days','30','Số ngày trước khi hết hạn để cảnh báo hợp đồng sắp hết hạn','2026-10-19 02:05:50');
/*!40000 ALTER TABLE `contract_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `contract_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `opportunity_id` bigint DEFAULT NULL,
  `quote_id` bigint DEFAULT NULL,
  `renewal_opportunity_id` bigint DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `signed_date` date NOT NULL,
  `effective_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `owner_user_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_number` (`contract_number`),
  KEY `idx_contracts_customer` (`customer_id`),
  KEY `idx_contracts_opportunity` (`opportunity_id`),
  KEY `idx_contracts_quote` (`quote_id`),
  KEY `idx_contracts_status` (`status`),
  KEY `fk_contracts_owner` (`owner_user_id`),
  KEY `fk_contract_renewal_opp` (`renewal_opportunity_id`),
  CONSTRAINT `fk_contract_renewal_opp` FOREIGN KEY (`renewal_opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contracts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_contracts_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES (1,'HD-TEST-1792333685067','Hợp đồng cung cấp giải pháp CRM (HD-TEST-1792333685067)',56,193,28,196,28500000.00,5.00,27075000.00,'2026-10-18','2026-10-18','2026-10-25','Thanh toán đợt 1 50% trong 5 ngày.','RENEWED',1,'2026-10-18 14:28:05','2026-10-18 15:20:04',0),(2,'HD-SAMPLE-EXP-7D','Hợp đồng bảo trì phần mềm CRM - VPBank Thăng Long',4,NULL,NULL,195,150000000.00,0.00,150000000.00,'2025-10-25','2025-10-25','2026-10-25','Thanh toán 100% khi nghiệm thu dịch vụ năm','RENEWED',2,'2026-10-18 15:12:48','2026-10-19 02:05:50',0),(3,'HD-SAMPLE-EXP-15D','Hợp đồng thuê bao Cloud Enterprise - Nem Fashion',5,NULL,NULL,197,84000000.00,5.00,79800000.00,'2025-11-02','2025-11-02','2026-11-02','Thanh toán định kỳ hàng năm','RENEWED',3,'2026-10-18 15:12:48','2026-10-19 02:05:50',0),(4,'HD-SAMPLE-EXPIRED-5D','Hợp đồng dịch vụ bảo mật & SSL - Tập đoàn Hoàng Gia',2,NULL,NULL,194,45000000.00,0.00,45000000.00,'2025-10-13','2025-10-13','2026-10-13','Thanh toán đợt 1 50%, đợt 2 50%','RENEWED',2,'2026-10-18 15:12:48','2026-10-19 02:05:50',0);
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_field_values`
--

DROP TABLE IF EXISTS `custom_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_field_values` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `custom_field_id` bigint NOT NULL,
  `record_id` bigint NOT NULL,
  `field_value` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cfv` (`custom_field_id`,`record_id`),
  CONSTRAINT `fk_cfv_field` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_field_values`
--

LOCK TABLES `custom_field_values` WRITE;
/*!40000 ALTER TABLE `custom_field_values` DISABLE KEYS */;
INSERT INTO `custom_field_values` VALUES (1,3,19,'CN-HANOI-01'),(2,4,19,'250'),(3,6,19,'Cao'),(4,5,19,'2027-12-31');
/*!40000 ALTER TABLE `custom_field_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_fields` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `required_field` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `options_json` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_custom_entity_key` (`entity_type`,`field_key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_fields`
--

LOCK TABLES `custom_fields` WRITE;
/*!40000 ALTER TABLE `custom_fields` DISABLE KEYS */;
INSERT INTO `custom_fields` VALUES (2,'CUSTOMER','A','A','TEXT',0,1,'2026-10-10 08:03:47',NULL),(3,'CUSTOMER','branch_code','Chi nhánh phụ','TEXT',1,1,'2026-10-10 08:10:54',NULL),(4,'CUSTOMER','employee_count','Số lượng NV nội bộ','NUMBER',0,1,'2026-10-10 08:10:54',NULL),(5,'CUSTOMER','contract_valid_until','Hạn HĐ nguyên tắc','DATE',0,1,'2026-10-10 08:10:54',NULL),(6,'CUSTOMER','customer_priority','Mức độ ưu tiên','SELECT',0,1,'2026-10-10 08:10:54','[\"Cao\",\"Trung bình\",\"Thấp\"]'),(7,'OPPORTUNITY','tech_interest','Giải pháp quan tâm','SELECT',0,1,'2026-10-10 08:10:54','[\"Cloud CRM\",\"ERP Core\",\"AI Chatbot\"]');
/*!40000 ALTER TABLE `custom_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TIEM_NANG',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry_id` bigint DEFAULT NULL,
  `company_size_id` bigint DEFAULT NULL,
  `region_id` bigint DEFAULT NULL,
  `owner_user_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lead_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lead_source_id` bigint DEFAULT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `lead_score` int NOT NULL DEFAULT '0',
  `score_grade` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COLD',
  `score_breakdown` text COLLATE utf8mb4_unicode_ci,
  `assignment_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNASSIGNED',
  `assigned_rule_id` bigint DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL COMMENT 'Th???i ??i???m sales b???m nh???n lead',
  `rejected_at` datetime DEFAULT NULL COMMENT 'Th???i ??i???m sales t??? ch???i lead',
  `rejected_by_user_id` bigint DEFAULT NULL COMMENT 'ID nh??n vi??n t??? ch???i lead',
  `rejection_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'L?? do t??? ch???i lead b???t bu???c',
  `sla_deadline` datetime DEFAULT NULL COMMENT 'H???n ch??t ph???n h???i theo SLA',
  `sla_breached` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'C??? vi ph???m SLA: 1=qu?? h???n',
  `sla_breached_at` datetime DEFAULT NULL COMMENT 'Th???i ??i???m ph??t hi???n vi ph???m SLA',
  `first_contacted_at` datetime DEFAULT NULL COMMENT 'Th???i ??i???m c?? t????ng t??c ?????u ti??n',
  `converted_at` datetime DEFAULT NULL COMMENT 'Th???i ??i???m chuy???n ?????i lead',
  `converted_by_user_id` bigint DEFAULT NULL COMMENT 'ID ng?????i th???c hi???n chuy???n ?????i',
  `converted_customer_id` bigint DEFAULT NULL COMMENT 'ID kh??ch h??ng doanh nghi???p sau chuy???n ?????i',
  `converted_contact_id` bigint DEFAULT NULL COMMENT 'ID ng?????i li??n h??? sau chuy???n ?????i',
  `converted_opportunity_id` bigint DEFAULT NULL COMMENT 'ID c?? h???i b??n h??ng sau chuy???n ?????i',
  PRIMARY KEY (`id`),
  KEY `fk_customer_owner` (`owner_user_id`),
  KEY `idx_customers_parent` (`parent_id`),
  KEY `idx_customers_region` (`region_id`),
  KEY `idx_customers_industry_size` (`industry_id`,`company_size_id`),
  KEY `fk_customers_campaign` (`campaign_id`),
  KEY `idx_customers_lead_source` (`lead_source`),
  KEY `idx_customers_created_at` (`created_at`),
  KEY `idx_customers_source_created` (`lead_source`,`created_at`),
  CONSTRAINT `fk_customer_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customers_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customers_parent` FOREIGN KEY (`parent_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customers_region` FOREIGN KEY (`region_id`) REFERENCES `master_data` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Công ty Cổ phần Công nghệ ABC','0101234567','DANG_CHAM_SOC','contact@abctech.vn','0912345678','https://abctech.vn','Số 123 Phố Huế, Hai Bà Trưng, Hà Nội',1,12,22,4,NULL,0,'2026-10-07 15:16:01','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,1,65,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"50 - 200 nhÃ¢n sá»±\":20,\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ACCEPTED',NULL,'2026-10-02 08:00:00','2026-10-15 01:45:44',NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(2,'Tập đoàn Bất động sản Hoàng Gia','0309876543','KHACH_HANG','info@hoanggialand.vn','0988776655','https://hoanggialand.vn','Tầng 15, Tòa nhà Landmark, Q.1, TP.HCM',2,13,26,4,NULL,0,'2026-10-07 15:16:01','2026-10-19 07:50:14','Google Search',NULL,3,45,'WARM','{\"Báº¥t Ä‘á»™ng sáº£n \\u0026 XÃ¢y dá»±ng\":20,\"200 - 500 nhÃ¢n sá»±\":25}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(3,'Công ty TNHH Dịch vụ & Du lịch Viettravel Sun','0108923412','KHACH_HANG','booking@viettravelsun.vn','0903124578','https://viettravelsun.vn','45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',8,12,26,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14','Mạng xã hội',NULL,2,20,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(4,'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank Thăng Long)','0100233583','KHACH_HANG','contact@vpbankthanglong.vn','02439288888','https://vpbank.com.vn','89 Láng Hạ, Đống Đa, Hà Nội',4,14,22,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14','Google Search',NULL,3,45,'WARM','{\"TÃ i chÃ­nh - NgÃ¢n hÃ ng - Báº£o hiá»ƒm\":15,\"TrÃªn 500 nhÃ¢n sá»± (Doanh nghiá»‡p lá»›n)\":30}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(5,'Chuỗi Bán lẻ Thời trang Nem Fashion','0103765432','KHACH_HANG','sales@nemfashion.vn','0936112233','https://nemfashion.vn','54 Tràng Tiền, Hoàn Kiếm, Hà Nội',3,13,22,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,40,'WARM','{\"BÃ¡n láº» \\u0026 ThÆ°Æ¡ng máº¡i Ä‘iá»‡n tá»­\":15,\"200 - 500 nhÃ¢n sá»±\":25}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(6,'Công ty Cổ phần Dược phẩm An Sinh Medicare','0314567890','TIEM_NANG','info@ansinhpharma.vn','0977889900','https://ansinhmedicare.com','120 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',5,12,26,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,20,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(7,'Tập đoàn Sản xuất & Chế tạo Cơ khí Nam Á','3701239876','KHACH_HANG','lienhe@nama-machinery.com.vn','02743899222','https://nama-machinery.com.vn','KCN VSIP 1, TP. Thuận An, Bình Dương',6,14,NULL,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14','Mạng xã hội',NULL,2,50,'WARM','{\"Sáº£n xuáº¥t \\u0026 Cháº¿ táº¡o\":20,\"TrÃªn 500 nhÃ¢n sá»± (Doanh nghiá»‡p lá»›n)\":30}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(8,'Hệ thống Trường Quốc tế Á Châu (Asian School)','0302456781','TIEM_NANG','admissions@asianschool.edu.vn','02838480740','https://asianschool.edu.vn','226 Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM',7,13,26,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,25,'COLD','{\"200 - 500 nhÃ¢n sá»±\":25}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(9,'Công ty Cổ phần Giải pháp Logistics LogiTech Việt Nam','0201889922','TIEM_NANG','dispatch@logitech-vn.com','0918776655','https://logitech-vn.com','Khu kinh tế Đình Vũ, Hải An, Hải Phòng',9,12,NULL,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,20,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',0,NULL,'2026-10-02 08:30:00',NULL,NULL,NULL,NULL,NULL),(10,'Chuỗi Cửa hàng Trà sữa TocoToco (Công ty CP Taco)','0106489012','KHACH_HANG','marketing@tocotocotea.com','1900636936','https://tocotocotea.com','Tầng 3, Golden Palace, Mễ Trì, Nam Từ Liêm, Hà Nội',3,13,22,4,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,40,'WARM','{\"BÃ¡n láº» \\u0026 ThÆ°Æ¡ng máº¡i Ä‘iá»‡n tá»­\":15,\"200 - 500 nhÃ¢n sá»±\":25}','ASSIGNED',NULL,'2026-10-02 08:00:00',NULL,NULL,NULL,NULL,'2026-10-02 12:00:00',1,NULL,'2026-10-02 16:30:00',NULL,NULL,NULL,NULL,NULL),(11,'Công ty Cổ phần Đầu tư Công nghệ Xanh GreenTech','0401998877','TIEM_NANG','support@greentech-group.vn','0905667788','https://greentech-group.vn','Khu Công nghệ cao Đà Nẵng, Hòa Vang, Đà Nẵng',1,11,24,5,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14',NULL,NULL,NULL,35,'COLD','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"20 - 50 nhÃ¢n sá»±\":10}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(12,'Tập đoàn Bán buôn & Phân phối Điện tử Đại Phát','0105123999','KHACH_HANG','contact@daiphat-elec.vn','0944556677','https://daiphat-elec.vn','36 Hoàng Cầu, Ô Chợ Dừa, Đống Đa, Hà Nội',3,12,22,5,NULL,0,'2026-10-08 01:38:11','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,1,55,'WARM','{\"BÃ¡n láº» \\u0026 ThÆ°Æ¡ng máº¡i Ä‘iá»‡n tá»­\":15,\"50 - 200 nhÃ¢n sá»±\":20,\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(13,'Công ty Cổ phần Điện tử Đại Phát','010-5123-999','MERGED','kinhdoanh@daiphat-elec.vn','0911223344','http://www.daiphat-elec.vn','Tầng 5, Tòa nhà Charmvit, 117 Trần Duy Hưng, Cầu Giấy, Hà Nội',1,1,22,5,NULL,0,'2026-10-09 13:22:48','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,1,45,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(14,'Tập đoàn Bất động sản Hoàng Gia Group','030-9876-543','TIEM_NANG','info@hoanggialand.vn','0988776655','https://hoanggialand.vn','Tòa nhà Hoàng Gia, Quận 1, TP. Hồ Chí Minh',2,2,26,5,NULL,0,'2026-10-09 13:24:52','2026-10-19 07:50:14',NULL,NULL,NULL,20,'COLD','{\"Báº¥t Ä‘á»™ng sáº£n \\u0026 XÃ¢y dá»±ng\":20}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(15,'Công ty TNHH Viễn thông & Thiết bị Mạng Đại Phát (DaiPhat Telecom)','0105123999-001','KHACH_HANG','telecom@daiphatgroup.vn','02437651122','https://telecom.daiphatgroup.vn','Lô B2, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',1,2,22,5,12,0,'2026-10-09 13:55:05','2026-10-19 07:50:14','Form Website',NULL,2,40,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(16,'Công ty Cổ phần Giải pháp Phần mềm & Số hóa Đại Phát (DaiPhat Digital)','0105123999-002','KHACH_HANG','digital@daiphatgroup.vn','02437652233','https://digital.daiphatgroup.vn','Tầng 8, Tòa nhà Đại Phát, 88 Dịch Vọng Hậu, Cầu Giấy, Hà Nội',1,2,22,5,12,0,'2026-10-09 13:55:05','2026-10-19 07:50:14','Form Website',NULL,2,40,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(17,'Công ty Cổ phần Xây dựng & Phát triển Đô thị Hoàng Gia (HoangGia Urban)','0309876543-001','KHACH_HANG','urban@hoanggialand.vn','02839998877','https://urban.hoanggialand.vn','Khu Đô thị Mới Nam Sài Gòn, Quận 7, TP. Hồ Chí Minh',2,3,26,5,2,0,'2026-10-09 13:55:05','2026-10-19 07:50:14','Form Website',NULL,2,35,'COLD','{\"Báº¥t Ä‘á»™ng sáº£n \\u0026 XÃ¢y dá»±ng\":20,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',0,NULL,'2026-10-03 09:45:00',NULL,NULL,NULL,NULL,NULL),(18,'a','a','Đang giao dịch','a','a','a','a',NULL,NULL,NULL,5,NULL,1,'2026-10-10 07:50:34','2026-10-19 07:50:14','Form Website',NULL,2,0,'COLD',NULL,'ASSIGNED',NULL,'2026-10-03 09:00:00',NULL,NULL,NULL,NULL,'2026-10-03 13:00:00',1,NULL,'2026-10-03 15:00:00',NULL,NULL,NULL,NULL,NULL),(19,'Tập đoàn Công nghệ Thử Nghiệm CF','0109998888','KHACH_HANG',NULL,NULL,NULL,NULL,NULL,NULL,NULL,7,NULL,0,'2026-10-10 08:10:54','2026-10-19 07:50:14','Form Website',NULL,2,15,'COLD','{\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(20,'Tập đoàn Công nghệ SmartTech',NULL,'MOI','haidang.vu@smarttech.vn','0909123456',NULL,NULL,NULL,NULL,NULL,7,NULL,0,'2026-10-14 02:27:56','2026-10-19 07:50:14','Form Website',NULL,2,15,'COLD','{\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(21,'Company 1',NULL,'MOI','user1@test.vn','0912345671',NULL,NULL,NULL,NULL,NULL,7,NULL,0,'2026-10-14 02:28:35','2026-10-19 07:50:14','Form Website',NULL,2,15,'COLD','{\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(22,'Company 2',NULL,'MOI','user2@test.vn','0912345672',NULL,NULL,NULL,NULL,NULL,7,NULL,0,'2026-10-14 02:28:35','2026-10-19 07:50:14','Form Website',NULL,2,15,'COLD','{\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(23,'Company 3',NULL,'MOI','user3@test.vn','0912345673',NULL,NULL,NULL,NULL,NULL,7,NULL,0,'2026-10-14 02:28:35','2026-10-19 07:50:14','Form Website',NULL,2,15,'COLD','{\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(24,'Công ty Xây dựng và Đầu tư Nam Việt',NULL,'TIEM_NANG','tuananh.namviet@nv.vn','0981239999',NULL,'Hà Nội',NULL,NULL,NULL,7,NULL,0,'2026-10-14 12:41:02','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,1,0,'COLD','{}','ASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(25,'Công ty Xây dựng và Đầu tư Nam Việt',NULL,'TIEM_NANG','tuananh.namviet@nv.vn','0981239999',NULL,'Hà Nội',NULL,NULL,NULL,7,NULL,0,'2026-10-14 13:05:06','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,1,0,'COLD','{}','UNASSIGNED',NULL,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',0,NULL,'2026-10-04 10:20:00',NULL,NULL,NULL,NULL,NULL),(26,'Tập đoàn Công nghệ Alpha Tech',NULL,'TIEM_NANG','hung.alpha@alphatech.vn','0977881122',NULL,NULL,1,14,22,7,NULL,0,'2026-10-14 13:06:41','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,55,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"TrÃªn 500 nhÃ¢n sá»± (Doanh nghiá»‡p lá»›n)\":30}','ASSIGNED',1,'2026-10-04 10:00:00',NULL,NULL,NULL,NULL,'2026-10-04 14:00:00',1,'2026-10-15 00:10:04','2026-10-04 17:00:00',NULL,NULL,NULL,NULL,NULL),(27,'Công ty TNHH Dịch vụ Vận tải Bắc Việt',NULL,'TIEM_NANG','thuy.tb@bacviet-logistics.com','0966554433',NULL,NULL,9,12,22,9,NULL,0,'2026-10-14 13:06:41','2026-10-19 07:50:14','Website / Tìm kiếm',NULL,NULL,35,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',1,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(28,'Công ty TNHH Năng lượng Mặt trời Xanh',NULL,'TIEM_NANG','tri.nh@solargreen.vn','0933221144',NULL,'TP. Hồ Chí Minh',NULL,NULL,NULL,9,NULL,0,'2026-10-14 13:06:41','2026-10-19 07:50:14','Người quen giới thiệu',NULL,NULL,25,'COLD','{\"NgÆ°á»i quen giá»›i thiá»‡u (Äá»™ tin cáº­y cao)\":25}','ASSIGNED',NULL,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(29,'Tập đoàn Công nghệ Alpha Tech',NULL,'TIEM_NANG','hung.alpha@alphatech.vn','0977881122',NULL,NULL,1,14,22,9,NULL,0,'2026-10-14 13:10:52','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,55,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"TrÃªn 500 nhÃ¢n sá»± (Doanh nghiá»‡p lá»›n)\":30}','ASSIGNED',1,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(30,'Công ty TNHH Dịch vụ Vận tải Bắc Việt',NULL,'TIEM_NANG','thuy.tb@bacviet-logistics.com','0966554433',NULL,NULL,9,12,22,9,NULL,0,'2026-10-14 13:10:53','2026-10-19 07:50:14','Website / Tìm kiếm',NULL,NULL,35,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',1,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(31,'Công ty TNHH Năng lượng Mặt trời Xanh',NULL,'TIEM_NANG','tri.nh@solargreen.vn','0933221144',NULL,'TP. Hồ Chí Minh',NULL,NULL,NULL,9,NULL,0,'2026-10-14 13:10:53','2026-10-19 07:50:14','Người quen giới thiệu',NULL,NULL,25,'COLD','{\"NgÆ°á»i quen giá»›i thiá»‡u (Äá»™ tin cáº­y cao)\":25}','ASSIGNED',NULL,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(32,'Tập đoàn Công nghệ Alpha Tech',NULL,'TIEM_NANG','hung.alpha@alphatech.vn','0977881122',NULL,NULL,1,14,22,9,NULL,0,'2026-10-14 13:12:56','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,55,'WARM','{\"CÃ´ng nghá»‡ thÃ´ng tin \\u0026 Viá»…n thÃ´ng\":25,\"TrÃªn 500 nhÃ¢n sá»± (Doanh nghiá»‡p lá»›n)\":30}','ASSIGNED',1,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(33,'Công ty TNHH Dịch vụ Vận tải Bắc Việt',NULL,'TIEM_NANG','thuy.tb@bacviet-logistics.com','0966554433',NULL,NULL,9,12,22,9,NULL,0,'2026-10-14 13:12:56','2026-10-19 07:50:14','Website / Tìm kiếm',NULL,NULL,35,'COLD','{\"50 - 200 nhÃ¢n sá»±\":20,\"Website / Google TÃ¬m kiáº¿m tá»± nhiÃªn\":15}','ASSIGNED',1,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(34,'Công ty TNHH Năng lượng Mặt trời Xanh',NULL,'TIEM_NANG','tri.nh@solargreen.vn','0933221144',NULL,'TP. Hồ Chí Minh',NULL,NULL,NULL,9,NULL,0,'2026-10-14 13:12:56','2026-10-19 07:50:14','Người quen giới thiệu',NULL,NULL,25,'COLD','{\"NgÆ°á»i quen giá»›i thiá»‡u (Äá»™ tin cáº­y cao)\":25}','ASSIGNED',NULL,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,'2026-10-15 00:10:04','2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(35,'Công ty CP Giải pháp Công nghệ Hoàng Long',NULL,'TIEM_NANG','long.le@hoanglongtech.vn','0987112233',NULL,'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',NULL,NULL,NULL,9,NULL,0,'2026-10-14 13:46:02','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD','{\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','UNASSIGNED',NULL,'2026-10-05 08:30:00',NULL,NULL,NULL,NULL,'2026-10-05 12:30:00',0,NULL,'2026-10-05 08:50:00',NULL,NULL,NULL,NULL,NULL),(36,'Công ty CP Giải pháp Công nghệ Hoàng Long',NULL,'DANG_CHAM_SOC','long.le@hoanglongtech.vn','0987112233',NULL,'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',NULL,NULL,NULL,9,NULL,0,'2026-10-14 13:47:41','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD','{\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ACCEPTED',NULL,'2026-10-05 08:30:00','2026-10-14 13:47:41',NULL,NULL,NULL,'2026-10-05 12:30:00',1,NULL,'2026-10-05 15:30:00',NULL,NULL,NULL,NULL,NULL),(37,'Công ty TNHH Thời Trang Mai Vy',NULL,'CONVERTED','mai.tran@maivyfashion.com','0912334455',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:47:42','2026-10-19 07:50:14','Sự kiện / Hội nghị',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,'2026-10-06 09:00:00',NULL,'2026-10-14 13:47:42',1,'Sai địa bàn phụ trách - Khách ở Miền Nam','2026-10-06 13:00:00',0,NULL,'2026-10-06 10:00:00','2026-10-15 02:24:44',1,56,200,193),(38,'Công ty CP Giải pháp Công nghệ Hoàng Long',NULL,'CONVERTED','long.le@hoanglongtech.vn','0987112233',NULL,'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:49:12','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD','{\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ACCEPTED',NULL,'2026-10-06 09:00:00','2026-10-14 13:49:12',NULL,NULL,NULL,'2026-10-06 13:00:00',0,NULL,'2026-10-06 10:00:00','2026-10-14 13:49:13',1,40,187,172),(39,'Công ty TNHH Thời Trang Mai Vy',NULL,'TIEM_NANG','mai.tran@maivyfashion.com','0912334455',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:49:13','2026-10-19 07:50:14','Sự kiện / Hội nghị',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,'2026-10-06 09:00:00',NULL,'2026-10-15 02:24:44',1,'Sai dia ban phu trach','2026-10-06 13:00:00',0,NULL,'2026-10-06 10:00:00',NULL,NULL,NULL,NULL,NULL),(40,'Công ty CP Công nghệ Hoàng Long Global',NULL,'KHACH_HANG','long.le@hoanglongtech.vn','0987112233',NULL,'Số 102 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:49:13','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD',NULL,'UNASSIGNED',NULL,'2026-10-06 09:00:00',NULL,NULL,NULL,NULL,'2026-10-06 13:00:00',0,NULL,'2026-10-06 10:00:00',NULL,NULL,NULL,NULL,NULL),(41,'Công ty CP Giải pháp Công nghệ Hoàng Long',NULL,'CONVERTED','long.le@hoanglongtech.vn','0987112233',NULL,'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:19','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD','{\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ACCEPTED',NULL,'2026-10-06 09:00:00','2026-10-14 13:50:19',NULL,NULL,NULL,'2026-10-06 13:00:00',0,NULL,'2026-10-06 10:00:00','2026-10-14 13:50:19',1,43,190,173),(42,'Công ty TNHH Thời Trang Mai Vy',NULL,'DANG_CHAM_SOC','mai.tran@maivyfashion.com','0912334455',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:19','2026-10-19 07:50:14','Sự kiện / Hội nghị',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,'2026-10-06 09:00:00','2026-10-15 02:24:44','2026-10-15 02:23:20',1,'Sai dia ban phu trach','2026-10-06 13:00:00',1,NULL,'2026-10-06 16:30:00',NULL,NULL,NULL,NULL,NULL),(43,'Công ty CP Công nghệ Hoàng Long Global',NULL,'KHACH_HANG','long.le@hoanglongtech.vn','0987112233',NULL,'Số 102 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:19','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD',NULL,'UNASSIGNED',NULL,'2026-10-06 09:00:00',NULL,NULL,NULL,NULL,'2026-10-06 13:00:00',1,NULL,'2026-10-06 16:30:00',NULL,NULL,NULL,NULL,NULL),(44,'Công ty CP Giải pháp Công nghệ Hoàng Long',NULL,'CONVERTED','long.le@hoanglongtech.vn','0987112233',NULL,'Số 45 Lê Văn Lương, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:42','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD','{\"Há»™i tháº£o / Triá»ƒn lÃ£m ngÃ nh (VietBuild, TechFest)\":20}','ACCEPTED',NULL,'2026-10-06 09:00:00','2026-10-14 13:50:42',NULL,NULL,NULL,'2026-10-06 13:00:00',1,NULL,'2026-10-06 16:30:00','2026-10-14 13:50:43',1,46,193,174),(45,'Công ty TNHH Thời Trang Mai Vy',NULL,'CONVERTED','mai.tran@maivyfashion.com','0912334455',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:43','2026-10-19 07:50:14','Sự kiện / Hội nghị',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,'2026-10-06 09:00:00','2026-10-15 02:23:20','2026-10-19 04:47:53',1,'Sai dia ban hoac khong phu hop','2026-10-06 13:00:00',1,NULL,'2026-10-06 16:30:00','2026-10-19 04:48:09',1,58,202,199),(46,'Công ty CP Công nghệ Hoàng Long Global',NULL,'KHACH_HANG','long.le@hoanglongtech.vn','0987112233',NULL,'Số 102 Tôn Thất Thuyết, Cầu Giấy, Hà Nội',NULL,NULL,NULL,10,NULL,0,'2026-10-14 13:50:43','2026-10-19 07:50:14','Hội thảo / Sự kiện',NULL,NULL,20,'COLD',NULL,'UNASSIGNED',NULL,'2026-10-06 09:00:00',NULL,NULL,NULL,NULL,'2026-10-06 13:00:00',1,NULL,'2026-10-06 16:30:00',NULL,NULL,NULL,NULL,NULL),(47,'Test Corp',NULL,'MOI','testform@example.com','0987654321',NULL,NULL,NULL,NULL,NULL,1,NULL,0,'2026-10-15 01:19:19','2026-10-15 01:19:20','Landing Page Chiến dịch Q4',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(48,'Test Corp',NULL,'MOI','testform@example.com','0987654321',NULL,NULL,NULL,NULL,NULL,1,NULL,0,'2026-10-15 01:29:41','2026-10-15 01:29:41','Landing Page Chiến dịch Q4',NULL,NULL,0,'COLD','{}','UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(49,'Tập đoàn Xây dựng Nam Long',NULL,'DANG_CHAM_SOC','hoangnam.build@namlong.vn','0912345678',NULL,'Tập đoàn Xây dựng Nam Long',NULL,NULL,NULL,1,NULL,0,'2026-10-15 01:54:03','2026-10-15 02:21:09','Hội thảo / Sự kiện',NULL,1,0,'COLD',NULL,'ACCEPTED',NULL,NULL,'2026-10-15 02:21:09',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'Công ty Cổ phần Công nghệ SmartTech',NULL,'CONVERTED','tuan.tm@smarttech.vn','0988776655',NULL,'Công ty Cổ phần Công nghệ SmartTech',NULL,NULL,NULL,1,NULL,0,'2026-10-15 01:54:03','2026-10-15 02:20:31','Hội thảo / Sự kiện',NULL,1,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-10-15 02:20:31',1,53,198,191),(51,'Công ty TNHH Quảng cáo Sáng tạo Sunrise',NULL,'CONVERTED','yen.pham@sunrise-ad.com','0903123456',NULL,'Công ty TNHH Quảng cáo Sáng tạo Sunrise',NULL,NULL,NULL,1,NULL,0,'2026-10-15 01:54:03','2026-10-15 02:09:20','Mạng xã hội',NULL,2,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'2026-10-15 02:09:20',1,52,197,190),(52,'Sunrise Test Corp','0109998888','CONVERTED','yen.pham@sunrise-ad.com','0903123456','https://sunrise-ad.com','Công ty TNHH Quảng cáo Sáng tạo Sunrise',NULL,NULL,NULL,NULL,NULL,0,'2026-10-15 02:09:20','2026-10-19 04:28:32','Mạng xã hội',NULL,2,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,'2026-10-15 02:09:38','2026-10-19 04:24:48',1,'Test ly do tu choi lead',NULL,0,NULL,NULL,'2026-10-19 04:28:32',1,57,201,198),(53,'SmartTech Enterprise Test','0108889999','KHACH_HANG','contact@smarttech-test.vn','0988776655',NULL,'Công ty Cổ phần Công nghệ SmartTech',NULL,NULL,NULL,1,NULL,0,'2026-10-15 02:20:31','2026-10-15 02:20:31','Hội thảo / Sự kiện',NULL,1,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(56,'Nam Long Group Test','0107776666','KHACH_HANG','namlong@testcorp.vn','0912345678',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,1,NULL,0,'2026-10-15 02:24:44','2026-10-15 02:24:44','Sự kiện / Hội nghị',NULL,NULL,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(57,'Cong Ty Test Convert 52','0109999999','KHACH_HANG','contact@testconvert.com','0901234567','https://sunrise-ad.com','Công ty TNHH Quảng cáo Sáng tạo Sunrise',NULL,NULL,NULL,1,NULL,0,'2026-10-19 04:28:32','2026-10-19 04:28:32','Mạng xã hội',NULL,2,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(58,'Cong Ty Thoi Trang Mai Vy VIP','0318999888','KHACH_HANG','maivy@fashion.com','0909123456',NULL,'Số 88 Nguyễn Trãi, Thanh Xuân, Hà Nội',NULL,NULL,NULL,1,NULL,0,'2026-10-19 04:48:09','2026-10-19 04:48:09','Sự kiện / Hội nghị',NULL,NULL,0,'COLD',NULL,'UNASSIGNED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_transfer_logs`
--

DROP TABLE IF EXISTS `data_transfer_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_transfer_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `from_user_id` bigint NOT NULL,
  `to_user_id` bigint NOT NULL,
  `performed_by` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `from_user_id` (`from_user_id`),
  KEY `to_user_id` (`to_user_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `data_transfer_logs_ibfk_1` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `data_transfer_logs_ibfk_2` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `data_transfer_logs_ibfk_3` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_transfer_logs`
--

LOCK TABLES `data_transfer_logs` WRITE;
/*!40000 ALTER TABLE `data_transfer_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_transfer_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_templates`
--

DROP TABLE IF EXISTS `document_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `template_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Táº¬P ÄOÃ€N CÃ”NG NGHá»† & GIáº¢I PHÃP CRM ENTERPRISE VIá»†T NAM',
  `company_tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '0108996688',
  `company_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Táº§ng 18, TÃ²a nhÃ  Keangnam Landmark 72, Má»… TrÃ¬, Nam Tá»« LiÃªm, HÃ  Ná»™i',
  `company_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1900 8866 - 024.3988.9999',
  `company_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'sales@crmenterprise.vn',
  `company_bank_info` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i (MBBank) - Chi nhÃ¡nh Sá»Ÿ Giao Dá»‹ch - STK: 888899996666',
  `company_logo_url` text COLLATE utf8mb4_unicode_ci,
  `header_content` text COLLATE utf8mb4_unicode_ci,
  `footer_content` text COLLATE utf8mb4_unicode_ci,
  `default_terms` text COLLATE utf8mb4_unicode_ci,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_type` (`template_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_templates`
--

LOCK TABLES `document_templates` WRITE;
/*!40000 ALTER TABLE `document_templates` DISABLE KEYS */;
INSERT INTO `document_templates` VALUES (1,'QUOTE','Mẫu Báo giá Doanh nghiệp Chuẩn Nhận diện (Test Update)','TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM','0108996688','Tầng 18, Tòa nhà Keangnam Landmark 72, Mễ Trì, Hà Nội','1900 8866','sales@crmenterprise.vn','MBBank - STK: 888899996666','https://example.com/logo.png',NULL,NULL,NULL,1,'2026-10-18 14:25:16'),(2,'CONTRACT','Mẫu Hợp đồng Kinh tế & Triển khai Phần mềm','TẬP ĐOÀN CÔNG NGHỆ & GIẢI PHÁP CRM ENTERPRISE VIỆT NAM','0108996688','Táº§ng 18, TÃ²a nhÃ  Keangnam Landmark 72, Má»… TrÃ¬, Nam Tá»« LiÃªm, HÃ  Ná»™i','1900 8866 - 024.3988.9999','sales@crmenterprise.vn','NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i (MBBank) - Chi nhÃ¡nh Sá»Ÿ Giao Dá»‹ch - STK: 888899996666','https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80','HỢP ĐỒNG CUNG CẤP GIẢI PHÁP VÀ BẢN QUYỀN PHẦN MỀM QUẢN TRỊ KHÁCH HÀNG CRM','Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.','• Bên A cam kết bàn giao phần mềm đúng thời hạn và đào tạo chuyển giao công nghệ đầy đủ.\n• Bên B có trách nhiệm thanh toán đúng tiến độ đã thỏa thuận.\n• Hai bên cam kết thực hiện đúng các điều khoản hợp đồng đã ký kết.',NULL,'2026-10-19 02:05:50');
/*!40000 ALTER TABLE `document_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_queue`
--

DROP TABLE IF EXISTS `email_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_queue` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `template_id` bigint DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `contact_id` bigint DEFAULT NULL,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_html` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'QUEUED',
  `attempts` int NOT NULL DEFAULT '0',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_by_user_id` bigint NOT NULL,
  `scheduled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_status` (`status`),
  KEY `idx_email_customer` (`customer_id`),
  KEY `fk_email_user` (`sent_by_user_id`),
  CONSTRAINT `fk_email_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_email_user` FOREIGN KEY (`sent_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_queue`
--

LOCK TABLES `email_queue` WRITE;
/*!40000 ALTER TABLE `email_queue` DISABLE KEYS */;
INSERT INTO `email_queue` VALUES (1,1,1,NULL,'contact@vpbank.com.vn','Nguyễn Tấn Phát','Giới thiệu giải pháp CRM cho Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank) - Kính gửi Nguyễn Tấn Phát','<p>Kính gửi Anh/Chị Nguyễn Tấn Phát, đã gửi thành công thư giới thiệu sản phẩm cho VPBank.</p>','SENT',1,NULL,4,'2026-10-19 07:32:42','2026-10-19 07:32:42','2026-10-19 09:32:42','2026-10-19 09:32:42'),(2,2,2,NULL,'nem.fashion.loi@invalid-smtp-test.vn','Đặng Mai Hương','Theo dõi phản hồi báo giá dịch vụ - Kính gửi NEM Fashion Group','<p>Thư gửi thất bại do máy chủ nhận thư từ chối kết nối (550 Mailbox unavailable).</p>','FAILED',3,'Lỗi kết nối máy chủ gửi: Địa chỉ nhận nem.fashion.loi@invalid-smtp-test.vn không tồn tại hoặc bị máy chủ MX từ chối (550 Mailbox unavailable).',4,'2026-10-19 08:32:42',NULL,'2026-10-19 09:32:42','2026-10-19 09:57:03'),(3,1,1,NULL,'contact@vpbank.com.vn','Nguyá»…n Táº¥n PhÃ¡t','Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','<p>KÃ­nh gá»­i Anh <strong>Nguyá»…n Táº¥n PhÃ¡t</strong>, bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho <strong>Công ty Cổ phần Công nghệ ABC</strong>.</p>','SENT',1,NULL,4,'2026-10-19 09:54:51','2026-10-19 09:54:51','2026-10-19 09:54:51','2026-10-19 09:54:51'),(4,1,1,NULL,'contact@vpbank.com.vn','Nguyá»…n Táº¥n PhÃ¡t','Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','<p>KÃ­nh gá»­i Anh <strong>Nguyá»…n Táº¥n PhÃ¡t</strong>, bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho <strong>Công ty Cổ phần Công nghệ ABC</strong>.</p>','SENT',1,NULL,4,'2026-10-19 09:56:23','2026-10-19 09:56:23','2026-10-19 09:56:23','2026-10-19 09:56:23'),(5,1,1,NULL,'contact@vpbank.com.vn','Nguyá»…n Táº¥n PhÃ¡t','Giá»›i thiá»‡u giáº£i phÃ¡p CRM cho Công ty Cổ phần Công nghệ ABC - KÃ­nh gá»­i Nguyá»…n Táº¥n PhÃ¡t','<p>KÃ­nh gá»­i Anh <strong>Nguyá»…n Táº¥n PhÃ¡t</strong>, bÃªn em xin gá»­i tÃ i liá»‡u giáº£i phÃ¡p CRM cho <strong>Công ty Cổ phần Công nghệ ABC</strong>.</p>','SENT',1,NULL,4,'2026-10-19 09:57:02','2026-10-19 09:57:02','2026-10-19 09:57:02','2026-10-19 09:57:02'),(6,NULL,NULL,NULL,'admin@crm.local','CRM Administrator','[CRM Thông báo] Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','<p>Kính gửi <strong>CRM Administrator</strong>,</p><p>Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.</p><p><a href=\"http://localhost:8080/crm/activities\" style=\"display:inline-block;padding:8px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">Xem chi tiết trên hệ thống CRM</a></p><p><em>Thư được gửi tự động từ hệ thống Quản lý Khách hàng CRM.</em></p>','SENT',1,NULL,1,'2026-10-22 00:29:46',NULL,'2026-10-22 00:29:46','2026-10-22 00:29:46'),(7,NULL,NULL,NULL,'admin@crm.local','CRM Administrator','[CRM Thông báo] Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','<p>Kính gửi <strong>CRM Administrator</strong>,</p><p>Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.</p><p><a href=\"http://localhost:8080/crm/activities\" style=\"display:inline-block;padding:8px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">Xem chi tiết trên hệ thống CRM</a></p><p><em>Thư được gửi tự động từ hệ thống Quản lý Khách hàng CRM.</em></p>','SENT',1,NULL,1,'2026-10-22 00:29:46',NULL,'2026-10-22 00:29:46','2026-10-22 00:29:46'),(8,NULL,NULL,NULL,'admin@crm.local','CRM Administrator','[CRM Thông báo] C? h?i b??c v?o giai ?o?n Th??ng l??ng','<p>Kính gửi <strong>CRM Administrator</strong>,</p><p>C? h?i ?? ??t 80% x?c su?t th?ng, h?y chu?n b? k? c?c ?i?u kho?n ch?t h?p ??ng</p><p><a href=\"http://localhost:8080/crm/pipeline\" style=\"display:inline-block;padding:8px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">Xem chi tiết trên hệ thống CRM</a></p><p><em>Thư được gửi tự động từ hệ thống Quản lý Khách hàng CRM.</em></p>','SENT',1,NULL,1,'2026-10-22 00:29:51',NULL,'2026-10-22 00:29:51','2026-10-22 00:29:51'),(9,NULL,NULL,NULL,'admin@crm.local','CRM Administrator','[CRM Thông báo] Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','<p>Kính gửi <strong>CRM Administrator</strong>,</p><p>Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.</p><p><a href=\"http://localhost:8080/crm/activities\" style=\"display:inline-block;padding:8px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;\">Xem chi tiết trên hệ thống CRM</a></p><p><em>Thư được gửi tự động từ hệ thống Quản lý Khách hàng CRM.</em></p>','SENT',1,NULL,1,'2026-10-22 00:30:07',NULL,'2026-10-22 00:30:07','2026-10-22 00:30:07');
/*!40000 ALTER TABLE `email_queue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_html` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'MARKETING',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES (1,'Giới thiệu Giải pháp CRM Enterprise','Giới thiệu giải pháp CRM cho {{company_name}} - Kính gửi {{contact_name}}','<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>\n<p>Tôi là <strong>{{staff_name}}</strong>, đại diện bộ phận tư vấn giải pháp chuyển đổi số tại CRM Platform.</p>\n<p>Được biết <strong>{{company_name}}</strong> đang quan tâm đến việc nâng cao năng suất đội ngũ bán hàng và chuẩn hoá dữ liệu khách hàng tập trung, chúng tôi xin trân trọng giới thiệu bộ giải pháp CRM Doanh nghiệp toàn diện.</p>\n<ul>\n  <li>Quản lý phễu cơ hội và dự báo doanh số thời gian thực</li>\n  <li>Chăm sóc khách hàng đa kênh với Dòng thời gian 360 độ</li>\n  <li>Tự động hoá quy trình nhắc việc và phân bổ lead thông minh</li>\n</ul>\n<p>Nếu Anh/Chị <strong>{{contact_name}}</strong> quan tâm, em xin phép đặt lịch trao đổi nhanh 15 phút hoặc gửi tài liệu chuyên sâu hơn cho <strong>{{company_name}}</strong> ạ.</p>\n<p>Kính chúc Anh/Chị và Quý công ty luôn phát triển thịnh vượng!</p>\n<p>Trân trọng,<br><strong>{{staff_name}}</strong></p>','MARKETING',1,1,'2026-10-19 09:32:42','2026-10-19 09:32:42'),(2,'Theo dõi & Chăm sóc sau Báo giá','Theo dõi phản hồi báo giá dịch vụ - Kính gửi {{company_name}}','<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>\n<p>Em là <strong>{{staff_name}}</strong> phụ trách hỗ trợ <strong>{{company_name}}</strong>.</p>\n<p>Vừa qua bên em đã gửi tới Quý công ty hồ sơ đề xuất và bảng báo giá dịch vụ. Em viết email này nhằm kiểm tra xem Anh/Chị đã xem qua bảng chào giá chưa, và có cần bên em giải đáp hay bổ sung chính sách ưu đãi nào không ạ?</p>\n<p>Nếu cần điều chỉnh phạm vi triển khai hoặc phương thức thanh toán để phù hợp nhất với kế hoạch ngân sách của <strong>{{company_name}}</strong>, em luôn sẵn sàng hỗ trợ trực tiếp.</p>\n<p>Chúc Anh/Chị <strong>{{contact_name}}</strong> một tuần làm việc hiệu quả và nhiều thành công!</p>\n<p>Trân trọng,<br><strong>{{staff_name}}</strong></p>','SALES',1,1,'2026-10-19 09:32:42','2026-10-19 09:32:42'),(3,'Thư Cảm ơn & Chào mừng Khách hàng Mới','Chào mừng {{company_name}} đồng hành cùng chúng tôi!','<p>Kính gửi Anh/Chị <strong>{{contact_name}}</strong>,</p>\n<p>Thay mặt Ban Giám đốc và toàn thể đội ngũ, <strong>{{staff_name}}</strong> xin gửi lời cảm ơn chân thành nhất tới <strong>{{company_name}}</strong> đã tin tưởng lựa chọn chúng tôi làm đối tác.</p>\n<p>Tài khoản hệ thống và gói dịch vụ của Quý công ty đã được kích hoạt thành công. Đội ngũ chuyên gia CSKH sẽ chủ động liên hệ để hỗ trợ Anh/Chị và các phòng ban làm quen với phần mềm nhanh nhất.</p>\n<p>Mọi thắc mắc kỹ thuật trong quá trình vận hành, Anh/Chị có thể phản hồi trực tiếp qua email này hoặc hotline kỹ thuật 24/7.</p>\n<p>Kính chúc <strong>{{company_name}}</strong> gặt hái thêm nhiều bước tiến vượt bậc trong thời gian tới!</p>\n<p>Thân ái,<br><strong>{{staff_name}}</strong></p>','ONBOARDING',1,1,'2026-10-19 09:32:42','2026-10-19 09:32:42');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_assignment_logs`
--

DROP TABLE IF EXISTS `lead_assignment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_assignment_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lead_id` bigint NOT NULL,
  `rule_id` bigint DEFAULT NULL,
  `assigned_to_user_id` bigint NOT NULL,
  `assigned_by_user_id` bigint DEFAULT NULL,
  `method` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_lead` (`lead_id`),
  KEY `idx_log_assignee` (`assigned_to_user_id`),
  CONSTRAINT `fk_assign_log_customer` FOREIGN KEY (`lead_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_assignment_logs`
--

LOCK TABLES `lead_assignment_logs` WRITE;
/*!40000 ALTER TABLE `lead_assignment_logs` DISABLE KEYS */;
INSERT INTO `lead_assignment_logs` VALUES (1,26,1,4,NULL,'AUTO_RULE_ROUND_ROBIN','Phân bổ Khách hàng Miền Bắc & Hà Nội (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:06:41'),(2,27,1,5,NULL,'AUTO_RULE_ROUND_ROBIN','PhÃ¢n bá»• KhÃ¡ch hÃ ng Miá»n Báº¯c & HÃ  Ná»™i (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:06:41'),(3,28,NULL,7,1,'MANUAL_DISPATCH','Phân bổ thủ công từ hàng chờ','TrÆ°á»Ÿng nhÃ³m giao cho Äá»— Thá»‹ Tuyáº¿t chÄƒm sÃ³c','2026-10-14 13:06:42'),(4,29,1,4,NULL,'AUTO_RULE_ROUND_ROBIN','PhÃ¢n bá»• KhÃ¡ch hÃ ng Miá»n Báº¯c & HÃ  Ná»™i (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:10:52'),(5,30,1,5,NULL,'AUTO_RULE_ROUND_ROBIN','PhÃ¢n bá»• KhÃ¡ch hÃ ng Miá»n Báº¯c & HÃ  Ná»™i (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:10:53'),(6,31,NULL,7,1,'MANUAL_DISPATCH','Phân bổ thủ công từ hàng chờ','TrÆ°á»Ÿng nhÃ³m giao cho Äá»— Thá»‹ Tuyáº¿t chÄƒm sÃ³c','2026-10-14 13:10:53'),(7,32,1,4,NULL,'AUTO_RULE_ROUND_ROBIN','PhÃ¢n bá»• KhÃ¡ch hÃ ng Miá»n Báº¯c & HÃ  Ná»™i (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:12:56'),(8,33,1,5,NULL,'AUTO_RULE_ROUND_ROBIN','PhÃ¢n bá»• KhÃ¡ch hÃ ng Miá»n Báº¯c & HÃ  Ná»™i (Round Robin)','Phân bổ tự động qua quy tắc ưu tiên #1','2026-10-14 13:12:56'),(9,34,NULL,7,1,'MANUAL_DISPATCH','Phân bổ thủ công từ hàng chờ','TrÆ°á»Ÿng nhÃ³m giao cho Äá»— Thá»‹ Tuyáº¿t chÄƒm sÃ³c','2026-10-14 13:12:56'),(10,36,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-14 13:47:41'),(11,37,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach - Khach o Mien Nam','2026-10-14 13:47:42'),(12,38,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-14 13:49:12'),(13,39,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach - Khach o Mien Nam','2026-10-14 13:49:13'),(14,38,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #38 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #40 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #187 (Le Hoang Long), Cơ hội #172 (Trien khai CRM Enterprise cho Hoang Long Global).','2026-10-14 13:49:13'),(15,41,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-14 13:50:19'),(16,42,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach - Khach o Mien Nam','2026-10-14 13:50:19'),(17,41,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #41 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #43 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #190 (Le Hoang Long), Cơ hội #173 (Trien khai CRM Enterprise cho Hoang Long Global).','2026-10-14 13:50:19'),(18,44,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-14 13:50:42'),(19,45,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach - Khach o Mien Nam','2026-10-14 13:50:43'),(20,44,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #44 (Cong ty CP Giai phap Cong nghe Hoang Long) đã được chuyển đổi thành Khách hàng #46 (Cong ty CP Cong nghe Hoang Long Global), Người liên hệ #193 (Le Hoang Long), Cơ hội #174 (Trien khai CRM Enterprise cho Hoang Long Global).','2026-10-14 13:50:43'),(21,1,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-15 01:45:44'),(22,51,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #51 (Công ty TNHH Quảng cáo Sáng tạo Sunrise) đã được chuyển đổi thành Khách hàng #52 (Sunrise Test Corp), Người liên hệ #197 (Pháº¡m HoÃ ng Yáº¿n), Cơ hội #190 (Sunrise - GÃ³i CRM Pro 2026).','2026-10-15 02:09:20'),(23,52,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-15 02:09:38'),(24,52,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: KhÃ¡ch hÃ ng ngoÃ i khu vá»±c phá»¥ trÃ¡ch','2026-10-15 02:09:38'),(25,50,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #50 (Công ty Cổ phần Công nghệ SmartTech) đã được chuyển đổi thành Khách hàng #53 (SmartTech Enterprise Test), Người liên hệ #198 (Tráº§n Minh Tuáº¥n), Cơ hội #191 (SmartTech - GÃ³i Chuyá»ƒn Äá»•i Sá»‘).','2026-10-15 02:20:31'),(26,49,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-15 02:21:09'),(27,45,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach','2026-10-15 02:21:09'),(28,45,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-15 02:23:20'),(29,42,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach','2026-10-15 02:23:20'),(30,42,NULL,1,1,'ACCEPT_LEAD','Nhân viên nhận lead','Lead chuyển sang trạng thái Đang chăm sóc','2026-10-15 02:24:44'),(31,39,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban phu trach','2026-10-15 02:24:44'),(32,37,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #37 (Công ty TNHH Thời Trang Mai Vy) đã được chuyển đổi thành Khách hàng #56 (Nam Long Group Test), Người liên hệ #200 (Nguyen Hoang Nam), Cơ hội #193 (Nam Long - Hop dong Q4).','2026-10-15 02:24:44'),(33,52,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Test ly do tu choi lead','2026-10-19 04:24:48'),(34,52,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #52 (Sunrise Test Corp) đã được chuyển đổi thành Khách hàng #57 (Cong Ty Test Convert 52), Người liên hệ #201 (Nguyen Van Test), Cơ hội #198 (Co hoi Test Convert).','2026-10-19 04:28:32'),(35,45,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban hoac khong phu hop','2026-10-19 04:47:24'),(36,45,NULL,1,1,'REJECT_LEAD','Từ chối lead','Từ chối nhận lead. Lý do: Sai dia ban hoac khong phu hop','2026-10-19 04:47:53'),(37,45,NULL,1,1,'CONVERT_LEAD','Chuyển đổi Lead','Lead #45 (Công ty TNHH Thời Trang Mai Vy) đã được chuyển đổi thành Khách hàng #58 (Cong Ty Thoi Trang Mai Vy VIP), Người liên hệ #202 (Mai Thi Vy), Cơ hội #199 (Goi thiet ke thoi trang cao cap).','2026-10-19 04:48:09');
/*!40000 ALTER TABLE `lead_assignment_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_assignment_rules`
--

DROP TABLE IF EXISTS `lead_assignment_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_assignment_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` int NOT NULL DEFAULT '1',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `target_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ROUND_ROBIN',
  `assignee_user_id` bigint DEFAULT NULL,
  `assignee_team_id` bigint DEFAULT NULL,
  `assignee_user_ids` text COLLATE utf8mb4_unicode_ci,
  `last_assigned_user_id` bigint DEFAULT NULL,
  `condition_region_id` bigint DEFAULT NULL,
  `condition_industry_id` bigint DEFAULT NULL,
  `condition_lead_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition_company_size_id` bigint DEFAULT NULL,
  `condition_min_score` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assign_priority` (`priority`,`active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_assignment_rules`
--

LOCK TABLES `lead_assignment_rules` WRITE;
/*!40000 ALTER TABLE `lead_assignment_rules` DISABLE KEYS */;
INSERT INTO `lead_assignment_rules` VALUES (1,'Phân bổ Khách hàng Miền Bắc & Hà Nội (Round Robin)',1,1,'ROUND_ROBIN',NULL,2,'[4, 5]',5,22,NULL,NULL,NULL,NULL,'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Bắc',NULL,'2026-10-14 12:45:39','2026-10-14 15:25:23'),(2,'Phân bổ Khách hàng Miền Nam & TP.HCM (Round Robin)',2,1,'ROUND_ROBIN',NULL,7,'[9, 10]',NULL,26,NULL,NULL,NULL,NULL,'Tự động chia đều cho các chuyên viên kinh doanh thuộc Đội Miền Nam',NULL,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(3,'Phân bổ Khách hàng Đà Nẵng & Miền Trung (Direct)',3,1,'DIRECT_USER',7,NULL,NULL,NULL,24,NULL,NULL,NULL,NULL,'Chuyển trực tiếp cho Đỗ Thị Tuyết phụ trách thị trường miền Trung',NULL,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(4,'Phân bổ Lead Ngành Công nghệ thông tin B2B (Round Robin)',4,1,'ROUND_ROBIN',NULL,NULL,'[4, 9]',NULL,NULL,1,NULL,NULL,NULL,'Chuyên viên phụ trách khách hàng ngành phần mềm công nghệ',NULL,'2026-10-14 12:45:39','2026-10-14 15:27:22');
/*!40000 ALTER TABLE `lead_assignment_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_import_batches`
--

DROP TABLE IF EXISTS `lead_import_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_import_batches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `batch_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_rows` int NOT NULL DEFAULT '0',
  `valid_rows` int NOT NULL DEFAULT '0',
  `error_rows` int NOT NULL DEFAULT '0',
  `imported_rows` int NOT NULL DEFAULT '0',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_by` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `imported_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `batch_token` (`batch_token`),
  KEY `idx_batch_token` (`batch_token`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_import_batches`
--

LOCK TABLES `lead_import_batches` WRITE;
/*!40000 ALTER TABLE `lead_import_batches` DISABLE KEYS */;
INSERT INTO `lead_import_batches` VALUES (1,'1a603174e6ee43c1969bf54c311b360e','mau_nguoi_dung_hop_le.xlsx',5,0,5,0,'PENDING',1,'2026-10-15 01:18:02',NULL),(2,'6ef29baf55ae41ed8e60deb38a2bfc52','mau_import_lead_chuan.xlsx',3,3,0,0,'PENDING',1,'2026-10-15 01:18:36',NULL),(3,'70da086c93344ef1ba268a32c9b99683','Danh_sach_khach_hang_20261015_084304.xlsx',48,0,48,0,'PENDING',1,'2026-10-15 01:43:34',NULL),(4,'ebbe401cad004fe5b8dd66b930ca695f','test_template.xlsx',3,3,0,0,'PENDING',1,'2026-10-15 01:48:06',NULL),(5,'964aea5854464d4f973a3ae75f84a650','test_template.xlsx',3,3,0,0,'PENDING',1,'2026-10-15 01:53:37',NULL),(6,'5eeaeb18e8134c80b4918b6f5953a995','test_template.xlsx',3,3,0,3,'COMPLETED',1,'2026-10-15 01:54:03','2026-10-15 01:54:03'),(7,'6e07d046214940c4acbf1bfa7d240081','mau_import_lead_chuan.xlsx',3,3,0,0,'PENDING',1,'2026-10-15 01:57:34',NULL),(8,'a543c43c4f8b48cb933b5b4894ab3bce','mau_import_lead_chuan.xlsx',3,3,0,0,'PENDING',1,'2026-10-15 02:07:45',NULL);
/*!40000 ALTER TABLE `lead_import_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_routing_settings`
--

DROP TABLE IF EXISTS `lead_routing_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_routing_settings` (
  `setting_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_routing_settings`
--

LOCK TABLES `lead_routing_settings` WRITE;
/*!40000 ALTER TABLE `lead_routing_settings` DISABLE KEYS */;
INSERT INTO `lead_routing_settings` VALUES ('sla_auto_reassign_hours','24','Thời gian tự động thu hồi lead về hàng chờ nếu không phản hồi (giờ)','2026-10-17 06:08:46'),('sla_response_hours','4','Thời hạn SLA phản hồi tối đa của nhân viên (giờ)','2026-10-17 06:08:46');
/*!40000 ALTER TABLE `lead_routing_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_score_thresholds`
--

DROP TABLE IF EXISTS `lead_score_thresholds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_score_thresholds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `grade` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_score` int NOT NULL DEFAULT '0',
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grade` (`grade`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_score_thresholds`
--

LOCK TABLES `lead_score_thresholds` WRITE;
/*!40000 ALTER TABLE `lead_score_thresholds` DISABLE KEYS */;
INSERT INTO `lead_score_thresholds` VALUES (1,'HOT',70,'Nóng (Hot Lead)','#ef4444','🔥','Khả năng chốt cực cao, cần liên hệ ngay trong 15 phút','2026-10-14 12:45:39','2026-10-14 15:27:22'),(2,'WARM',40,'Ấm (Warm Lead)','#f59e0b','☀️','Có nhu cầu rõ ràng, cần liên hệ trong 4 giờ','2026-10-14 12:45:39','2026-10-14 15:27:22'),(3,'COLD',0,'Lạnh (Cold Lead)','#3b82f6','❄️','Tiềm năng thấp/mới tìm hiểu, ưu tiên nuôi dưỡng tự động','2026-10-14 12:45:39','2026-10-14 15:27:22');
/*!40000 ALTER TABLE `lead_score_thresholds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_scoring_rules`
--

DROP TABLE IF EXISTS `lead_scoring_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_scoring_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_scoring_category` (`category`,`active`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_scoring_rules`
--

LOCK TABLES `lead_scoring_rules` WRITE;
/*!40000 ALTER TABLE `lead_scoring_rules` DISABLE KEYS */;
INSERT INTO `lead_scoring_rules` VALUES (1,'INDUSTRY','1','Công nghệ thông tin & Viễn thông',25,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(2,'INDUSTRY','2','Bất động sản & Xây dựng',20,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(3,'INDUSTRY','6','Sản xuất & Chế tạo',20,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(4,'INDUSTRY','3','Bán lẻ & Thương mại điện tử',15,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(5,'INDUSTRY','4','Tài chính - Ngân hàng - Bảo hiểm',15,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(6,'COMPANY_SIZE','14','Trên 500 nhân sự (Doanh nghiệp lớn)',30,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(7,'COMPANY_SIZE','13','200 - 500 nhân sự',25,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(8,'COMPANY_SIZE','12','50 - 200 nhân sự',20,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(9,'COMPANY_SIZE','11','20 - 50 nhân sự',10,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(10,'COMPANY_SIZE','10','Dưới 20 nhân sự',5,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(11,'LEAD_SOURCE','GIOI_THIEU','Người quen giới thiệu (Độ tin cậy cao)',25,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(12,'LEAD_SOURCE','HOI_THAO','Hội thảo / Triển lãm ngành (VietBuild, TechFest)',20,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(13,'LEAD_SOURCE','WEBSITE','Website / Google Tìm kiếm tự nhiên',15,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(14,'LEAD_SOURCE','FACEBOOK','Quảng cáo Facebook Lead Ads',10,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(15,'LEAD_SOURCE','COLD_CALL','Telesales / Tiếp cận trực tiếp',5,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(16,'INTEREST_LEVEL','HIGH','Có dự toán rõ ràng & Cần triển khai gấp',25,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(17,'INTEREST_LEVEL','MEDIUM','Đang so sánh giải pháp với đối thủ',15,1,'2026-10-14 12:45:39','2026-10-14 15:27:22'),(18,'INTEREST_LEVEL','LOW','Chỉ xin bảng giá tham khảo',5,1,'2026-10-14 12:45:39','2026-10-14 15:27:22');
/*!40000 ALTER TABLE `lead_scoring_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_sla_alerts`
--

DROP TABLE IF EXISTS `lead_sla_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_sla_alerts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `lead_id` bigint NOT NULL,
  `assigned_user_id` bigint NOT NULL,
  `manager_user_id` bigint DEFAULT NULL,
  `alert_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SLA_BREACH',
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNREAD',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_sla_lead` (`lead_id`),
  KEY `fk_sla_assigned_user` (`assigned_user_id`),
  CONSTRAINT `fk_sla_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sla_lead` FOREIGN KEY (`lead_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_sla_alerts`
--

LOCK TABLES `lead_sla_alerts` WRITE;
/*!40000 ALTER TABLE `lead_sla_alerts` DISABLE KEYS */;
INSERT INTO `lead_sla_alerts` VALUES (1,26,4,4,'SLA_BREACH','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#26) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(2,27,5,5,'SLA_BREACH','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#27) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(3,28,7,7,'SLA_BREACH','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#28) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(4,29,4,4,'SLA_BREACH','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#29) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(5,30,5,5,'SLA_BREACH','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#30) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(6,31,7,7,'SLA_BREACH','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#31) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(7,32,4,4,'SLA_BREACH','Lead \"Tập đoàn Công nghệ Alpha Tech\" (#32) do Lê Hoàng Nam phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(8,33,5,5,'SLA_BREACH','Lead \"Công ty TNHH Dịch vụ Vận tải Bắc Việt\" (#33) do Phạm Mai Phương phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL),(9,34,7,7,'SLA_BREACH','Lead \"Công ty TNHH Năng lượng Mặt trời Xanh\" (#34) do Đỗ Thị Tuyết phụ trách đã quá hạn SLA 4 giờ mà chưa được phản hồi hoặc chăm sóc!','UNREAD','2026-10-15 00:10:04',NULL);
/*!40000 ALTER TABLE `lead_sla_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_data`
--

DROP TABLE IF EXISTS `master_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `master_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_master_type_code` (`type`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_data`
--

LOCK TABLES `master_data` WRITE;
/*!40000 ALTER TABLE `master_data` DISABLE KEYS */;
INSERT INTO `master_data` VALUES (1,'industry','CNTT','Công nghệ thông tin & Viễn thông',1,'2026-10-08 01:38:11',1),(2,'industry','BDS','Bất động sản & Xây dựng',1,'2026-10-08 01:38:11',2),(3,'industry','BAN_LE','Bán lẻ & Thương mại điện tử',1,'2026-10-08 01:38:11',3),(4,'industry','TAI_CHINH','Tài chính - Ngân hàng - Bảo hiểm',1,'2026-10-08 01:38:11',4),(5,'industry','Y_TE','Y tế & Dược phẩm',1,'2026-10-08 01:38:11',5),(6,'industry','SAN_XUAT','Sản xuất & Chế tạo',1,'2026-10-08 01:38:11',6),(7,'industry','GIAO_DUC','Giáo dục & Đào tạo',1,'2026-10-08 01:38:11',7),(8,'industry','DU_LICH','Du lịch & Khách sạn',1,'2026-10-08 01:38:11',8),(9,'industry','LOGISTICS','Vận tải & Logistics',1,'2026-10-08 01:38:11',9),(10,'company-size','DUOI_20','Dưới 20 nhân sự',1,'2026-10-08 01:38:11',1),(11,'company-size','20_50','20 - 50 nhân sự',1,'2026-10-08 01:38:11',2),(12,'company-size','50_200','50 - 200 nhân sự',1,'2026-10-08 01:38:11',3),(13,'company-size','200_500','200 - 500 nhân sự',1,'2026-10-08 01:38:11',4),(14,'company-size','TREN_500','Trên 500 nhân sự',1,'2026-10-08 01:38:11',5),(15,'lead-source','WEBSITE','Website / Google Tìm kiếm',1,'2026-10-08 01:38:11',1),(16,'lead-source','FACEBOOK','Mạng xã hội / Facebook Ads',1,'2026-10-08 01:38:11',2),(17,'lead-source','GIOI_THIEU','Người quen giới thiệu',1,'2026-10-08 01:38:11',3),(18,'lead-source','HOI_THAO','Hội thảo / Triển lãm ngành',1,'2026-10-08 01:38:11',4),(19,'lead-source','COLD_CALL','Telesales / Tiếp cận trực tiếp',1,'2026-10-08 01:38:11',5),(20,'region','TOAN_QUOC','Toàn quốc',1,'2026-10-08 01:53:32',1),(21,'region','MIEN_BAC','Khu vực Miền Bắc',1,'2026-10-08 01:53:32',2),(22,'region','HA_NOI','Khu vực Hà Nội',1,'2026-10-08 01:53:32',3),(23,'region','MIEN_TRUNG','Khu vực Miền Trung',1,'2026-10-08 01:53:32',4),(24,'region','DA_NANG','Khu vực Đà Nẵng & Duyên Hải',1,'2026-10-08 01:53:32',5),(25,'region','MIEN_NAM','Khu vực Miền Nam',1,'2026-10-08 01:53:32',6),(26,'region','TP_HCM','Khu vực TP. Hồ Chí Minh',1,'2026-10-08 01:53:32',7),(27,'region','DONG_NAM_BO','Khu vực Đông Nam Bộ',1,'2026-10-08 01:53:32',8),(28,'region','MEKONG','Khu vực Đồng bằng Sông Cửu Long',1,'2026-10-08 01:53:32',9),(29,'region','TAY_NGUYEN','Khu vực Tây Nguyên',1,'2026-10-08 01:53:32',10),(30,'industry','AAC','A',1,'2026-10-08 02:34:52',10),(31,'lead-source','SU_KIEN','Sự kiện / Hội nghị',1,'2026-10-14 02:46:30',6),(32,'lead-source','DANH_THIEP','Danh thiếp / Gặp gỡ trực tiếp',1,'2026-10-14 02:46:30',7);
/*!40000 ALTER TABLE `master_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'QUOTE_APPROVAL_REQUEST','B?o gi? BG-2026-003 ch? ph? duy?t','B?o gi? cho T?p ?o?n Vingroup c? chi?t kh?u 15% v??t th?m quy?n c?n b?n duy?t','quotations','QUOTE',1,1,'2026-10-19 08:44:47'),(2,2,'OPPORTUNITY_STAGNANT','C? h?i T?p ?o?n Masan b? g?n c? ??nh tr?','C? h?i ?? qu? 10 ng?y ch?a c? ho?t ??ng c?p nh?t m?i','pipeline','OPPORTUNITY',2,1,'2026-10-19 06:59:47'),(3,3,'LEAD_ASSIGNED','B?n ???c ph?n c?ng Kh?ch h?ng ti?m n?ng m?i','Lead: C?ng ty CP B?t ??ng s?n ??t Xanh Mi?n B?c v?a ???c chuy?n giao','customers?lead=1','LEAD',5,0,'2026-10-19 08:29:47'),(4,3,'QUOTE_RESPONSE','Kh?ch h?ng FPT Telecom ?? ph?n h?i b?o gi?','Kh?ch h?ng ??ng ? ph??ng ?n ?? xu?t v? y?u c?u g?i d? th?o h?p ??ng','quotations','QUOTE',3,0,'2026-10-19 07:59:47'),(5,4,'TASK_ASSIGNED','B?n ???c giao c?ng vi?c: H?p chu?n b? h? s? th?u','Tr??ng nh?m v?a ph?n c?ng c?ng vi?c m?i cho b?n h?n ch?t ng?y mai','activities','TASK',10,0,'2026-10-19 08:14:47'),(6,4,'LEAD_ASSIGNED','Lead m?i t? Web-to-Lead: Nguy?n V?n An','Lead c? nhu c?u tri?n khai ERP v? CRM cho 50 ng??i d?ng','customers?lead=1','LEAD',8,0,'2026-10-19 05:59:47'),(7,4,'TASK_ASSIGNED','Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','Hạn hoàn thành: sau 3 ngày (2026-10-22). Vui lòng kiểm tra và xử lý.','activities','TASK',0,0,'2026-10-19 09:15:44'),(8,4,'TASK_ASSIGNED','Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','Hạn hoàn thành: sau 3 ngày (2026-10-22). Vui lòng kiểm tra và xử lý.','activities','TASK',0,0,'2026-10-19 09:26:05'),(9,1,'TASK_ASSIGNED','Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.','activities','TASK',0,0,'2026-10-22 00:29:46'),(10,1,'TASK_ASSIGNED','Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.','activities','TASK',0,0,'2026-10-22 00:29:46'),(11,1,'AUTOMATION_ACTION','C? h?i b??c v?o giai ?o?n Th??ng l??ng','C? h?i ?? ??t 80% x?c su?t th?ng, h?y chu?n b? k? c?c ?i?u kho?n ch?t h?p ??ng','pipeline','OPPORTUNITY',198,0,'2026-10-22 00:29:51'),(12,1,'TASK_ASSIGNED','Bạn được giao công việc mới: G?i l?i ki?m tra ph?n h?i sau b?o gi?','Hạn hoàn thành: sau 3 ngày (2026-10-25). Vui lòng kiểm tra và xử lý.','activities','TASK',0,0,'2026-10-22 00:30:06');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunities`
--

DROP TABLE IF EXISTS `opportunities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `contact_id` bigint DEFAULT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT '0.00',
  `stage_id` bigint DEFAULT NULL,
  `stage_updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `probability` int DEFAULT '0',
  `probability_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expected_close_date` date DEFAULT NULL,
  `actual_close_date` date DEFAULT NULL,
  `lead_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `is_stagnant` tinyint(1) NOT NULL DEFAULT '0',
  `stagnant_flag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'NONE',
  `stagnant_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_stagnant_checked_at` datetime DEFAULT NULL,
  `win_reason_id` bigint DEFAULT NULL,
  `loss_reason_id` bigint DEFAULT NULL,
  `competitor_id` bigint DEFAULT NULL,
  `lost_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_override_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reopened_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reopened_by` bigint DEFAULT NULL,
  `reopened_at` datetime DEFAULT NULL,
  `last_overridden_by` bigint DEFAULT NULL,
  `last_overridden_at` datetime DEFAULT NULL,
  `owner_user_id` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `campaign_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_opp_owner` (`owner_user_id`),
  KEY `idx_opportunities_customer_status` (`customer_id`,`status`),
  KEY `fk_opportunities_campaign` (`campaign_id`),
  KEY `fk_opportunities_contact` (`contact_id`),
  CONSTRAINT `fk_opp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_opp_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_opportunities_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_opportunities_contact` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunities`
--

LOCK TABLES `opportunities` WRITE;
/*!40000 ALTER TABLE `opportunities` DISABLE KEYS */;
INSERT INTO `opportunities` VALUES (1,'Triển khai CRM Enterprise cho VPBank Thăng Long',1,NULL,NULL,225000000.00,4,'2026-09-20 00:00:00',80,NULL,'2026-11-20',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-07 15:16:01','2026-10-21 08:08:18',3),(2,'Gói CRM Cloud & Đào tạo cho NEM Fashion',5,NULL,'Phạm Quốc Hùng',181000000.00,3,'2026-10-14 14:54:57',60,NULL,'2026-11-02',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,0,'2026-10-08 02:24:36','2026-10-21 08:08:18',NULL),(3,'Tích hợp VoIP & Tổng đài Viettravel Sun',3,NULL,'Trần Minh Tuấn',24000000.00,2,'2026-10-14 14:54:57',30,NULL,'2026-11-22',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,6,0,'2026-10-08 02:24:36','2026-10-21 08:08:18',2),(4,'Nâng cấp hệ thống BI & Báo cáo LogiTech',9,NULL,'Đặng Hoàng Yến',95000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-10-03','2026-10-10',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,9,0,'2026-10-08 02:24:36','2026-10-19 07:50:14',NULL),(5,'Triển khai CRM cho Dược phẩm An Sinh',6,NULL,'Lê Thị Mai',120000000.00,4,'2026-10-14 14:54:57',80,NULL,'2026-10-18',NULL,NULL,'OPEN',1,'OVERDUE','Đã quá ngày dự kiến chốt 3 ngày (dự kiến: 2026-10-18)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,7,0,'2026-10-08 02:24:36','2026-10-21 08:08:18',NULL),(6,'Gói CRM Chuỗi bán lẻ TocoToco Tea',10,NULL,'Nguyễn Hải Đăng',65000000.00,3,'2026-10-14 14:54:57',60,NULL,'2026-11-07',NULL,NULL,'OPEN',1,'INACTIVE','Không có hoạt động nào trong 16 ngày (vượt mốc cho phép 10 ngày)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,10,0,'2026-10-08 02:24:36','2026-10-21 08:08:18',NULL),(7,'Bảo trì & Vận hành VIP GreenTech',11,NULL,'Vũ Thành Long',36000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-09-26','2026-10-12',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,8,0,'2026-10-08 02:24:36','2026-10-19 07:50:14',NULL),(8,'Tư vấn Chuyển đổi số Nam Á Machinery',7,NULL,'Đỗ Mạnh Cường',150000000.00,1,'2026-10-14 14:54:57',10,NULL,'2026-12-07',NULL,NULL,'OPEN',1,'INACTIVE','Không có hoạt động nào trong 9 ngày (vượt mốc cho phép 4 ngày)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-08 02:24:36','2026-10-21 08:08:18',2),(9,'Cung cấp Phần mềm CRM Enterprise & Tích hợp Tổng đài CTI',12,NULL,'Nguyễn Văn Phát',145000000.00,4,'2026-10-15 02:15:04',80,NULL,'2026-10-24',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-09 11:59:16','2026-10-21 08:08:18',1),(10,'Gói Đào tạo Chuyển giao & Tùy biến Quy trình Bán sỉ B2B',12,NULL,'Lê Hoàng Long',35000000.00,2,'2026-10-22 00:29:56',30,NULL,'2026-11-08',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-09 11:59:16','2026-10-22 00:29:56',1),(11,'Hợp đồng Khảo sát & Triển khai Thử nghiệm CRM (Pilot)',12,NULL,'Nguyễn Văn Phát',25000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-08-25','2026-10-14',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-09 11:59:16','2026-10-15 00:54:03',1),(12,'Module SMS Brandname & Zalo OA Thông báo đơn hàng đợt 1',12,NULL,'Trần Thị Thu Hương',12000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-09-19','2026-10-16',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-09 11:59:16','2026-10-19 07:50:14',1),(13,'Gói Máy chủ On-Premise chuyên dụng đặt tại Datacenter',12,NULL,'Phạm Quốc Cường',80000000.00,6,'2026-10-14 14:54:57',0,NULL,'2026-08-10','2026-10-05',NULL,'LOST',0,NULL,NULL,NULL,NULL,5,2,'Khách hàng chọn VinaCloud vì chi phí thấp hơn 30%',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-09 11:59:16','2026-10-22 00:32:48',1),(101,'Gói Mở rộng Máy chủ DataCenter Chi nhánh 2',13,NULL,NULL,95000000.00,5,'2026-10-14 14:54:57',50,NULL,'2026-11-20','2026-10-18',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4,0,'2026-10-09 13:23:16','2026-10-19 07:50:14',1),(151,'Hợp đồng Nâng cấp Băng thông Quốc tế & VPN',15,NULL,NULL,50000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-09-20','2026-10-14',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-09 13:55:05','2026-10-17 07:00:32',2),(152,'Dự án Tổng đài Cloud CallCenter 50 Agents',15,NULL,NULL,30000000.00,3,'2026-10-14 14:54:57',60,NULL,'2026-11-30',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-09 13:55:05','2026-10-21 08:08:18',2),(161,'Hợp đồng Nền tảng Quản trị Số Enterprise 2026',16,NULL,NULL,80000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-08-30','2026-10-14',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-09 13:55:05','2026-10-15 00:54:03',2),(162,'Hệ thống Phân tích Dữ liệu BI & AI Dashboard',16,NULL,NULL,60000000.00,2,'2026-10-14 14:54:57',40,NULL,'2026-12-15',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,0,'2026-10-09 13:55:05','2026-10-21 08:08:18',2),(171,'Hợp đồng Phần mềm Giám sát Thi công Dự án KĐT',17,NULL,NULL,120000000.00,5,'2026-10-14 14:54:57',100,NULL,'2026-07-15','2026-10-14',NULL,'WON',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,0,'2026-10-09 13:55:05','2026-10-15 00:54:03',2),(172,'Trien khai CRM Enterprise cho Hoang Long Global',40,NULL,'Le Hoang Long',85000000.00,2,'2026-10-14 14:54:57',10,NULL,'2026-11-13',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 13:49:13','2026-10-21 08:08:18',NULL),(173,'Trien khai CRM Enterprise cho Hoang Long Global',43,NULL,'Le Hoang Long',85000000.00,2,'2026-10-14 14:54:57',10,NULL,'2026-11-13',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 13:50:19','2026-10-21 08:08:18',NULL),(174,'Trien khai CRM Enterprise cho Hoang Long Global',46,NULL,'Le Hoang Long',85000000.00,1,'2026-10-22 00:29:58',10,NULL,'2026-11-13',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 13:50:43','2026-10-22 00:29:58',NULL),(175,'Cơ hội nâng cấp hệ thống ERP 2026',46,193,'Le Hoang Long',120000000.00,2,'2026-10-14 15:05:09',30,'Khách hàng có ngân sách lớn nên xác suất chốt cao hơn mặc định','2026-11-13',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:05:08','2026-10-21 08:08:18',NULL),(176,'Cơ hội mua thêm gói bảo trì & đào tạo',46,193,NULL,35000000.00,6,'2026-10-14 15:05:09',30,NULL,'2026-11-28','2026-10-08','Hội thảo / Sự kiện','LOST',0,NULL,NULL,'2026-10-19 07:36:23',NULL,7,1,'AlphaTech giảm giá mạnh và tặng kèm phần cứng',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:05:09','2026-10-22 00:32:48',NULL),(177,'Cơ hội nâng cấp hệ thống ERP 2026',46,193,'Le Hoang Long',120000000.00,3,'2026-10-22 00:29:46',60,'Khách hàng có ngân sách lớn nên xác suất chốt cao hơn mặc định','2026-11-13',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:07:38','2026-10-22 00:29:46',NULL),(178,'Cơ hội mua thêm gói bảo trì & đào tạo',46,193,NULL,35000000.00,6,'2026-10-14 15:07:38',30,NULL,'2026-11-28','2026-10-11','Hội thảo / Sự kiện','LOST',0,NULL,NULL,'2026-10-19 07:36:23',NULL,6,3,'NextGen có sẵn module quản lý chuỗi cung ứng chuyên sâu',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:07:38','2026-10-22 00:32:48',NULL),(179,'Cơ hội nâng cấp hệ thống ERP 2026',46,193,'Le Hoang Long',120000000.00,2,'2026-10-22 00:30:04',30,'Khách hàng có ngân sách lớn nên xác suất chốt cao hơn mặc định','2026-11-13',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:08:50','2026-10-22 00:30:04',NULL),(180,'Cơ hội mua thêm gói bảo trì & đào tạo',46,193,NULL,35000000.00,6,'2026-10-14 15:08:50',30,NULL,'2026-11-28','2026-10-14','Hội thảo / Sự kiện','LOST',0,NULL,NULL,'2026-10-19 07:36:23',NULL,8,2,'Sale phụ trách gửi báo giá trễ hơn thời hạn cam kết 3 ngày',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 15:08:50','2026-10-22 00:32:49',NULL),(181,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',1,NULL,NULL,48000000.00,1,'2026-10-14 16:37:53',15,NULL,'2026-11-14',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 16:37:53','2026-10-21 08:08:18',NULL),(182,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',1,NULL,NULL,48000000.00,6,'2026-10-14 16:38:22',15,NULL,'2026-11-14','2026-10-15','Website / Tìm kiếm','LOST',0,NULL,NULL,'2026-10-19 07:36:23',NULL,9,NULL,'Khách cắt giảm ngân sách IT sang quý sau',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 16:38:22','2026-10-22 00:32:49',NULL),(183,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',1,NULL,NULL,48000000.00,1,'2026-10-14 16:39:34',15,NULL,'2026-11-14',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 16:39:34','2026-10-21 08:08:18',NULL),(184,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',1,NULL,NULL,48000000.00,6,'2026-10-14 16:39:54',15,NULL,'2026-11-14','2026-10-17','Website / Tìm kiếm','LOST',0,NULL,NULL,'2026-10-19 07:36:23',NULL,5,4,'Khách quyết định đầu tư hệ thống ERP trọn gói của FastERP',NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-14 16:39:54','2026-10-22 00:32:49',NULL),(185,'Cơ hội Thử Nghiệm Sản Phẩm & Dịch Vụ Thuê Bao',1,NULL,NULL,48000000.00,3,'2026-10-22 00:30:06',60,NULL,'2026-11-14',NULL,'Website / Tìm kiếm','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,'Khách hàng đã trao đổi trực tiếp và xác nhận đầy đủ qua hotline, Trưởng nhóm duyệt chuyển giai đoạn.',NULL,NULL,NULL,1,'2026-10-14 16:40:09',1,0,'2026-10-14 16:40:09','2026-10-22 00:32:49',NULL),(186,'Test Story 1 - Hop dong chuyen doi so Enterprise',1,NULL,NULL,125000000.00,1,'2026-10-15 00:42:08',50,NULL,'2026-10-30','2026-10-15','WEBSITE','WON',0,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-15 00:42:08','2026-10-15 00:54:03',NULL),(187,'Test Story 1 - Hop dong chuyen doi so Enterprise',1,NULL,NULL,125000000.00,1,'2026-10-15 00:42:33',50,NULL,'2026-10-30','2026-10-15','WEBSITE','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',1,NULL,NULL,NULL,NULL,'Khách hàng yêu cầu thương thảo bổ sung thêm 2 module nâng cao',1,'2026-10-15 00:42:33',NULL,NULL,1,0,'2026-10-15 00:42:33','2026-10-21 08:08:18',NULL),(188,'Test Story 1 - Hop dong chuyen doi so Enterprise',1,NULL,NULL,125000000.00,6,'2026-10-15 00:43:01',50,NULL,'2026-10-30','2026-10-18','WEBSITE','LOST',0,NULL,NULL,'2026-10-19 07:36:23',1,10,1,'Không liên lạc được ban giám đốc khách hàng',NULL,'Khách hàng yêu cầu thương thảo bổ sung thêm 2 module nâng cao',1,'2026-10-15 00:43:01',NULL,NULL,1,0,'2026-10-15 00:43:01','2026-10-22 00:32:49',NULL),(189,'Test Story 1 - Hop dong chuyen doi so Enterprise',1,NULL,NULL,125000000.00,1,'2026-10-15 00:43:58',50,NULL,'2026-10-30','2026-10-15','WEBSITE','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',1,NULL,NULL,NULL,NULL,'Khách hàng yêu cầu thương thảo bổ sung thêm 2 module nâng cao',1,'2026-10-15 00:43:58',NULL,NULL,1,0,'2026-10-15 00:43:58','2026-10-21 08:08:18',NULL),(190,'Sunrise - Gói CRM Pro 2026',52,NULL,'Phạm Hoàng Yến',25000000.00,1,'2026-10-22 00:30:41',10,NULL,'2026-11-30',NULL,NULL,'OPEN',1,'INACTIVE','Không có hoạt động nào trong 6 ngày (vượt mốc cho phép 4 ngày)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-15 02:09:20','2026-10-22 00:32:47',2),(191,'SmartTech - Gói Chuyển Đổi Số',53,NULL,'Trần Minh Tuấn',45000000.00,1,'2026-10-15 02:20:31',10,NULL,'2026-11-20',NULL,NULL,'OPEN',1,'INACTIVE','Không có hoạt động nào trong 6 ngày (vượt mốc cho phép 4 ngày)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-15 02:20:31','2026-10-22 00:32:48',1),(193,'Nam Long - Hop dong Q4',56,NULL,'Nguyen Hoang Nam',27075000.00,5,'2026-10-18 14:28:05',100,NULL,'2026-11-25','2026-10-18',NULL,'WON',0,NULL,NULL,'2026-10-18 14:27:55',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-15 02:24:44','2026-10-18 14:28:05',NULL),(194,'Gia hạn HD-SAMPLE-EXPIRED-5D - Kế toán phụ trách',2,NULL,NULL,45000000.00,1,'2026-10-18 15:19:02',20,NULL,'2026-10-13',NULL,'EXISTING_CONTRACT_RENEWAL','OPEN',1,'OVERDUE','Đã quá ngày dự kiến chốt 8 ngày (dự kiến: 2026-10-13)','2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,0,'2026-10-18 15:19:02','2026-10-21 08:08:18',NULL),(195,'Gia hạn HD-SAMPLE-EXP-7D - Kế toán phụ trách',4,NULL,NULL,150000000.00,1,'2026-10-18 15:19:44',20,NULL,'2026-10-25',NULL,'EXISTING_CONTRACT_RENEWAL','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,0,'2026-10-18 15:19:44','2026-10-21 08:08:18',NULL),(196,'Gia hạn HD-TEST-1792333685067 - Kế toán phụ trách',56,NULL,NULL,27075000.00,1,'2026-10-18 15:20:04',20,NULL,'2026-10-25',NULL,'EXISTING_CONTRACT_RENEWAL','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-18 15:20:04','2026-10-21 08:08:18',NULL),(197,'Gia hạn HĐ HD-SAMPLE-EXP-15D - Kế toán phụ trách năm 2027',5,NULL,NULL,79800000.00,1,'2026-10-18 15:26:25',20,NULL,'2026-11-02',NULL,'EXISTING_CONTRACT_RENEWAL','OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,0,'2026-10-18 15:26:25','2026-10-21 08:08:18',NULL),(198,'Co hoi Test Convert',57,NULL,'Nguyen Van Test',15000000.00,4,'2026-10-22 00:29:50',80,NULL,'2026-11-30',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-19 04:28:32','2026-10-22 00:29:50',2),(199,'Goi thiet ke thoi trang cao cap',58,NULL,'Mai Thi Vy',85000000.00,2,'2026-10-22 00:30:00',30,NULL,'2026-11-18',NULL,NULL,'OPEN',0,NULL,NULL,'2026-10-21 08:08:18',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,0,'2026-10-19 04:48:09','2026-10-22 00:30:00',NULL);
/*!40000 ALTER TABLE `opportunities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunity_assignment_logs`
--

DROP TABLE IF EXISTS `opportunity_assignment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunity_assignment_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opportunity_id` bigint NOT NULL,
  `from_user_id` bigint DEFAULT NULL,
  `to_user_id` bigint NOT NULL,
  `assigned_by_user_id` bigint NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_opp_assign_opp` (`opportunity_id`),
  KEY `idx_opp_assign_from` (`from_user_id`),
  KEY `idx_opp_assign_to` (`to_user_id`),
  KEY `idx_opp_assign_by` (`assigned_by_user_id`),
  CONSTRAINT `fk_opp_assign_by` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_assign_from` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_opp_assign_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_assign_to` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunity_assignment_logs`
--

LOCK TABLES `opportunity_assignment_logs` WRITE;
/*!40000 ALTER TABLE `opportunity_assignment_logs` DISABLE KEYS */;
INSERT INTO `opportunity_assignment_logs` VALUES (1,152,4,5,3,'Nhân viên quá tải số lượng cơ hội (Cân bằng khối lượng công việc)','Đã gặp mặt khách hàng tuần trước, cần Mai Phương gọi lại để chốt báo giá gói 50 agents.','2026-10-17 06:59:19'),(2,1,4,5,3,'Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày','Bàn giao hàng loạt thương vụ miền Bắc cho Mai Phương tiếp quản trong thời gian Nam nghỉ phép.','2026-10-17 07:00:32'),(3,151,4,5,3,'Nhân viên phụ trách nghỉ phép / nghỉ ốm dài ngày','Bàn giao hàng loạt thương vụ miền Bắc cho Mai Phương tiếp quản trong thời gian Nam nghỉ phép.','2026-10-17 07:00:32');
/*!40000 ALTER TABLE `opportunity_assignment_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunity_field_history`
--

DROP TABLE IF EXISTS `opportunity_field_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunity_field_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opportunity_id` bigint NOT NULL,
  `field_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_value` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_by_user_id` bigint NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_opp_fh_opp` (`opportunity_id`),
  KEY `idx_opp_fh_user` (`changed_by_user_id`),
  KEY `idx_opp_fh_field` (`field_name`),
  CONSTRAINT `fk_opp_fh_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_fh_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunity_field_history`
--

LOCK TABLES `opportunity_field_history` WRITE;
/*!40000 ALTER TABLE `opportunity_field_history` DISABLE KEYS */;
INSERT INTO `opportunity_field_history` VALUES (1,1,'AMOUNT','Giá trị cơ hội','180,000,000 ₫','214,000,000 ₫',4,'Khách hàng mở rộng quy mô thêm 10 User Pro và bổ sung module bảo mật SSO','2026-10-15 11:18:52'),(2,1,'EXPECTED_CLOSE_DATE','Ngày dự kiến chốt','30/09/2026','05/10/2026',5,'VPBank kéo dài quy trình kiểm tra an ninh thông tin và phê duyệt mẫu HĐ','2026-10-13 11:18:52'),(3,1,'STAGE','Giai đoạn','Gửi báo giá','Thương lượng',3,'Khách hàng đã chốt phương án kỹ thuật và chuyển sang bước đàm phán điều khoản','2026-10-11 11:18:52'),(4,1,'OWNER','Người sở hữu','Nguyễn Văn Hùng','Phạm Mai Phương',1,'Bàn giao cho Trưởng nhóm chuyên trách mảng Tài chính - Ngân hàng','2026-10-08 11:18:52'),(5,2,'AMOUNT','Giá trị cơ hội','150,000,000 ₫','181,000,000 ₫',3,'Khách hàng quyết định đăng ký thêm gói Onsite Training cho toàn bộ quản lý cửa hàng','2026-10-16 11:18:52'),(6,2,'EXPECTED_CLOSE_DATE','Ngày dự kiến chốt','20/10/2026','02/11/2026',3,'NEM dời cuộc họp HĐQT xét duyệt ngân sách sang đầu tháng 11','2026-10-14 11:18:52'),(7,2,'STAGE','Giai đoạn','Đủ điều kiện','Gửi báo giá',3,'Hoàn thành bản khảo sát chi tiết và gửi báo giá chính thức kèm giải pháp','2026-10-10 11:18:52'),(8,5,'EXPECTED_CLOSE_DATE','Ngày dự kiến chốt','10/10/2026','18/10/2026',7,'Khách hàng yêu cầu chỉnh sửa điều khoản thanh toán theo đợt nghiệm thu','2026-10-17 11:18:52'),(9,5,'STAGE','Giai đoạn','Gửi báo giá','Thương lượng',6,'Khách hàng phản hồi tích cực và thống nhất cuộc họp thương thảo cuối cùng','2026-10-12 11:18:52'),(10,9,'AMOUNT','Giá trị cơ hội','120,000,000 ₫','145,000,000 ₫',1,'Bổ sung cổng kết nối SIP Trunk và 50 máy nhánh tổng đài','2026-10-16 11:18:52'),(11,9,'STAGE','Giai đoạn','Gửi báo giá','Thương lượng',1,'Hai bên đang rà soát hợp đồng kinh tế và cam kết SLA hỗ trợ 24/7','2026-10-14 11:18:52'),(12,1,'AMOUNT','Giá trị cơ hội','214,000,000 ₫','225,000,000 ₫',1,'Cập nhật thông tin cơ hội','2026-10-18 11:42:41'),(13,1,'EXPECTED_CLOSE_DATE','Ngày dự kiến chốt','05/10/2026','2026-11-20',1,'Điều chỉnh thời hạn chốt','2026-10-18 11:42:41'),(14,1,'stage_id','Giai đoạn bán hàng','Đề xuất giải pháp','Thương lượng & Đàm phán',4,'Khách hàng đã đồng ý về mặt kỹ thuật, chuyển sang đàm phán hợp đồng thương mại','2026-10-16 12:48:53'),(15,1,'amount','Giá trị cơ hội','200,000,000 ₫','225,000,000 ₫',4,'Bổ sung thêm 50 user license và gói hỗ trợ 24/7','2026-10-17 12:48:53'),(16,179,'STAGE','Giai đoạn','Đủ điều kiện','Gửi báo giá',1,'Chuyển giai đoạn quy trình','2026-10-22 00:29:45'),(17,177,'STAGE','Giai đoạn','Đủ điều kiện','Gửi báo giá',1,'Chuyển giai đoạn quy trình','2026-10-22 00:29:46'),(18,198,'STAGE','Giai đoạn','Mới tiếp cận','Thương lượng',1,'Chuyển giai đoạn quy trình','2026-10-22 00:29:50'),(19,10,'STAGE','Giai đoạn','Gửi báo giá','Đủ điều kiện',1,'Chuyển giai đoạn quy trình','2026-10-22 00:29:56'),(20,174,'STAGE','Giai đoạn','Đủ điều kiện','Mới tiếp cận',1,'Chuyển giai đoạn quy trình','2026-10-22 00:29:58'),(21,199,'STAGE','Giai đoạn','Mới tiếp cận','Đủ điều kiện',1,'Chuyển giai đoạn quy trình','2026-10-22 00:30:00'),(22,179,'STAGE','Giai đoạn','Gửi báo giá','Đủ điều kiện',1,'Chuyển giai đoạn quy trình','2026-10-22 00:30:04'),(23,185,'STAGE','Giai đoạn','Đủ điều kiện','Gửi báo giá',1,'Chuyển giai đoạn quy trình','2026-10-22 00:30:06'),(24,190,'STAGE','Giai đoạn','Mới tiếp cận','Đủ điều kiện',1,'Chuyển giai đoạn quy trình','2026-10-22 00:30:37'),(25,190,'STAGE','Giai đoạn','Đủ điều kiện','Mới tiếp cận',1,'Chuyển giai đoạn quy trình','2026-10-22 00:30:41');
/*!40000 ALTER TABLE `opportunity_field_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunity_items`
--

DROP TABLE IF EXISTS `opportunity_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunity_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opportunity_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `product_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONE_TIME',
  `quantity` int NOT NULL DEFAULT '1',
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `billing_cycle` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `billing_duration` int NOT NULL DEFAULT '1',
  `annual_contract_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_opp_items_product` (`product_id`),
  KEY `idx_opp_items_opportunity_id` (`opportunity_id`),
  CONSTRAINT `fk_opp_items_opportunity` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunity_items`
--

LOCK TABLES `opportunity_items` WRITE;
/*!40000 ALTER TABLE `opportunity_items` DISABLE KEYS */;
INSERT INTO `opportunity_items` VALUES (1,1,6,'SRV-IMPL-BASIC','Dịch vụ Triển khai & Cấu hình CRM Cơ bản','ONE_TIME',1,'Gói dự án',25000000.00,0.00,'ONE_TIME',1,25000000.00,25000000.00,'Triển khai chuẩn Onsite 5 ngày','2026-10-14 16:14:36','2026-10-14 16:14:36'),(2,1,4,'CRM-SEAT-PRO','Gói người dùng CRM Professional (User/tháng)','RECURRING',50,'Người dùng',350000.00,10.00,'MONTHLY',12,189000000.00,189000000.00,'Chiết khấu 10% gói hợp đồng 12 tháng (50 users)','2026-10-14 16:14:36','2026-10-14 16:14:36'),(3,2,3,'CRM-SEAT-STD','Gói người dùng CRM Standard (User/tháng)','RECURRING',100,'Người dùng',150000.00,5.00,'MONTHLY',12,171000000.00,171000000.00,'Thuê bao CRM 1 năm cho chuỗi 20 cửa hàng','2026-10-14 16:14:36','2026-10-14 16:14:36'),(4,2,8,'SRV-TRAIN-ON','Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)','ONE_TIME',2,'Buổi đào tạo',5000000.00,0.00,'ONE_TIME',1,10000000.00,10000000.00,'Đào tạo 2 đợt cho Quản lý cửa hàng','2026-10-14 16:14:36','2026-10-14 16:14:36'),(5,3,9,'MOD-VOIP-CALL','Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)','RECURRING',1,'Tháng',1200000.00,0.00,'MONTHLY',12,14400000.00,14400000.00,'Gói tích hợp tổng đài Cloud PBX 12 tháng','2026-10-14 16:14:36','2026-10-14 16:14:36'),(6,3,10,'MOD-ZALO-OA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','RECURRING',1,'Tháng',800000.00,0.00,'MONTHLY',12,9600000.00,9600000.00,'Tự động gửi thông báo lịch tour du lịch qua Zalo','2026-10-14 16:14:36','2026-10-14 16:14:36'),(7,181,14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','ONE_TIME',2,'Tháng',10000000.00,10.00,'ONE_TIME',1,18000000.00,18000000.00,'Triá»ƒn khai pháº§n má»m ban Ä‘áº§u','2026-10-14 16:37:53','2026-10-14 16:37:53'),(8,181,12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','SUBSCRIPTION',5,'NgÆ°á»i dÃ¹ng',500000.00,0.00,'MONTHLY',12,30000000.00,30000000.00,'GÃ³i thuÃª bao 12 thÃ¡ng cho 5 ngÆ°á»i dÃ¹ng','2026-10-14 16:37:53','2026-10-14 16:37:53'),(9,182,14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','ONE_TIME',2,'Tháng',10000000.00,10.00,'ONE_TIME',1,18000000.00,18000000.00,'Triá»ƒn khai pháº§n má»m ban Ä‘áº§u','2026-10-14 16:38:22','2026-10-14 16:38:22'),(10,182,12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','SUBSCRIPTION',5,'NgÆ°á»i dÃ¹ng',500000.00,0.00,'MONTHLY',12,30000000.00,30000000.00,'GÃ³i thuÃª bao 12 thÃ¡ng cho 5 ngÆ°á»i dÃ¹ng','2026-10-14 16:38:22','2026-10-14 16:38:22'),(11,183,14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','ONE_TIME',2,'Tháng',10000000.00,10.00,'ONE_TIME',1,18000000.00,18000000.00,'Triá»ƒn khai pháº§n má»m ban Ä‘áº§u','2026-10-14 16:39:34','2026-10-14 16:39:34'),(12,183,12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','SUBSCRIPTION',5,'NgÆ°á»i dÃ¹ng',500000.00,0.00,'MONTHLY',12,30000000.00,30000000.00,'GÃ³i thuÃª bao 12 thÃ¡ng cho 5 ngÆ°á»i dÃ¹ng','2026-10-14 16:39:34','2026-10-14 16:39:34'),(13,184,14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','ONE_TIME',2,'Tháng',10000000.00,10.00,'ONE_TIME',1,18000000.00,18000000.00,'Triá»ƒn khai pháº§n má»m ban Ä‘áº§u','2026-10-14 16:39:54','2026-10-14 16:39:54'),(14,184,12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','SUBSCRIPTION',5,'NgÆ°á»i dÃ¹ng',500000.00,0.00,'MONTHLY',12,30000000.00,30000000.00,'GÃ³i thuÃª bao 12 thÃ¡ng cho 5 ngÆ°á»i dÃ¹ng','2026-10-14 16:39:54','2026-10-14 16:39:54'),(15,185,14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','ONE_TIME',2,'Tháng',10000000.00,10.00,'ONE_TIME',1,18000000.00,18000000.00,'Triá»ƒn khai pháº§n má»m ban Ä‘áº§u','2026-10-14 16:40:09','2026-10-14 16:40:09'),(16,185,12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','SUBSCRIPTION',5,'NgÆ°á»i dÃ¹ng',500000.00,0.00,'MONTHLY',12,30000000.00,30000000.00,'GÃ³i thuÃª bao 12 thÃ¡ng cho 5 ngÆ°á»i dÃ¹ng','2026-10-14 16:40:09','2026-10-14 16:40:09'),(17,1,1,'SP-001','Gói giải pháp CRM Doanh nghiệp','ONE_TIME',2,'Gói',15000000.00,0.00,'MONTHLY',1,0.00,30000000.00,NULL,'2026-10-18 13:41:59','2026-10-18 13:41:59'),(18,1,2,'SP-002','Bản quyền phần mềm CRM Cloud theo năm','ONE_TIME',2,'Năm',6000000.00,0.00,'MONTHLY',1,0.00,12000000.00,NULL,'2026-10-18 13:41:59','2026-10-18 13:41:59'),(20,194,3,'CRM-SEAT-STD','Gói người dùng CRM Standard (User/tháng)','RECURRING',1,'Người dùng',45000000.00,0.00,'ANNUAL',1,45000000.00,45000000.00,'Kế thừa từ Hợp đồng HD-SAMPLE-EXPIRED-5D','2026-10-18 15:19:02','2026-10-18 15:19:02'),(21,195,1,'SP-001','Gói giải pháp CRM Doanh nghiệp','ONE_TIME',1,'Gói',150000000.00,0.00,'ANNUAL',1,150000000.00,150000000.00,'Kế thừa từ Hợp đồng HD-SAMPLE-EXP-7D','2026-10-18 15:19:44','2026-10-18 15:19:44'),(22,196,1,'SP-001','Gói giải pháp CRM Doanh nghiệp','ONE_TIME',2,'Gói',15000000.00,5.00,'ANNUAL',1,28500000.00,28500000.00,'Kế thừa từ Hợp đồng HD-TEST-1792333685067','2026-10-18 15:20:04','2026-10-18 15:20:04'),(23,197,2,'SP-002','Bản quyền phần mềm CRM Cloud theo năm','RECURRING',12,'Năm',7000000.00,5.00,'ANNUAL',1,79800000.00,79800000.00,'Kế thừa từ Hợp đồng HD-SAMPLE-EXP-15D','2026-10-18 15:26:25','2026-10-18 15:26:25'),(24,4,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',95000000.00,0.00,'MONTHLY',1,95000000.00,95000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-08 02:24:36','2026-10-19 07:50:14'),(25,5,1,'SP-001','GÃ³i giáº£i phÃ¡p CRM Doanh nghiá»‡p','ONE_TIME',1,'GÃ³i',120000000.00,0.00,'MONTHLY',1,120000000.00,120000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-08 02:24:36','2026-10-19 07:50:14'),(26,6,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',65000000.00,0.00,'MONTHLY',1,65000000.00,65000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-08 02:24:36','2026-10-19 07:50:14'),(27,7,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',36000000.00,0.00,'MONTHLY',1,36000000.00,36000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-08 02:24:36','2026-10-19 07:50:14'),(28,8,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',150000000.00,0.00,'MONTHLY',1,150000000.00,150000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-08 02:24:36','2026-10-19 07:50:14'),(29,9,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',145000000.00,0.00,'MONTHLY',1,145000000.00,145000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 11:59:16','2026-10-19 07:50:14'),(30,10,1,'SP-001','GÃ³i giáº£i phÃ¡p CRM Doanh nghiá»‡p','ONE_TIME',1,'GÃ³i',35000000.00,0.00,'MONTHLY',1,35000000.00,35000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 11:59:16','2026-10-19 07:50:14'),(31,11,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',25000000.00,0.00,'MONTHLY',1,25000000.00,25000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 11:59:16','2026-10-19 07:50:14'),(32,12,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',12000000.00,0.00,'MONTHLY',1,12000000.00,12000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 11:59:16','2026-10-19 07:50:14'),(33,13,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',80000000.00,0.00,'MONTHLY',1,80000000.00,80000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 11:59:16','2026-10-19 07:50:14'),(34,101,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',95000000.00,0.00,'MONTHLY',1,95000000.00,95000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:23:16','2026-10-19 07:50:14'),(35,151,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',50000000.00,0.00,'MONTHLY',1,50000000.00,50000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:55:05','2026-10-19 07:50:14'),(36,152,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',30000000.00,0.00,'MONTHLY',1,30000000.00,30000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:55:05','2026-10-19 07:50:14'),(37,161,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',80000000.00,0.00,'MONTHLY',1,80000000.00,80000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:55:05','2026-10-19 07:50:14'),(38,162,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',60000000.00,0.00,'MONTHLY',1,60000000.00,60000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:55:05','2026-10-19 07:50:14'),(39,171,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',120000000.00,0.00,'MONTHLY',1,120000000.00,120000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-09 13:55:05','2026-10-19 07:50:14'),(40,172,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',85000000.00,0.00,'MONTHLY',1,85000000.00,85000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 13:49:13','2026-10-19 07:50:14'),(41,173,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',85000000.00,0.00,'MONTHLY',1,85000000.00,85000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 13:50:19','2026-10-19 07:50:14'),(42,174,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',85000000.00,0.00,'MONTHLY',1,85000000.00,85000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 13:50:43','2026-10-19 07:50:14'),(43,175,1,'SP-001','GÃ³i giáº£i phÃ¡p CRM Doanh nghiá»‡p','ONE_TIME',1,'GÃ³i',120000000.00,0.00,'MONTHLY',1,120000000.00,120000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:05:08','2026-10-19 07:50:14'),(44,176,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',35000000.00,0.00,'MONTHLY',1,35000000.00,35000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:05:09','2026-10-19 07:50:14'),(45,177,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',120000000.00,0.00,'MONTHLY',1,120000000.00,120000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:07:38','2026-10-19 07:50:14'),(46,178,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',35000000.00,0.00,'MONTHLY',1,35000000.00,35000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:07:38','2026-10-19 07:50:14'),(47,179,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',120000000.00,0.00,'MONTHLY',1,120000000.00,120000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:08:50','2026-10-19 07:50:14'),(48,180,1,'SP-001','GÃ³i giáº£i phÃ¡p CRM Doanh nghiá»‡p','ONE_TIME',1,'GÃ³i',35000000.00,0.00,'MONTHLY',1,35000000.00,35000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-14 15:08:50','2026-10-19 07:50:14'),(49,186,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',125000000.00,0.00,'MONTHLY',1,125000000.00,125000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 00:42:08','2026-10-19 07:50:14'),(50,187,3,'SP-003','GÃ³i ngÆ°á»i dÃ¹ng CRM Standard','ONE_TIME',1,'GÃ³i',125000000.00,0.00,'MONTHLY',1,125000000.00,125000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 00:42:33','2026-10-19 07:50:14'),(51,188,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',125000000.00,0.00,'MONTHLY',1,125000000.00,125000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 00:43:01','2026-10-19 07:50:14'),(52,189,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',125000000.00,0.00,'MONTHLY',1,125000000.00,125000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 00:43:58','2026-10-19 07:50:14'),(53,190,1,'SP-001','GÃ³i giáº£i phÃ¡p CRM Doanh nghiá»‡p','ONE_TIME',1,'GÃ³i',25000000.00,0.00,'MONTHLY',1,25000000.00,25000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 02:09:20','2026-10-19 07:50:14'),(54,191,2,'SP-002','Báº£n quyá»n pháº§n má»m CRM Cloud theo nÄƒm','ONE_TIME',1,'GÃ³i',45000000.00,0.00,'MONTHLY',1,45000000.00,45000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 02:20:31','2026-10-19 07:50:14'),(55,193,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',27075000.00,0.00,'MONTHLY',1,27075000.00,27075000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-15 02:24:44','2026-10-19 07:50:14'),(56,198,4,'SP-004','GÃ³i ngÆ°á»i dÃ¹ng CRM Professional','ONE_TIME',1,'GÃ³i',15000000.00,0.00,'MONTHLY',1,15000000.00,15000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-19 04:28:32','2026-10-19 07:50:14'),(57,199,5,'SP-005','GÃ³i ngÆ°á»i dÃ¹ng CRM Enterprise','ONE_TIME',1,'GÃ³i',85000000.00,0.00,'MONTHLY',1,85000000.00,85000000.00,'Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ sáº£n pháº©m chÃ­nh','2026-10-19 04:48:09','2026-10-19 07:50:14');
/*!40000 ALTER TABLE `opportunity_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunity_members`
--

DROP TABLE IF EXISTS `opportunity_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunity_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opportunity_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `role_in_opportunity` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Th??nh vi??n tham gia',
  `can_log_activity` tinyint(1) NOT NULL DEFAULT '1',
  `can_change_owner` tinyint(1) NOT NULL DEFAULT '0',
  `added_by_user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opp_member` (`opportunity_id`,`user_id`),
  KEY `idx_opp_mem_opp` (`opportunity_id`),
  KEY `idx_opp_mem_user` (`user_id`),
  KEY `fk_opp_mem_by` (`added_by_user_id`),
  CONSTRAINT `fk_opp_mem_by` FOREIGN KEY (`added_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_mem_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_opp_mem_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunity_members`
--

LOCK TABLES `opportunity_members` WRITE;
/*!40000 ALTER TABLE `opportunity_members` DISABLE KEYS */;
INSERT INTO `opportunity_members` VALUES (1,1,4,'Chuyên gia Kỹ thuật & Pre-sales',1,0,1,'2026-10-09 11:18:52'),(2,1,1,'Giám sát điều hành',1,1,1,'2026-10-09 11:18:52'),(3,1,3,'Trưởng nhóm hỗ trợ đàm phán',1,0,1,'2026-10-13 11:18:52'),(4,2,5,'Hỗ trợ kinh doanh & Hợp đồng',1,0,3,'2026-10-11 11:18:52'),(5,2,4,'Tư vấn giải pháp kỹ thuật',1,0,3,'2026-10-12 11:18:52'),(6,5,6,'Trưởng nhóm giám sát & Cố vấn',1,0,7,'2026-10-14 11:18:52'),(7,9,4,'Kỹ sư triển khai CTI & Tổng đài',1,0,1,'2026-10-15 11:18:52');
/*!40000 ALTER TABLE `opportunity_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_units`
--

DROP TABLE IF EXISTS `organization_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_units` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sales-team',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_org_parent` (`parent_id`),
  KEY `fk_org_manager` (`manager_id`),
  CONSTRAINT `fk_org_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_org_parent` FOREIGN KEY (`parent_id`) REFERENCES `organization_units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_units`
--

LOCK TABLES `organization_units` WRITE;
/*!40000 ALTER TABLE `organization_units` DISABLE KEYS */;
INSERT INTO `organization_units` VALUES (1,'Khối Kinh doanh Toàn quốc',NULL,2,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','DIV-SALES','division','Toàn quốc','Điều hành toàn bộ hoạt động kinh doanh toàn quốc'),(2,'Phòng Kinh doanh Miền Bắc',1,3,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','DEPT-SALES-NORTH','department','Khu vực Miền Bắc','Quản lý toàn bộ thị trường phía Bắc từ Hà Tĩnh trở ra'),(3,'Nhóm Kinh doanh B2B Hà Nội',2,4,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','TEAM-HN-B2B','sales-team','Khu vực Hà Nội','Phụ trách khách hàng doanh nghiệp khối B2B tại Hà Nội'),(4,'Nhóm Kinh doanh B2C & Đại lý Miền Bắc',2,5,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','TEAM-MB-B2C','sales-team','Khu vực Miền Bắc','Phụ trách hệ thống kênh phân phối và khách hàng cá nhân phía Bắc'),(5,'Phòng Kinh doanh Miền Trung',1,6,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','DEPT-SALES-CENTRAL','department','Khu vực Miền Trung','Quản lý thị trường miền Trung và Tây Nguyên'),(6,'Nhóm Kinh doanh Đà Nẵng & Duyên Hải',5,7,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','TEAM-DN','sales-team','Khu vực Đà Nẵng & Duyên Hải','Phụ trách thị trường TP. Đà Nẵng, Quảng Nam, Quảng Ngãi'),(7,'Phòng Kinh doanh Miền Nam',1,8,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','DEPT-SALES-SOUTH','department','Khu vực Miền Nam','Quản lý thị trường TP.HCM và các tỉnh phía Nam'),(8,'Nhóm Kinh doanh Doanh nghiệp TP.HCM',7,9,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','TEAM-HCM-ENT','sales-team','Khu vực TP. Hồ Chí Minh','Chăm sóc và phát triển khách hàng Enterprise trọng điểm'),(9,'Nhóm Kinh doanh SME & Bán lẻ Phía Nam',7,10,1,'2026-10-08 01:53:32','2026-10-08 01:53:32','TEAM-HCM-SME','sales-team','Khu vực TP. Hồ Chí Minh','Phát triển khách hàng vừa và nhỏ tại khu vực TP.HCM & Đông Nam Bộ');
/*!40000 ALTER TABLE `organization_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_password_reset_user` (`user_id`),
  KEY `idx_password_reset_expires` (`expires_at`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'organization.read','Xem cơ cấu tổ chức'),(2,'organization.manage','Quản lý cơ cấu tổ chức'),(3,'winloss.read','Xem lý do thắng thua'),(4,'winloss.manage','Quản lý lý do thắng thua'),(5,'competitor.read','Xem đối thủ'),(6,'competitor.manage','Quản lý đối thủ'),(7,'permission.read','Xem phân quyền'),(8,'permission.manage','Quản lý phân quyền'),(9,'user.read','Xem người dùng'),(10,'user.create','Tạo người dùng'),(11,'user.update','Cập nhật người dùng'),(12,'user.delete','Xóa người dùng'),(13,'team.read','Xem nhóm kinh doanh'),(14,'team.assign','Gán nhóm kinh doanh'),(15,'user.lock','Khóa hoặc mở khóa người dùng'),(16,'user.transfer','Bàn giao dữ liệu người dùng'),(17,'audit.read','Xem nhật ký hệ thống'),(18,'user.import','Nhập người dùng Excel'),(19,'product.read','Xem sản phẩm'),(20,'product.create','Tạo sản phẩm'),(21,'product.update','Cập nhật sản phẩm'),(22,'product.delete','Xóa sản phẩm'),(23,'pricebook.read','Xem bảng giá'),(24,'pricebook.create','Tạo bảng giá'),(25,'masterdata.read','Xem danh mục dùng chung'),(26,'masterdata.manage','Quản lý danh mục dùng chung'),(27,'customfield.read','Xem trường tùy chỉnh'),(28,'customfield.manage','Quản lý trường tùy chỉnh'),(29,'pipeline.read','Xem quy trình bán hàng'),(30,'pipeline.manage','Quản lý quy trình bán hàng'),(31,'customer.read','Xem khách hàng'),(32,'customer.create','Tạo khách hàng'),(33,'customer.update','Sửa khách hàng'),(34,'customer.delete','Xóa khách hàng'),(35,'customer.export','Xuất khách hàng'),(36,'contact.read','Xem liên hệ'),(37,'contact.create','Tạo liên hệ'),(38,'contact.update','Sửa liên hệ'),(39,'lead.read','Xem khách hàng tiềm năng'),(40,'lead.create','Tạo khách hàng tiềm năng'),(41,'lead.update','Sửa khách hàng tiềm năng'),(42,'lead.assign','Phân bổ khách hàng tiềm năng'),(43,'opportunity.read','Xem cơ hội'),(44,'opportunity.create','Tạo cơ hội'),(45,'opportunity.update','Sửa cơ hội'),(46,'opportunity.close','Đóng cơ hội'),(47,'opportunity.export','Xuất cơ hội'),(48,'activity.read','Xem hoạt động'),(49,'activity.create','Tạo hoạt động'),(50,'activity.update','Sửa hoạt động'),(51,'activity.export','Xuất hoạt động'),(52,'task.read','Xem công việc'),(53,'task.create','Tạo công việc'),(54,'task.update','Sửa công việc'),(55,'quote.read','Xem báo giá'),(56,'quote.create','Tạo báo giá'),(57,'quote.update','Sửa báo giá'),(58,'quote.approve','Duyệt báo giá'),(59,'quote.export','Xuất báo giá'),(60,'contract.read','Xem hợp đồng'),(61,'contract.create','Tạo hợp đồng'),(62,'contract.update','Sửa hợp đồng'),(63,'kpi.read','Xem KPI'),(64,'kpi.manage','Quản lý KPI'),(65,'report.read','Xem báo cáo'),(66,'dashboard.read','Xem bảng tổng quan'),(67,'automation.read','Xem tự động hóa'),(68,'automation.manage','Quản lý tự động hóa'),(69,'notification.read','Xem thông báo'),(70,'role.read','Xem vai trò'),(71,'role.manage','Quản lý vai trò'),(72,'product.cost.read','Xem giá vốn sản phẩm'),(73,'product.cost.update','Cập nhật giá vốn sản phẩm'),(74,'contact.delete','Xóa liên hệ'),(75,'lead.form.manage','Quản lý biểu mẫu thu thập Lead'),(76,'lead.import','Nhập khách hàng tiềm năng từ Excel'),(78,'campaign.read','Xem chiến dịch marketing'),(79,'campaign.create','Tạo chiến dịch marketing'),(80,'campaign.update','Cập nhật chiến dịch marketing'),(81,'campaign.delete','Xóa chiến dịch marketing'),(82,'campaign.manage','Quản lý toàn diện chiến dịch'),(83,'lead.routing.read','Xem cấu hình phân bổ và chấm điểm lead'),(84,'lead.routing.manage','Quản lý quy tắc phân bổ và tiêu chí chấm điểm lead'),(85,'lead.convert','Chuyển đổi Lead thành Khách hàng & Cơ hội'),(86,'lead.sla.manage','Quản lý cảnh báo SLA và Thu hồi Lead'),(87,'report.lead_source','Xem báo cáo hiệu quả nguồn lead & chiến dịch');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pipeline_stages`
--

DROP TABLE IF EXISTS `pipeline_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_stages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pipeline_id` bigint NOT NULL DEFAULT '1',
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_no` int NOT NULL,
  `probability` int NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `exit_condition` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condition_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'NONE',
  `condition_required` tinyint(1) NOT NULL DEFAULT '0',
  `stagnant_days` int NOT NULL DEFAULT '7',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage_order` int NOT NULL DEFAULT '1',
  `win_probability` int NOT NULL DEFAULT '0',
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `is_won` tinyint(1) NOT NULL DEFAULT '0',
  `is_lost` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pipeline_order` (`pipeline_id`,`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pipeline_stages`
--

LOCK TABLES `pipeline_stages` WRITE;
/*!40000 ALTER TABLE `pipeline_stages` DISABLE KEYS */;
INSERT INTO `pipeline_stages` VALUES (1,1,'Mới tiếp cận',1,10,1,'2026-10-07 15:15:49',NULL,'NONE',0,4,'NEW',1,10,NULL,0,0,1),(2,1,'Đủ điều kiện',2,30,1,'2026-10-07 15:15:49','Phải thêm sản phẩm / dịch vụ vào cơ hội để xác định giá trị hợp đồng có căn cứ','HAS_PRODUCTS',1,7,'QUALIFIED',2,30,NULL,0,0,1),(3,1,'Gửi báo giá',3,60,1,'2026-10-07 15:15:49','Giá trị hợp đồng cơ hội phải lớn hơn 0 và đã gắn thông tin người liên hệ','MIN_AMOUNT',1,10,'PROPOSAL',3,60,NULL,0,0,1),(4,1,'Thương lượng',4,80,1,'2026-10-07 15:15:49',NULL,'NONE',0,14,'NEGOTIATION',4,80,NULL,0,0,1),(5,1,'Thành công (Won)',5,100,1,'2026-10-07 15:15:49',NULL,'NONE',0,999,'WON',5,100,NULL,1,0,1),(6,1,'Thất bại (Lost)',6,0,1,'2026-10-07 15:15:49',NULL,'NONE',0,999,'LOST',6,0,NULL,0,1,1);
/*!40000 ALTER TABLE `pipeline_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_book_lines`
--

DROP TABLE IF EXISTS `price_book_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_book_lines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `price_book_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `price` decimal(18,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pricebook_product` (`price_book_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `price_book_lines_ibfk_1` FOREIGN KEY (`price_book_id`) REFERENCES `price_books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_book_lines_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_book_lines`
--

LOCK TABLES `price_book_lines` WRITE;
/*!40000 ALTER TABLE `price_book_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_book_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_books`
--

DROP TABLE IF EXISTS `price_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_books`
--

LOCK TABLES `price_books` WRITE;
/*!40000 ALTER TABLE `price_books` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONE_TIME',
  `list_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `floor_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `cost_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'SP-001','Gói giải pháp CRM Doanh nghiệp','Gói',1,'2026-10-07 15:16:01','2026-10-08 01:38:11','ONE_TIME',15000000.00,12000000.00,8000000.00),(2,'SP-002','Bản quyền phần mềm CRM Cloud theo năm','Năm',1,'2026-10-07 15:16:01','2026-10-08 01:38:11','RECURRING',6000000.00,5000000.00,3000000.00),(3,'CRM-SEAT-STD','Gói người dùng CRM Standard (User/tháng)','Người dùng',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','RECURRING',150000.00,120000.00,60000.00),(4,'CRM-SEAT-PRO','Gói người dùng CRM Professional (User/tháng)','Người dùng',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','RECURRING',350000.00,280000.00,140000.00),(5,'CRM-SEAT-ENT','Gói người dùng CRM Enterprise (User/tháng)','Người dùng',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','RECURRING',650000.00,500000.00,250000.00),(6,'SRV-IMPL-BASIC','Dịch vụ Triển khai & Cấu hình CRM Cơ bản','Gói dự án',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','ONE_TIME',25000000.00,20000000.00,10000000.00),(7,'SRV-IMPL-ADV','Dịch vụ Tùy chỉnh Quy trình & Tích hợp ERP / Tổng đài VoIP','Gói dự án',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','ONE_TIME',60000000.00,48000000.00,25000000.00),(8,'SRV-TRAIN-ON','Khóa Đào tạo Chuyển giao Sử dụng CRM (Onsite)','Buổi đào tạo',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','ONE_TIME',5000000.00,4000000.00,2000000.00),(9,'MOD-VOIP-CALL','Module Tích hợp Tổng đài ảo & Ghi âm cuộc gọi (VoIP CTI)','Tháng',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','RECURRING',1200000.00,950000.00,500000.00),(10,'MOD-ZALO-OA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','Tháng',1,'2026-10-08 01:38:11','2026-10-08 02:33:39','subscription',800000.00,600000.00,300000.00),(11,'SRV-MAINT-VIP','Gói Bảo trì & Hỗ trợ Kỹ thuật VIP 24/7 (Hợp đồng năm)','Năm',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','RECURRING',18000000.00,15000000.00,7000000.00),(12,'MOD-BI-REPORT','Module Báo cáo Phân tích Chuyên sâu (Advanced BI & Analytics)','Gói vĩnh viễn',1,'2026-10-08 01:38:11','2026-10-08 01:38:11','ONE_TIME',35000000.00,28000000.00,12000000.00),(14,'MOD-ZALO-OAA','Module Gửi tin Zalo ZNS / Zalo OA & SMS Brandname Tự động','Tháng',1,'2026-10-10 07:34:50','2026-10-10 07:34:50','one-time',800000.00,600000.00,300000.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quote_approvals`
--

DROP TABLE IF EXISTS `quote_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_approvals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quote_id` bigint NOT NULL,
  `approver_user_id` bigint NOT NULL,
  `approver_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approver_role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `total_amount` decimal(18,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quote_approvals_quote` (`quote_id`),
  KEY `idx_quote_approvals_created` (`created_at`),
  KEY `fk_quote_approvals_user` (`approver_user_id`),
  CONSTRAINT `fk_quote_approvals_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quote_approvals_user` FOREIGN KEY (`approver_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quote_approvals`
--

LOCK TABLES `quote_approvals` WRITE;
/*!40000 ALTER TABLE `quote_approvals` DISABLE KEYS */;
INSERT INTO `quote_approvals` VALUES (1,11,1,'CRM Administrator','ADMIN','REQUEST_CHANGES','Vui lòng hạ bớt chiết khấu xuống dưới 20%',25.00,18750000.00,'2026-10-18 13:51:28'),(2,11,1,'CRM Administrator','ADMIN','APPROVE','Giám đốc đã đồng ý phê duyệt đặc cách',25.00,18750000.00,'2026-10-18 13:51:28'),(3,17,1,'CRM Administrator','ADMIN','REQUEST_CHANGES','Mức chiết khấu 25% quá cao, đề nghị giảm xuống dưới 18% để đảm bảo biên lợi nhuận.',25.00,18750000.00,'2026-10-18 14:00:36'),(4,17,1,'CRM Administrator','ADMIN','APPROVE','Giám đốc đồng ý phê duyệt đặc cách theo cam kết doanh số quý 4.',25.00,18750000.00,'2026-10-18 14:00:36'),(5,23,1,'CRM Administrator','ADMIN','REQUEST_CHANGES','Mức chiết khấu 25% quá cao, đề nghị giảm xuống dưới 18% để đảm bảo biên lợi nhuận.',25.00,18750000.00,'2026-10-18 14:01:42'),(6,23,1,'CRM Administrator','ADMIN','APPROVE','Giám đốc đồng ý phê duyệt đặc cách theo cam kết doanh số quý 4.',25.00,18750000.00,'2026-10-18 14:01:42');
/*!40000 ALTER TABLE `quote_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quote_items`
--

DROP TABLE IF EXISTS `quote_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quote_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERCENT',
  `discount_amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_qi_quote` (`quote_id`),
  CONSTRAINT `fk_qi_quote` FOREIGN KEY (`quote_id`) REFERENCES `quotes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quote_items`
--

LOCK TABLES `quote_items` WRITE;
/*!40000 ALTER TABLE `quote_items` DISABLE KEYS */;
INSERT INTO `quote_items` VALUES (1,1,5,100,650000.00,0.00,65000000.00,'PERCENT',0.00,NULL),(2,1,7,1,60000000.00,0.00,60000000.00,'PERCENT',0.00,NULL),(3,1,12,2,35000000.00,0.00,70000000.00,'PERCENT',0.00,NULL),(4,2,4,50,350000.00,0.00,17500000.00,'PERCENT',0.00,NULL),(5,2,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(6,2,10,1,800000.00,0.00,800000.00,'PERCENT',0.00,NULL),(7,2,11,1,18000000.00,0.00,18000000.00,'PERCENT',0.00,NULL),(8,3,3,40,150000.00,0.00,6000000.00,'PERCENT',0.00,NULL),(9,3,9,2,1200000.00,0.00,2400000.00,'PERCENT',0.00,NULL),(10,3,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(11,4,12,1,35000000.00,0.00,35000000.00,'PERCENT',0.00,NULL),(12,4,7,1,60000000.00,0.00,60000000.00,'PERCENT',0.00,NULL),(13,5,5,50,650000.00,0.00,32500000.00,'PERCENT',0.00,NULL),(14,5,7,1,60000000.00,0.00,60000000.00,'PERCENT',0.00,NULL),(15,5,8,2,5000000.00,0.00,10000000.00,'PERCENT',0.00,NULL),(16,6,4,30,350000.00,0.00,10500000.00,'PERCENT',0.00,NULL),(17,6,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(18,6,10,1,800000.00,0.00,800000.00,'PERCENT',0.00,NULL),(19,8,6,2,25000000.00,5.00,47500000.00,'PERCENT',2500000.00,'Chiết khấu thử nghiệm'),(20,9,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(21,10,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(22,11,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(23,12,6,1,19950000.00,0.00,19950000.00,'PERCENT',0.00,NULL),(24,13,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(27,14,6,3,25000000.00,5.00,71250000.00,'PERCENT',3750000.00,'Chiết khấu số lượng'),(28,14,4,1,350000.00,100.00,0.00,'AMOUNT',350000.00,'Giảm giá mở rộng'),(29,15,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(30,16,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(31,17,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(32,18,6,1,19000000.00,0.00,19000000.00,'PERCENT',0.00,NULL),(34,19,6,2,25000000.00,5.00,47500000.00,'PERCENT',2500000.00,NULL),(37,20,6,3,25000000.00,5.00,71250000.00,'PERCENT',3750000.00,'Chiết khấu số lượng'),(38,20,4,1,350000.00,100.00,0.00,'AMOUNT',350000.00,'Giảm giá mở rộng'),(39,21,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(40,22,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(41,23,6,1,25000000.00,0.00,25000000.00,'PERCENT',0.00,NULL),(42,24,6,1,19000000.00,0.00,19000000.00,'PERCENT',0.00,NULL),(44,25,6,2,25000000.00,5.00,47500000.00,'PERCENT',2500000.00,NULL),(45,26,1,2,15000000.00,5.00,28500000.00,'PERCENT',1500000.00,NULL),(46,27,1,2,15000000.00,5.00,28500000.00,'PERCENT',1500000.00,NULL),(47,28,1,2,15000000.00,5.00,28500000.00,'PERCENT',1500000.00,NULL),(48,29,1,2,15000000.00,5.00,28500000.00,'PERCENT',1500000.00,NULL);
/*!40000 ALTER TABLE `quote_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotes`
--

DROP TABLE IF EXISTS `quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quote_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `opportunity_id` bigint DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `owner_user_id` bigint DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `valid_until` date DEFAULT NULL,
  `payment_terms` text COLLATE utf8mb4_unicode_ci,
  `delivery_terms` text COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `approval_level` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NONE',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `sent_to_customer_at` datetime DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `parent_quote_id` bigint DEFAULT NULL,
  `is_active_version` tinyint(1) NOT NULL DEFAULT '1',
  `public_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_feedback` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_feedback_comment` text COLLATE utf8mb4_unicode_ci,
  `customer_feedback_at` datetime DEFAULT NULL,
  `contract_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_number` (`quote_number`),
  UNIQUE KEY `public_token` (`public_token`),
  KEY `fk_quote_customer` (`customer_id`),
  KEY `fk_quote_opp` (`opportunity_id`),
  KEY `fk_quote_owner` (`owner_user_id`),
  CONSTRAINT `fk_quote_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quote_opp` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quote_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotes`
--

LOCK TABLES `quotes` WRITE;
/*!40000 ALTER TABLE `quotes` DISABLE KEYS */;
INSERT INTO `quotes` VALUES (1,'BG-2026-001','Báo giá Triển khai CRM Enterprise VPBank',4,1,5.13,195000000.00,185000000.00,'SENT',1,4,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-04 11:00:00',1,NULL,1,'cfbfcac4e449d70fcad9fc79ba2a7f31',NULL,NULL,NULL,NULL),(2,'BG-2026-002','Báo giá Gói Cloud 100 Users NEM Fashion',5,2,4.00,75000000.00,72000000.00,'SENT',0,4,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-04 11:00:00',1,NULL,1,'fb339ad938654983340e94fb878235da',NULL,NULL,NULL,NULL),(3,'BG-2026-003','Báo giá Tích hợp VoIP & SMS Viettravel',3,3,6.25,48000000.00,45000000.00,'SENT',0,4,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-12 15:30:00',1,NULL,1,'70d26d5d6e0fe24db5714dc9f94c500b',NULL,NULL,NULL,NULL),(4,'BG-2026-004','Báo giá Module Advanced BI LogiTech',9,4,5.00,100000000.00,95000000.00,'SENT',1,4,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-12 15:30:00',1,NULL,1,'5f0a0cbdbb44540f4184d6a0dfe50739',NULL,NULL,NULL,NULL),(5,'BG-2026-005','Báo giá Triển khai Dược phẩm An Sinh',6,5,4.00,125000000.00,120000000.00,'SENT',1,4,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-17 09:45:00',1,NULL,1,'ceb0fbb41c4c4c0b6e1bacadcae31ea8',NULL,NULL,NULL,NULL),(6,'BG-2026-006','Báo giá CRM Chuỗi Cửa hàng TocoToco',10,6,4.41,68000000.00,65000000.00,'SENT',0,5,0,'2026-10-08 02:24:36','2026-10-19 07:50:14','2026-11-07','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-05 14:00:00',1,NULL,1,'c808b322044a27e0012f685347ad002c',NULL,NULL,NULL,NULL),(7,'BG-2026-VPB-01','Báo giá Triển khai Phần mềm CRM Enterprise VPBank (Gói chuẩn)',1,1,5.00,236842105.00,225000000.00,'SENT',0,5,0,'2026-10-17 12:48:53','2026-10-19 07:50:14','2026-11-16','Thanh toán đợt 1: 50% ngay sau khi ký hợp đồng; đợt 2: 50% trong vòng 7 ngày sau khi nghiệm thu bàn giao.','Triển khai cài đặt và cấu hình hệ thống trong vòng 10 ngày làm việc kể từ ngày nhận tạm ứng.',NULL,'NONE',NULL,'2026-10-05 14:00:00',1,NULL,1,'010d421108a800585623d9d57e6a3cfe',NULL,NULL,NULL,NULL),(8,'BG-487224','Báo giá bản nháp cho khách hàng',1,1,5.00,47500000.00,45125000.00,'SENT',0,5,0,'2026-10-18 13:51:27','2026-10-19 07:50:14','2026-11-30','Trả trước 50%, nhận hàng 50%','Giao trong 3 ngày làm việc','Bảo hành chính hãng 12 tháng','NONE',NULL,'2026-10-13 10:15:00',1,NULL,1,'4f272f44bfd7fe9aa2a5b7e36d0f51da',NULL,NULL,NULL,NULL),(9,'BG-487365','Báo giá tự động duyệt (CK 8%)',1,1,8.00,25000000.00,23000000.00,'SENT',0,7,0,'2026-10-18 13:51:27','2026-10-19 07:50:14',NULL,NULL,NULL,NULL,'NONE',NULL,'2026-10-06 09:30:00',1,NULL,1,'fecf0dafb41769a01e2f1b6d8450e62a',NULL,NULL,NULL,NULL),(10,'BG-487503','Báo giá chiết khấu 15% cần Trưởng nhóm duyệt',1,1,15.00,25000000.00,21250000.00,'SENT',1,7,0,'2026-10-18 13:51:27','2026-10-19 07:50:14',NULL,NULL,NULL,NULL,'TEAM_LEAD',NULL,'2026-10-06 09:30:00',1,NULL,1,'51c85e7ed9e053d2c0cc3b848c97978c',NULL,NULL,NULL,NULL),(11,'BG-487617','Báo giá chiết khấu 25% cần Giám đốc duyệt',1,1,25.00,25000000.00,18750000.00,'SENT',0,7,0,'2026-10-18 13:51:27','2026-10-19 07:50:14',NULL,NULL,NULL,NULL,'DIRECTOR',NULL,'2026-10-15 16:00:00',1,NULL,1,'48bec29d1065571ceb7aa3be6dfd30e0',NULL,NULL,NULL,NULL),(12,'BG-487761','Báo giá dưới giá sàn',1,1,0.00,19950000.00,19950000.00,'SENT',1,9,0,'2026-10-18 13:51:27','2026-10-19 07:50:14',NULL,NULL,NULL,NULL,'DIRECTOR',NULL,'2026-10-07 10:00:00',1,NULL,1,'991e9c3f29c9db2b99df58d6a8586dfc',NULL,NULL,NULL,NULL),(13,'BG-487617-V2','Báo giá chiết khấu 25% cần Giám đốc duyệt (v2)',1,1,25.00,25000000.00,18750000.00,'SENT',0,9,0,'2026-10-18 13:51:28','2026-10-19 07:50:14',NULL,NULL,NULL,NULL,'DIRECTOR',NULL,'2026-10-07 10:00:00',2,11,0,'e1be83dc5ec8de290f5dea4d336abf49',NULL,NULL,NULL,NULL),(14,'BG-35430','Báo giá triển khai hệ thống đợt 1 (Đã cập nhật)',1,1,5.00,71250000.00,67687500.00,'SENT',1,9,0,'2026-10-18 14:00:35','2026-10-19 07:50:14','2026-11-25','Đợt 1: Tạm ứng 30%; Đợt 2: Nghiệm thu 70%','Bàn giao tài liệu và giải pháp trong 10 ngày','Bảo hành hệ thống 12 tháng','DIRECTOR',NULL,'2026-10-16 11:20:00',1,NULL,1,'e4a7727fae9bb8e3ae8030032b9fdb5b',NULL,NULL,NULL,NULL),(15,'BG-35677','Báo giá tự động duyệt chiết khấu 7%',1,1,7.00,25000000.00,23250000.00,'SENT',0,9,0,'2026-10-18 14:00:35','2026-10-19 07:50:14','2026-11-30',NULL,NULL,NULL,'NONE',NULL,'2026-10-16 11:20:00',1,NULL,1,'a03c2e4de918de591466017a8d8c8219',NULL,NULL,NULL,NULL),(16,'BG-35790','Báo giá chiết khấu 16% cần Trưởng nhóm duyệt',1,1,16.00,25000000.00,21000000.00,'SENT',1,10,0,'2026-10-18 14:00:35','2026-10-19 07:50:14','2026-11-30',NULL,NULL,NULL,'TEAM_LEAD',NULL,'2026-10-08 14:30:00',1,NULL,1,'5bd2dc11206522eeeae188a10fda33d0',NULL,NULL,NULL,NULL),(17,'BG-35894','Báo giá chiết khấu 25% cần Giám đốc duyệt',1,1,25.00,25000000.00,18750000.00,'SENT',0,4,0,'2026-10-18 14:00:35','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'DIRECTOR',NULL,'2026-10-18 14:00:36',1,NULL,0,'600eb7d2d03bafe4e5940f862cf7c253',NULL,NULL,NULL,NULL),(18,'BG-36000','Báo giá dưới giá sàn sàn 20tr',1,1,0.00,19000000.00,19000000.00,'PENDING_APPROVAL',1,4,0,'2026-10-18 14:00:36','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'DIRECTOR',NULL,NULL,1,NULL,1,'d117cedd8e7f9c8583dbb989134964ee',NULL,NULL,NULL,NULL),(19,'BG-35894-V2','Báo giá chiết khấu 25% cần Giám đốc duyệt (v2) - Điều chỉnh giảm chiết khấu',1,1,18.00,47500000.00,38950000.00,'DRAFT',1,4,0,'2026-10-18 14:00:36','2026-10-18 14:07:07','2026-12-15','Đợt 1: 50%; Đợt 2: 50%',NULL,NULL,'DIRECTOR',NULL,NULL,2,17,1,'7947b744e45d07af295e218e280c5a4b',NULL,NULL,NULL,NULL),(20,'BG-101634','Báo giá triển khai hệ thống đợt 1 (Đã cập nhật)',1,1,5.00,71250000.00,67687500.00,'DRAFT',1,4,0,'2026-10-18 14:01:41','2026-10-18 14:07:07','2026-11-25','Đợt 1: Tạm ứng 30%; Đợt 2: Nghiệm thu 70%','Bàn giao tài liệu và giải pháp trong 10 ngày','Bảo hành hệ thống 12 tháng','DIRECTOR',NULL,NULL,1,NULL,1,'022b4583f9808288a0ee7ed4309c20e4',NULL,NULL,NULL,NULL),(21,'BG-101938','Báo giá tự động duyệt chiết khấu 7%',1,1,7.00,25000000.00,23250000.00,'APPROVED',0,4,0,'2026-10-18 14:01:41','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'NONE',NULL,NULL,1,NULL,1,'6100d67463dea7ad4a638e522eba4f56',NULL,NULL,NULL,NULL),(22,'BG-102073','Báo giá chiết khấu 16% cần Trưởng nhóm duyệt',1,1,16.00,25000000.00,21000000.00,'PENDING_APPROVAL',1,4,0,'2026-10-18 14:01:42','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'TEAM_LEAD',NULL,NULL,1,NULL,1,'fbe0192ef4b2e90293efc03c9b6701c5',NULL,NULL,NULL,NULL),(23,'BG-102179','Báo giá chiết khấu 25% cần Giám đốc duyệt',1,1,25.00,25000000.00,18750000.00,'SENT',0,4,0,'2026-10-18 14:01:42','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'DIRECTOR',NULL,'2026-10-18 14:01:43',1,NULL,0,'a40a3f388ec424aa480860aaed27c4cc',NULL,NULL,NULL,NULL),(24,'BG-102286','Báo giá dưới giá sàn sàn 20tr',1,1,0.00,19000000.00,19000000.00,'PENDING_APPROVAL',1,4,0,'2026-10-18 14:01:42','2026-10-18 14:07:07','2026-11-30',NULL,NULL,NULL,'DIRECTOR',NULL,NULL,1,NULL,1,'10f0ccb12746efee37f35d32dfbde916',NULL,NULL,NULL,NULL),(25,'BG-102179-V2','Báo giá chiết khấu 25% cần Giám đốc duyệt (v2) - Điều chỉnh giảm chiết khấu',1,1,18.00,47500000.00,38950000.00,'DRAFT',1,4,0,'2026-10-18 14:01:43','2026-10-18 14:07:07','2026-12-15','Đợt 1: 50%; Đợt 2: 50%',NULL,NULL,'DIRECTOR',NULL,NULL,2,23,1,'964c8a714fd0d0a381d07358ca5d1b5b',NULL,NULL,NULL,NULL),(26,'BG-516639','Báo giá Thử nghiệm Portal & Hợp đồng',56,193,5.00,28500000.00,27075000.00,'SENT',0,1,0,'2026-10-18 14:25:16','2026-10-18 14:25:16','2026-10-25','Thanh toán 50% khi ký hợp đồng, 50% khi hoàn thành nghiệm thu.',NULL,NULL,'NONE',NULL,'2026-10-18 14:25:16',1,NULL,1,'bd3775e9b6a54b299050fd4f3468db4f',NULL,NULL,NULL,NULL),(27,'BG-600046','Báo giá Thử nghiệm Portal & Hợp đồng',56,193,5.00,28500000.00,27075000.00,'ACCEPTED',0,1,0,'2026-10-18 14:26:40','2026-10-18 14:26:40','2026-10-25','Thanh toán 50% khi ký hợp đồng, 50% khi hoàn thành nghiệm thu.',NULL,NULL,'NONE',NULL,'2026-10-18 14:26:40',1,NULL,1,'1f5519a55d724e788c08812c51928373','ACCEPTED','Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!','2026-10-18 14:26:40',NULL),(28,'BG-684519','Báo giá Thử nghiệm Portal & Hợp đồng',56,193,5.00,28500000.00,27075000.00,'CONVERTED',0,1,0,'2026-10-18 14:28:04','2026-10-18 14:28:05','2026-10-25','Thanh toán 50% khi ký hợp đồng, 50% khi hoàn thành nghiệm thu.',NULL,NULL,'NONE',NULL,'2026-10-18 14:28:04',1,NULL,1,'fb69d637bf354fa083120a0a85610dd6','ACCEPTED','Khách hàng đồng ý với toàn bộ điều khoản và mức giá đề xuất!','2026-10-18 14:28:04',1),(29,'BG-685533','Báo giá Thử nghiệm Quá hạn Hiệu lực',56,193,0.00,28500000.00,28500000.00,'EXPIRED',0,1,0,'2026-10-18 14:28:05','2026-10-18 14:28:05','2026-10-17',NULL,NULL,NULL,'NONE',NULL,'2026-10-18 14:28:05',1,NULL,1,'36abaf401c134f2ea209868b865e283f',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_module_scopes`
--

DROP TABLE IF EXISTS `role_module_scopes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_module_scopes` (
  `role_id` bigint NOT NULL,
  `module_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`,`module_code`),
  CONSTRAINT `fk_role_module_scopes_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_role_module_scope` CHECK ((`scope_type` in (_latin1'SELF',_latin1'TEAM',_latin1'ALL')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_module_scopes`
--

LOCK TABLES `role_module_scopes` WRITE;
/*!40000 ALTER TABLE `role_module_scopes` DISABLE KEYS */;
INSERT INTO `role_module_scopes` VALUES (1,'activity','ALL'),(1,'customer','ALL'),(1,'opportunity','ALL'),(1,'quote','ALL'),(4,'activity','ALL'),(4,'customer','ALL'),(4,'opportunity','ALL'),(4,'quote','ALL'),(5,'activity','TEAM'),(5,'customer','TEAM'),(5,'opportunity','TEAM'),(5,'quote','TEAM'),(6,'activity','SELF'),(6,'customer','SELF'),(6,'opportunity','SELF'),(6,'quote','SELF'),(7,'activity','SELF'),(7,'customer','SELF'),(7,'opportunity','SELF'),(7,'quote','SELF'),(8,'activity','SELF'),(8,'customer','SELF'),(8,'opportunity','SELF'),(8,'quote','SELF'),(9,'activity','SELF'),(9,'customer','SELF'),(9,'opportunity','SELF'),(9,'quote','SELF');
/*!40000 ALTER TABLE `role_module_scopes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(1,2),(4,2),(1,3),(4,3),(5,3),(6,3),(7,3),(8,3),(9,3),(1,4),(4,4),(1,5),(4,5),(5,5),(6,5),(7,5),(8,5),(9,5),(1,6),(4,6),(1,7),(1,8),(1,9),(4,9),(1,10),(1,11),(1,12),(1,13),(4,13),(5,13),(1,14),(1,15),(1,16),(1,17),(4,17),(1,18),(1,19),(4,19),(5,19),(6,19),(7,19),(8,19),(9,19),(1,20),(4,20),(1,21),(4,21),(1,22),(4,22),(1,23),(4,23),(5,23),(6,23),(7,23),(8,23),(9,23),(1,24),(4,24),(1,25),(4,25),(5,25),(6,25),(7,25),(8,25),(9,25),(1,26),(4,26),(1,27),(4,27),(5,27),(6,27),(7,27),(8,27),(9,27),(1,28),(4,28),(1,29),(4,29),(5,29),(6,29),(7,29),(8,29),(9,29),(1,30),(4,30),(1,31),(4,31),(5,31),(6,31),(7,31),(8,31),(9,31),(1,32),(4,32),(5,32),(6,32),(7,32),(8,32),(1,33),(4,33),(5,33),(6,33),(7,33),(8,33),(1,34),(4,34),(5,34),(6,34),(1,35),(4,35),(5,35),(6,35),(7,35),(8,35),(1,36),(4,36),(5,36),(6,36),(7,36),(8,36),(1,37),(4,37),(5,37),(6,37),(7,37),(8,37),(1,38),(4,38),(5,38),(6,38),(7,38),(8,38),(1,39),(4,39),(5,39),(6,39),(7,39),(1,40),(4,40),(5,40),(6,40),(7,40),(1,41),(4,41),(5,41),(6,41),(7,41),(1,42),(4,42),(5,42),(7,42),(1,43),(4,43),(5,43),(6,43),(7,43),(8,43),(9,43),(1,44),(4,44),(5,44),(6,44),(1,45),(4,45),(5,45),(6,45),(1,46),(4,46),(5,46),(6,46),(1,47),(4,47),(5,47),(6,47),(1,48),(4,48),(5,48),(6,48),(7,48),(8,48),(1,49),(4,49),(5,49),(6,49),(7,49),(8,49),(1,50),(4,50),(5,50),(6,50),(7,50),(8,50),(1,51),(4,51),(5,51),(6,51),(7,51),(8,51),(1,52),(4,52),(5,52),(6,52),(8,52),(1,53),(4,53),(5,53),(6,53),(8,53),(1,54),(4,54),(5,54),(6,54),(8,54),(1,55),(4,55),(5,55),(6,55),(8,55),(9,55),(1,56),(4,56),(5,56),(6,56),(9,56),(1,57),(4,57),(5,57),(6,57),(9,57),(1,58),(4,58),(1,59),(4,59),(5,59),(6,59),(9,59),(1,60),(4,60),(5,60),(6,60),(8,60),(9,60),(1,61),(4,61),(9,61),(1,62),(4,62),(9,62),(1,63),(4,63),(5,63),(6,63),(9,63),(1,64),(4,64),(5,64),(1,65),(4,65),(5,65),(6,65),(7,65),(8,65),(9,65),(1,66),(4,66),(5,66),(6,66),(7,66),(8,66),(9,66),(1,67),(4,67),(5,67),(6,67),(7,67),(8,67),(1,68),(4,68),(7,68),(1,69),(4,69),(5,69),(6,69),(7,69),(8,69),(1,70),(4,70),(1,71),(1,72),(4,72),(1,73),(4,73),(1,74),(4,74),(5,74),(6,74),(1,75),(7,75),(1,76),(7,76),(1,78),(4,78),(7,78),(1,79),(4,79),(7,79),(1,80),(4,80),(7,80),(1,81),(4,81),(7,81),(1,82),(4,82),(7,82),(1,83),(4,83),(1,84),(4,84),(1,85),(4,85),(1,86),(4,86),(1,87),(4,87),(7,87);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN','Quản trị hệ thống'),(4,'DIRECTOR','Giám đốc kinh doanh'),(5,'TEAM_LEAD','Trưởng nhóm kinh doanh'),(6,'SALES_REP','Nhân viên kinh doanh'),(7,'MARKETING','Nhân viên Marketing'),(8,'CUSTOMER_SUCCESS','Chăm sóc khách hàng'),(9,'ACCOUNTANT','Kế toán');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_targets`
--

DROP TABLE IF EXISTS `sales_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_targets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `team_id` bigint DEFAULT NULL,
  `period_year` int NOT NULL,
  `period_month` int DEFAULT NULL,
  `period_quarter` int DEFAULT NULL,
  `target_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `target_deals` int DEFAULT '0',
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_targets_period` (`period_year`,`period_month`,`period_quarter`),
  KEY `idx_sales_targets_user` (`user_id`),
  KEY `idx_sales_targets_team` (`team_id`),
  KEY `fk_sales_targets_creator` (`created_by`),
  CONSTRAINT `fk_sales_targets_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_target_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_target_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_targets`
--

LOCK TABLES `sales_targets` WRITE;
/*!40000 ALTER TABLE `sales_targets` DISABLE KEYS */;
INSERT INTO `sales_targets` VALUES (1,4,3,2026,10,4,250000000.00,0,'Chỉ tiêu Tháng 10 - Lê Hoàng Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(2,5,4,2026,10,4,200000000.00,0,'Chỉ tiêu Tháng 10 - Phạm Mai Phương',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(3,7,6,2026,10,4,180000000.00,0,'Chỉ tiêu Tháng 10 - Đỗ Thị Tuyết',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(4,9,8,2026,10,4,220000000.00,0,'Chỉ tiêu Tháng 10 - Hoàng Kim Yến',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(5,10,9,2026,10,4,150000000.00,0,'Chỉ tiêu Tháng 10 - Trương Tuấn Anh',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(6,1,NULL,2026,10,4,300000000.00,0,'Chỉ tiêu Tháng 10 - Quản trị viên',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(7,4,3,2026,11,4,300000000.00,0,'Chỉ tiêu Tháng 11 - Lê Hoàng Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(8,5,4,2026,11,4,220000000.00,0,'Chỉ tiêu Tháng 11 - Phạm Mai Phương',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(9,7,6,2026,11,4,200000000.00,0,'Chỉ tiêu Tháng 11 - Đỗ Thị Tuyết',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(10,9,8,2026,11,4,250000000.00,0,'Chỉ tiêu Tháng 11 - Hoàng Kim Yến',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(11,10,9,2026,11,4,180000000.00,0,'Chỉ tiêu Tháng 11 - Trương Tuấn Anh',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(12,1,NULL,2026,11,4,350000000.00,0,'Chỉ tiêu Tháng 11 - Quản trị viên',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(13,4,3,2026,NULL,4,800000000.00,0,'Chỉ tiêu Quý 4 - Lê Hoàng Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(14,5,4,2026,NULL,4,650000000.00,0,'Chỉ tiêu Quý 4 - Phạm Mai Phương',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(15,7,6,2026,NULL,4,600000000.00,0,'Chỉ tiêu Quý 4 - Đỗ Thị Tuyết',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(16,9,8,2026,NULL,4,700000000.00,0,'Chỉ tiêu Quý 4 - Hoàng Kim Yến',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(17,10,9,2026,NULL,4,500000000.00,0,'Chỉ tiêu Quý 4 - Trương Tuấn Anh',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(18,1,NULL,2026,NULL,4,900000000.00,0,'Chỉ tiêu Quý 4 - Quản trị viên',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(19,NULL,3,2026,10,4,500000000.00,0,'Chỉ tiêu Tháng 10 - Nhóm KD B2B Hà Nội',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(20,NULL,4,2026,10,4,400000000.00,0,'Chỉ tiêu Tháng 10 - Nhóm KD B2C & Đại lý Miền Bắc',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(21,NULL,6,2026,10,4,350000000.00,0,'Chỉ tiêu Tháng 10 - Nhóm KD Đà Nẵng & Duyên Hải',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(22,NULL,8,2026,10,4,450000000.00,0,'Chỉ tiêu Tháng 10 - Nhóm KD Doanh nghiệp TP.HCM',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(23,NULL,9,2026,10,4,300000000.00,0,'Chỉ tiêu Tháng 10 - Nhóm KD SME & Bán lẻ Phía Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(24,NULL,3,2026,11,4,600000000.00,0,'Chỉ tiêu Tháng 11 - Nhóm KD B2B Hà Nội',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(25,NULL,4,2026,11,4,450000000.00,0,'Chỉ tiêu Tháng 11 - Nhóm KD B2C & Đại lý Miền Bắc',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(26,NULL,6,2026,11,4,400000000.00,0,'Chỉ tiêu Tháng 11 - Nhóm KD Đà Nẵng & Duyên Hải',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(27,NULL,8,2026,11,4,500000000.00,0,'Chỉ tiêu Tháng 11 - Nhóm KD Doanh nghiệp TP.HCM',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(28,NULL,9,2026,11,4,350000000.00,0,'Chỉ tiêu Tháng 11 - Nhóm KD SME & Bán lẻ Phía Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(29,NULL,3,2026,NULL,4,1600000000.00,0,'Chỉ tiêu Quý 4 - Nhóm KD B2B Hà Nội',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(30,NULL,4,2026,NULL,4,1300000000.00,0,'Chỉ tiêu Quý 4 - Nhóm KD B2C & Đại lý Miền Bắc',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(31,NULL,6,2026,NULL,4,1100000000.00,0,'Chỉ tiêu Quý 4 - Nhóm KD Đà Nẵng & Duyên Hải',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(32,NULL,8,2026,NULL,4,1400000000.00,0,'Chỉ tiêu Quý 4 - Nhóm KD Doanh nghiệp TP.HCM',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46'),(33,NULL,9,2026,NULL,4,950000000.00,0,'Chỉ tiêu Quý 4 - Nhóm KD SME & Bán lẻ Phía Nam',NULL,NULL,'2026-10-15 00:18:25','2026-10-17 06:08:46');
/*!40000 ALTER TABLE `sales_targets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_filters`
--

DROP TABLE IF EXISTS `saved_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_filters` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filter_criteria` json NOT NULL,
  `is_preset` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_saved_filters_user_mod` (`user_id`,`module`),
  CONSTRAINT `fk_saved_filters_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_filters`
--

LOCK TABLES `saved_filters` WRITE;
/*!40000 ALTER TABLE `saved_filters` DISABLE KEYS */;
INSERT INTO `saved_filters` VALUES (76,1,'CUSTOMER','🔥 Cần gọi sáng nay (Lead Nóng)','{\"status\": \"TIEM_NANG\", \"scoreGrade\": \"HOT\", \"ownerFilter\": \"MINE\"}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(77,1,'CUSTOMER','🚨 Quá hạn SLA (Cần xử lý gấp)','{\"slaBreached\": true}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(78,1,'CUSTOMER','📥 Lead mới phân bổ (Chờ nhận)','{\"status\": \"TIEM_NANG\", \"ownerFilter\": \"MINE\", \"assignmentStatus\": \"ASSIGNED\"}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(79,1,'CUSTOMER','📞 Đang chăm sóc tuần này','{\"status\": \"DANG_CHAM_SOC\", \"ownerFilter\": \"MINE\"}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(80,1,'CUSTOMER','🎪 Nguồn Sự kiện & Hội thảo','{\"leadSource\": \"HOI_THAO\"}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(81,1,'CUSTOMER','📱 Nguồn Facebook Lead Ads','{\"leadSource\": \"FACEBOOK\"}',1,'2026-10-14 15:27:22','2026-10-14 15:27:22'),(82,1,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(83,2,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(84,3,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(85,4,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(86,5,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(87,6,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(88,7,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(89,8,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(90,9,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(91,10,'OPPORTUNITY','🎯 Thương vụ cần đẩy trong tuần này','{\"stageId\": 4, \"closeDatePreset\": \"THIS_MONTH\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(97,1,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(98,2,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(99,3,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(100,4,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(101,5,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(102,6,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(103,7,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(104,8,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(105,9,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(106,10,'OPPORTUNITY','💎 Cơ hội giá trị cao (> 100M)','{\"minAmount\": 100000000}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(112,1,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(113,2,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(114,3,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(115,4,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(116,5,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(117,6,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(118,7,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(119,8,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(120,9,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(121,10,'OPPORTUNITY','⭐ Cơ hội của tôi','{\"ownerFilter\": \"MINE\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(127,1,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(128,2,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(129,3,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(130,4,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(131,5,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(132,6,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(133,7,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(134,8,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(135,9,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(136,10,'OPPORTUNITY','⚡ Giai đoạn Báo giá & Đàm phán','{\"stageId\": 3}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(142,1,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(143,2,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(144,3,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(145,4,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(146,5,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(147,6,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(148,7,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(149,8,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(150,9,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50'),(151,10,'OPPORTUNITY','📦 Cơ hội triển khai CRM Cloud','{\"productKeyword\": \"CRM Cloud\"}',1,'2026-10-18 11:18:52','2026-10-19 02:05:50');
/*!40000 ALTER TABLE `saved_filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'team_leaderboard_staff_enabled','true','Cho ph?p nh?n vi?n kinh doanh xem b?ng x?p h?ng doanh s? trong nh?m','2026-10-19 09:26:04');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` bigint DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_teams_parent` (`parent_id`),
  CONSTRAINT `fk_teams_parent` FOREIGN KEY (`parent_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (1,'Khối Kinh doanh Toàn quốc',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',NULL,'DIV-SALES',2,'Toàn quốc','Bộ phận quản lý hoạt động kinh doanh toàn quốc'),(2,'Phòng Kinh doanh Miền Bắc',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',1,'DEPT-SALES-NORTH',3,'Khu vực Miền Bắc','Phụ trách thị trường từ Hà Tĩnh trở ra Bắc'),(3,'Nhóm Kinh doanh B2B Hà Nội',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',2,'TEAM-HN-B2B',4,'Khu vực Hà Nội','Tập trung khách hàng doanh nghiệp khối B2B tại Hà Nội'),(4,'Nhóm Kinh doanh B2C & Đại lý Miền Bắc',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',2,'TEAM-MB-B2C',5,'Khu vực Miền Bắc','Phát triển mạng lưới đại lý và khách hàng bán lẻ'),(5,'Phòng Kinh doanh Miền Trung',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',1,'DEPT-SALES-CENTRAL',6,'Khu vực Miền Trung','Phụ trách khu vực miền Trung và Tây Nguyên'),(6,'Nhóm Kinh doanh Đà Nẵng & Duyên Hải',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',5,'TEAM-DN',7,'Khu vực Đà Nẵng & Duyên Hải','Địa bàn Đà Nẵng, Quảng Nam, Quảng Ngãi'),(7,'Phòng Kinh doanh Miền Nam',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',1,'DEPT-SALES-SOUTH',8,'Khu vực Miền Nam','Phụ trách thị trường Đông Nam Bộ và Tây Nam Bộ'),(8,'Nhóm Kinh doanh Doanh nghiệp TP.HCM',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',7,'TEAM-HCM-ENT',9,'Khu vực TP. Hồ Chí Minh','Khách hàng Enterprise tại TP. Hồ Chí Minh'),(9,'Nhóm Kinh doanh SME & Bán lẻ Phía Nam',1,'2026-10-08 01:53:32','2026-10-14 15:27:22',7,'TEAM-HCM-SME',10,'Khu vực TP. Hồ Chí Minh','Doanh nghiệp vừa và nhỏ khu vực phía Nam');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notification_settings`
--

DROP TABLE IF EXISTS `user_notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `email_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_notif` (`user_id`,`notification_type`),
  CONSTRAINT `fk_user_notif_pref` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notification_settings`
--

LOCK TABLES `user_notification_settings` WRITE;
/*!40000 ALTER TABLE `user_notification_settings` DISABLE KEYS */;
INSERT INTO `user_notification_settings` VALUES (1,4,'QUOTE_APPROVAL_REQUEST',1,1,'2026-10-19 09:56:24','2026-10-19 09:57:03'),(2,4,'TASK_ASSIGNED',1,1,'2026-10-19 09:56:24','2026-10-19 09:57:03'),(3,4,'LEAD_ASSIGNED',1,1,'2026-10-19 09:56:24','2026-10-19 09:57:03');
/*!40000 ALTER TABLE `user_notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(2,4),(3,5),(6,5),(8,5),(4,6),(5,6),(7,6),(9,6),(10,6);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `reminder_lead_minutes` int NOT NULL DEFAULT '60',
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `session_version` int NOT NULL DEFAULT '0',
  `data_scope` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SELF',
  `team_id` bigint DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_signature` text COLLATE utf8mb4_unicode_ci,
  `signature` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'CRM Administrator','Quản trị hệ thống','admin@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-07 15:09:33','2026-10-22 00:45:13',0,'ALL',NULL,NULL,NULL,NULL,NULL,NULL),(2,'Nguyễn Văn Hùng','Nguyễn Văn Hùng','giamdoc@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-19 08:32:58',0,'ALL',1,'0912000001',NULL,NULL,NULL,NULL),(3,'Trần Thị Thu Hà','Trần Thị Thu Hà','lead.mienbac@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-10 07:17:19',0,'TEAM',2,'0912000002',NULL,NULL,NULL,NULL),(4,'Lê Hoàng Nam','Lê Hoàng Nam','sale.hn1@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-18 11:44:37',0,'SELF',3,'0912000003',NULL,NULL,NULL,NULL),(5,'Phạm Mai Phương','Phạm Mai Phương','sale.hn2@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-08 01:53:32',0,'SELF',4,'0912000004',NULL,NULL,NULL,NULL),(6,'Phan Văn Trung','Phan Văn Trung','lead.mientrung@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-08 01:53:32',0,'TEAM',5,'0912000005',NULL,NULL,NULL,NULL),(7,'Đỗ Thị Tuyết','Đỗ Thị Tuyết','sale.dn@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-08 01:53:32',0,'SELF',6,'0912000006',NULL,NULL,NULL,NULL),(8,'Vũ Minh Trí','Vũ Minh Trí','lead.miennam@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-08 01:53:32',0,'TEAM',7,'0912000007',NULL,NULL,NULL,NULL),(9,'Hoàng Kim Yến','Hoàng Kim Yến','sale.hcm1@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-10 07:17:21',0,'SELF',8,'0912000008',NULL,NULL,NULL,NULL),(10,'Trương Tuấn Anh','Trương Tuấn Anh','sale.hcm2@crm.local','$2a$12$Ll/mowVCeORjAlcNhm3vTeIOymuy11KtDd9K.nGGasgiFTyOA3JLS','ACTIVE',60,0,NULL,'2026-10-08 01:53:32','2026-10-14 15:27:22',3,'SELF',9,'0912000009',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `web_lead_forms`
--

DROP TABLE IF EXISTS `web_lead_forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `web_lead_forms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `form_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '????ng k?? t?? v???n gi???i ph??p',
  `description` text COLLATE utf8mb4_unicode_ci,
  `lead_source_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Website / Bi???u m???u',
  `lead_source_id` bigint DEFAULT NULL,
  `submit_button_text` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'G???i y??u c???u t?? v???n',
  `success_message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'C???m ??n qu?? kh??ch! Ch??ng t??i ???? nh???n ???????c th??ng tin v?? s??? li??n h??? l???i trong th???i gian s???m nh???t.',
  `redirect_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_owner_id` bigint DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `submissions_count` int NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `form_key` (`form_key`),
  KEY `idx_form_key` (`form_key`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `web_lead_forms`
--

LOCK TABLES `web_lead_forms` WRITE;
/*!40000 ALTER TABLE `web_lead_forms` DISABLE KEYS */;
INSERT INTO `web_lead_forms` VALUES (1,'wf_landingpage_tuvan','Biểu mẫu tư vấn giải pháp Landing Page','Đăng ký tư vấn giải pháp Doanh nghiệp','Để lại thông tin, đội ngũ chuyên gia của chúng tôi sẽ gọi lại hỗ trợ trong vòng 15 phút.','Website / Biểu mẫu',NULL,'Đăng ký tư vấn ngay','Cảm ơn quý khách! Chuyên viên tư vấn sẽ liên hệ lại trong thời gian sớm nhất.',NULL,1,1,7,NULL,'2026-10-14 02:13:33','2026-10-14 02:28:35'),(2,'wf_demo_crm_q4','Biểu mẫu đăng ký Demo trải nghiệm CRM','Trải nghiệm phần mềm CRM miễn phí 14 ngày','Khám phá toàn diện tính năng quản lý khách hàng 360, Kanban cơ hội và báo giá.','Landing Page Chiến dịch Q4',NULL,'Nhận tài khoản Demo','Đăng ký thành công! Vui lòng kiểm tra email để nhận thông tin đăng nhập thử nghiệm.',NULL,1,1,3,NULL,'2026-10-14 02:13:33','2026-10-15 01:29:41'),(3,'wf_03328e2fda1848c0','A','A','a','Website / Biểu mẫu',NULL,'Gửi yêu cầu tư vấn','Cảm ơn quý khách! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất.',NULL,NULL,1,0,1,'2026-10-15 01:16:17','2026-10-15 01:16:17');
/*!40000 ALTER TABLE `web_lead_forms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `web_lead_submissions`
--

DROP TABLE IF EXISTS `web_lead_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `web_lead_submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `form_id` bigint NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `contact_id` bigint DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interest` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_spam` tinyint(1) NOT NULL DEFAULT '0',
  `spam_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUCCESS',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sub_form` (`form_id`),
  KEY `idx_sub_customer` (`customer_id`),
  KEY `idx_sub_ip_time` (`ip_address`,`created_at`),
  CONSTRAINT `fk_sub_form` FOREIGN KEY (`form_id`) REFERENCES `web_lead_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `web_lead_submissions`
--

LOCK TABLES `web_lead_submissions` WRITE;
/*!40000 ALTER TABLE `web_lead_submissions` DISABLE KEYS */;
INSERT INTO `web_lead_submissions` VALUES (1,1,1,NULL,'Nguyễn Hoàng Long','hoanglong.tech@gmail.com','0912345678','Công ty TNHH Giải Pháp Công Nghệ Long Phát','Cần tư vấn triển khai phân hệ Báo giá và Cơ hội bán hàng cho 20 nhân sự','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',0,NULL,'SUCCESS','2026-10-14 00:13:33'),(2,1,2,NULL,'Trần Thị Mai Phương','maiphuong.tran@gmail.com','0987654321','Chuỗi cửa hàng Bán lẻ Gia Dụng Việt','Muốn dùng thử tính năng lưu trữ hồ sơ khách hàng 360 độ và chống trùng lặp dữ liệu','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',0,NULL,'SUCCESS','2026-10-13 02:13:33'),(3,1,20,NULL,'Vũ Hải Đăng','haidang.vu@smarttech.vn','0909123456','Tập đoàn Công nghệ SmartTech','Cần tích hợp Web-to-Lead và CRM Khách hàng 360 cho 50 nhân viên kinh doanh','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-14 02:27:56'),(4,1,NULL,NULL,'Spam Bot 3000','spambot@spam.com','0988776655','Spam LLC','Buy cheap crypto','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',1,'Bẫy honeypot kích hoạt (Bot tự điền trường ẩn)','REJECTED_SPAM','2026-10-14 02:28:15'),(5,1,21,NULL,'User 1','user1@test.vn','0912345671','Company 1','Test rate limit','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-14 02:28:35'),(6,1,22,NULL,'User 2','user2@test.vn','0912345672','Company 2','Test rate limit','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-14 02:28:35'),(7,1,23,NULL,'User 3','user3@test.vn','0912345673','Company 3','Test rate limit','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-14 02:28:35'),(8,2,47,NULL,'Nguyen Van Test','testform@example.com','0987654321','Test Corp','Demo CRM solutions','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-15 01:19:20'),(9,2,48,NULL,'Nguyen Van Test','testform@example.com','0987654321','Test Corp','Demo CRM solutions','0:0:0:0:0:0:0:1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9444',0,NULL,'SUCCESS','2026-10-15 01:29:41');
/*!40000 ALTER TABLE `web_lead_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `win_loss_reasons`
--

DROP TABLE IF EXISTS `win_loss_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `win_loss_reasons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_win_loss_type` CHECK ((`type` in (_latin1'WON',_latin1'LOST')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `win_loss_reasons`
--

LOCK TABLES `win_loss_reasons` WRITE;
/*!40000 ALTER TABLE `win_loss_reasons` DISABLE KEYS */;
INSERT INTO `win_loss_reasons` VALUES (1,'WON','Chất lượng sản phẩm & giải pháp vượt trội',1,'2026-10-19 07:50:14'),(2,'WON','Giá cả cạnh tranh & chiết khấu phù hợp',1,'2026-10-19 07:50:14'),(3,'WON','Tư vấn chuyên nghiệp & dịch vụ hỗ trợ tận tâm',1,'2026-10-19 07:50:14'),(4,'WON','Thương hiệu uy tín & kinh nghiệm triển khai dự án tương tự',1,'2026-10-19 07:50:14'),(5,'LOST','Giá quá cao so với ngân sách dự kiến của khách',1,'2026-10-19 07:50:14'),(6,'LOST','Tính năng chưa đáp ứng đặc thù nghiệp vụ',1,'2026-10-19 07:50:14'),(7,'LOST','Đối thủ cạnh tranh giảm giá sâu / ưu đãi lớn',1,'2026-10-19 07:50:14'),(8,'LOST','Chậm trễ trong phản hồi & gửi báo giá muộn',1,'2026-10-19 07:50:14'),(9,'LOST','Khách hàng hoãn / hủy kế hoạch đầu tư trong năm',1,'2026-10-19 07:50:14'),(10,'LOST','Không tiếp cận được lãnh đạo có quyền quyết định',1,'2026-10-19 07:50:14');
/*!40000 ALTER TABLE `win_loss_reasons` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22  1:15:47
