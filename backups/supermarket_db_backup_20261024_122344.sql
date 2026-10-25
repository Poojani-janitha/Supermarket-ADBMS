-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: supermarket_db
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
-- Position to start replication or point-in-time recovery from
--

-- CHANGE MASTER TO MASTER_LOG_FILE='DESKTOP-AL6JLTI-bin.000022', MASTER_LOG_POS=157;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch`
--

LOCK TABLES `branch` WRITE;
/*!40000 ALTER TABLE `branch` DISABLE KEYS */;
INSERT INTO `branch` VALUES (1,'Colombo Central Flagship','Colombo','Western','100 Galle Road, Colombo 03','0112345678',1),(2,'Kandy City Centre Outlet','Kandy','Central','45 Dalada Veediya, Kandy','0812345678',1),(3,'Galle Fort Coastal Branch','Galle','Southern','12 Lighthouse Street, Galle','0912345678',1);
/*!40000 ALTER TABLE `branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'category',
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Fresh Produce','Organic vegetables and fresh fruits','nutrition',NULL),(2,'Grains & Rice','Premium quality rice varieties and pulses','grain',NULL),(3,'Dairy & Eggs','Fresh farm milk, cheese, and farm eggs','egg_alt',NULL),(4,'Beverages','Ceylon tea, coffee, and fresh juices','local_cafe',NULL),(5,'Bakery & Snacks','Fresh bread, artisanal pastries, and biscuits','bakery_dining',NULL);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon`
--

DROP TABLE IF EXISTS `coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon` (
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_id` int NOT NULL,
  `max_uses` int NOT NULL DEFAULT '1',
  `used_count` int NOT NULL DEFAULT '0',
  `expires_on` date NOT NULL,
  PRIMARY KEY (`code`),
  KEY `rule_id` (`rule_id`),
  CONSTRAINT `coupon_ibfk_1` FOREIGN KEY (`rule_id`) REFERENCES `discount_rule` (`rule_id`),
  CONSTRAINT `coupon_chk_1` CHECK ((`max_uses` > 0)),
  CONSTRAINT `coupon_chk_2` CHECK ((`used_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon`
--

LOCK TABLES `coupon` WRITE;
/*!40000 ALTER TABLE `coupon` DISABLE KEYS */;
INSERT INTO `coupon` VALUES ('NEWYEAR50',4,500,12,'2028-12-31'),('WELCOME10',1,1000,45,'2028-12-31');
/*!40000 ALTER TABLE `coupon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loyalty_points` int NOT NULL DEFAULT '0',
  `registered_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone` (`phone`),
  CONSTRAINT `customer_chk_1` CHECK ((`loyalty_points` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'Jacob Jones','0771234567','jacob@example.com',420,'2023-01-15 10:00:00'),(2,'Bessie Coleman','0772345678','bessie@example.com',180,'2023-04-20 11:30:00'),(3,'Ralph Edwards','0773456789','ralph@example.com',60,'2024-01-10 14:15:00'),(4,'Devon Lane','0774567890','devon@example.com',0,'2024-03-01 09:00:00'),(5,'buha','0767278456','jayarathnahpj23@gmail.com',0,'2026-10-23 20:05:11');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_sales_log`
--

DROP TABLE IF EXISTS `daily_sales_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_sales_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `summary_date` date NOT NULL,
  `branch_id` int NOT NULL,
  `total_orders` int NOT NULL,
  `total_sales` decimal(14,2) NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_sales_log`
--

LOCK TABLES `daily_sales_log` WRITE;
/*!40000 ALTER TABLE `daily_sales_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_sales_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_sales_summary`
--

DROP TABLE IF EXISTS `daily_sales_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_sales_summary` (
  `summary_date` date NOT NULL,
  `branch_id` int NOT NULL,
  `total_orders` int NOT NULL DEFAULT '0',
  `total_sales` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`summary_date`,`branch_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `daily_sales_summary_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `daily_sales_summary_chk_1` CHECK ((`total_orders` >= 0)),
  CONSTRAINT `daily_sales_summary_chk_2` CHECK ((`total_sales` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_sales_summary`
--

LOCK TABLES `daily_sales_summary` WRITE;
/*!40000 ALTER TABLE `daily_sales_summary` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_sales_summary` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_daily_sales_log` AFTER INSERT ON `daily_sales_summary` FOR EACH ROW BEGIN
    INSERT INTO daily_sales_log (summary_date, branch_id, total_orders, total_sales, logged_at)
    VALUES (NEW.summary_date, NEW.branch_id, NEW.total_orders, NEW.total_sales, NOW());
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `discount_rule`
--

DROP TABLE IF EXISTS `discount_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount_rule` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` enum('FIRST_PURCHASE','HOLIDAY','LOYALTY','COUPON') COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `tier` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `priority` int NOT NULL DEFAULT '100',
  `stackable` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`rule_id`),
  CONSTRAINT `discount_rule_chk_1` CHECK ((`value` > 0)),
  CONSTRAINT `discount_rule_chk_2` CHECK ((`min_order_amount` >= 0)),
  CONSTRAINT `discount_rule_chk_3` CHECK (((`max_discount` is null) or (`max_discount` > 0))),
  CONSTRAINT `discount_rule_chk_4` CHECK ((`end_date` >= `start_date`))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_rule`
--

LOCK TABLES `discount_rule` WRITE;
/*!40000 ALTER TABLE `discount_rule` DISABLE KEYS */;
INSERT INTO `discount_rule` VALUES (1,'First Purchase Welcome Discount','FIRST_PURCHASE','PERCENT',10.00,20.00,15.00,NULL,'2020-01-01','2030-12-31',10,1,1),(2,'Gold Tier Loyalty Reward','LOYALTY','PERCENT',10.00,25.00,20.00,'GOLD','2020-01-01','2030-12-31',20,1,1),(3,'Special Holiday Promotion','HOLIDAY','PERCENT',5.00,15.00,10.00,NULL,'2020-01-01','2030-12-31',30,1,1),(4,'New Year Festive Coupon Voucher','COUPON','FIXED',10.00,30.00,10.00,NULL,'2020-01-01','2030-12-31',5,0,1);
/*!40000 ALTER TABLE `discount_rule` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_rule_check_insert` BEFORE INSERT ON `discount_rule` FOR EACH ROW BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_rule_check_update` BEFORE UPDATE ON `discount_rule` FOR EACH ROW BEGIN
  IF NEW.kind = 'PERCENT' AND (NEW.value <= 0 OR NEW.value > 100) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Percentage discount must be between 0 and 100';
  END IF;
  IF NEW.end_date < NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Discount end date cannot precede start date';
  END IF;
  IF NEW.rule_type = 'LOYALTY'
     AND COALESCE(NEW.tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_rule_audit` AFTER UPDATE ON `discount_rule` FOR EACH ROW BEGIN
  IF NOT (OLD.value <=> NEW.value) THEN
    INSERT INTO discount_rule_audit (
      rule_id, old_value, new_value, changed_by
    )
    VALUES (NEW.rule_id, OLD.value, NEW.value, USER());
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `discount_rule_audit`
--

DROP TABLE IF EXISTS `discount_rule_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount_rule_audit` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `rule_id` int NOT NULL,
  `old_value` decimal(10,2) DEFAULT NULL,
  `new_value` decimal(10,2) DEFAULT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_rule_audit`
--

LOCK TABLES `discount_rule_audit` WRITE;
/*!40000 ALTER TABLE `discount_rule_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `discount_rule_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','MANAGER','CASHIER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date NOT NULL DEFAULT (curdate()),
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `username` (`username`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,1,'Kavindu Weerasinghe','ADMIN','admin','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(2,1,'Arlene McCoy','MANAGER','manager1','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(3,1,'Floyd Miles','CASHIER','cashier1','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(100,1,'Kavindu Perera (Admin)','ADMIN','admin_kavindu','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(101,1,'Floyd Miles','CASHIER','cashier_floyd','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(102,1,'Arlene McCoy','MANAGER','manager_arlene','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(103,2,'Kamal Gunaratne','CASHIER','cashier_kamal','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1),(104,3,'Nimal Silva','MANAGER','manager_nimal','$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR5.e3l6zS7G3N9.Kj.Z8zW6zR5aK','2026-10-23',1);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_audit_log`
--

DROP TABLE IF EXISTS `employee_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `old_role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_branch_id` int DEFAULT NULL,
  `new_branch_id` int DEFAULT NULL,
  `is_active_changed` tinyint(1) NOT NULL DEFAULT '0',
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_audit_log`
--

LOCK TABLES `employee_audit_log` WRITE;
/*!40000 ALTER TABLE `employee_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `script` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holiday`
--

DROP TABLE IF EXISTS `holiday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holiday` (
  `holiday_date` date NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holiday`
--

LOCK TABLES `holiday` WRITE;
/*!40000 ALTER TABLE `holiday` DISABLE KEYS */;
INSERT INTO `holiday` VALUES ('2026-01-01','New Year Day'),('2026-04-14','Sinhala and Tamil New Year'),('2026-05-01','May Day'),('2026-10-23','Today Special Supermarket Promotion'),('2026-12-25','Christmas Day');
/*!40000 ALTER TABLE `holiday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reorder_level` decimal(10,2) NOT NULL DEFAULT '10.00',
  `version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`branch_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `inventory_chk_1` CHECK ((`quantity` >= 0)),
  CONSTRAINT `inventory_chk_2` CHECK ((`reorder_level` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES (1,1,45.00,10.00,0),(1,2,80.00,20.00,0),(1,3,60.00,15.00,0),(1,4,90.00,20.00,0),(1,5,30.00,10.00,0),(1,6,75.00,15.00,0),(2,1,20.00,10.00,0),(2,2,40.00,15.00,0),(2,3,35.00,10.00,0);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_inventory_low_stock` AFTER UPDATE ON `inventory` FOR EACH ROW BEGIN
  IF NEW.quantity <= NEW.reorder_level AND OLD.quantity > OLD.reorder_level THEN
    INSERT INTO low_stock_alert (branch_id, product_id, quantity)
    VALUES (NEW.branch_id, NEW.product_id, NEW.quantity);
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `low_stock_alert`
--

DROP TABLE IF EXISTS `low_stock_alert`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `low_stock_alert` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`alert_id`),
  KEY `branch_id` (`branch_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `low_stock_alert_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `low_stock_alert_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `low_stock_alert`
--

LOCK TABLES `low_stock_alert` WRITE;
/*!40000 ALTER TABLE `low_stock_alert` DISABLE KEYS */;
/*!40000 ALTER TABLE `low_stock_alert` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_discount`
--

DROP TABLE IF EXISTS `order_discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_discount` (
  `order_id` int NOT NULL,
  `rule_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`order_id`,`rule_id`),
  KEY `rule_id` (`rule_id`),
  CONSTRAINT `order_discount_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_discount_ibfk_2` FOREIGN KEY (`rule_id`) REFERENCES `discount_rule` (`rule_id`),
  CONSTRAINT `order_discount_chk_1` CHECK ((`amount` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_discount`
--

LOCK TABLES `order_discount` WRITE;
/*!40000 ALTER TABLE `order_discount` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_discount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(12,2) GENERATED ALWAYS AS ((`quantity` * `unit_price`)) STORED,
  PRIMARY KEY (`order_id`,`product_id`),
  KEY `idx_order_item_prod` (`product_id`),
  CONSTRAINT `order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_item_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `order_item_chk_1` CHECK ((`quantity` > 0)),
  CONSTRAINT `order_item_chk_2` CHECK ((`unit_price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `method` enum('CASH','CARD','QR','ONLINE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `payment_chk_1` CHECK ((`amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_audit_log`
--

DROP TABLE IF EXISTS `price_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `old_price` decimal(10,2) NOT NULL,
  `new_price` decimal(10,2) NOT NULL,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `price_audit_log_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_audit_log`
--

LOCK TABLES `price_audit_log` WRITE;
/*!40000 ALTER TABLE `price_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `sku` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diet_type` enum('VEG','NON_VEG') COLLATE utf8mb4_unicode_ci DEFAULT 'VEG',
  `unit_of_measure` enum('KG','G','L','ML','PACKET','PIECE','CAN','BOTTLE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PIECE',
  `min_order_qty` decimal(10,2) NOT NULL DEFAULT '1.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `category_id` (`category_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `idx_product_name` (`name`),
  FULLTEXT KEY `idx_product_ft` (`name`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`),
  CONSTRAINT `product_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  CONSTRAINT `product_chk_1` CHECK ((`unit_price` >= 0)),
  CONSTRAINT `product_chk_2` CHECK ((`cost_price` >= 0)),
  CONSTRAINT `product_chk_3` CHECK ((`min_order_qty` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,1,1,'PRD-AVO-001','Fresh Hass Avocados (1kg)',5.99,3.50,NULL,'VEG','PIECE',1.00,1),(2,2,1,'PRD-RIC-002','Keeri Samba Rice (5kg)',14.50,10.00,NULL,'VEG','PIECE',1.00,1),(3,3,2,'PRD-MLK-003','Fresh Pasturised Milk 1L',5.60,3.80,NULL,'VEG','PIECE',1.00,1),(4,4,3,'PRD-TEA-004','Ceylon Orange Pekoe Tea',4.80,2.80,'/uploads/products/d8606bc2-98be-4c35-8cd4-e43f98711148.png','VEG','PIECE',1.00,1),(5,5,1,'PRD-BRD-005','Whole Wheat Sourdough Bread',3.40,1.90,NULL,'VEG','PIECE',1.00,1),(6,1,1,'PRD-BAN-006','Organic Cavendish Bananas',2.50,1.20,NULL,'VEG','PIECE',1.00,1);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_product_price_audit` AFTER UPDATE ON `product` FOR EACH ROW BEGIN
  IF OLD.unit_price <> NEW.unit_price THEN
    INSERT INTO price_audit_log (
      product_id, old_price, new_price, changed_by
    )
    VALUES (
      NEW.product_id, OLD.unit_price, NEW.unit_price, USER()
    );
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `purchase_order`
--

DROP TABLE IF EXISTS `purchase_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order` (
  `po_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `requested_by` int DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `status` enum('REQUESTED','CONFIRMED','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `supplier_notes` text COLLATE utf8mb4_unicode_ci,
  `receiving_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`po_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `branch_id` (`branch_id`),
  KEY `requested_by` (`requested_by`),
  KEY `received_by` (`received_by`),
  CONSTRAINT `purchase_order_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`),
  CONSTRAINT `purchase_order_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `purchase_order_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `purchase_order_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `purchase_order_chk_1` CHECK ((`total_cost` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order`
--

LOCK TABLES `purchase_order` WRITE;
/*!40000 ALTER TABLE `purchase_order` DISABLE KEYS */;
INSERT INTO `purchase_order` VALUES (101,1,1,2,3,'2026-10-10 09:00:00','2026-10-10 11:30:00','2026-10-11 08:45:00','RECEIVED',350.00,'Direct from Nuwara Eliya organic orchards.','Inspected upon delivery: 100 units intact, cold-chain verified.'),(102,2,1,2,NULL,'2026-10-12 10:00:00','2026-10-12 14:00:00',NULL,'CONFIRMED',980.00,'Standard 25kg moisture-proof sacks ready for transit.',NULL),(103,3,2,2,3,'2026-10-08 08:30:00','2026-10-08 10:15:00','2026-10-09 09:00:00','RECEIVED',456.00,'Chilled milk cartons loaded in refrigerated carrier.','Temperature recorded at 4 deg C upon intake. Restocked in dairy aisle.'),(104,4,1,2,NULL,'2026-10-14 11:00:00','2026-10-14 13:00:00',NULL,'CONFIRMED',312.00,'Iced transport container. 36 of 40 KG verified premium catch.',NULL),(105,5,3,2,3,'2026-10-05 14:00:00','2026-10-05 16:30:00','2026-10-07 10:00:00','RECEIVED',560.00,'Single-origin highland leaf tea caddies.','Passed QC moisture check.'),(106,6,1,2,NULL,'2026-10-15 07:00:00',NULL,NULL,'REQUESTED',190.00,NULL,NULL),(107,7,1,2,NULL,'2026-10-11 15:00:00','2026-10-12 09:00:00',NULL,'CONFIRMED',320.00,'Import consignment partial allotment: 38 of 50 units ready.',NULL);
/*!40000 ALTER TABLE `purchase_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_item`
--

DROP TABLE IF EXISTS `purchase_order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_item` (
  `po_id` int NOT NULL,
  `product_id` int NOT NULL,
  `requested_qty` decimal(10,2) NOT NULL,
  `confirmed_qty` decimal(10,2) DEFAULT NULL,
  `received_qty` decimal(10,2) DEFAULT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `line_cost` decimal(12,2) GENERATED ALWAYS AS ((coalesce(`received_qty`,`confirmed_qty`,`requested_qty`) * `unit_cost`)) STORED,
  PRIMARY KEY (`po_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `purchase_order_item_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`po_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_item_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`),
  CONSTRAINT `purchase_order_item_chk_1` CHECK ((`requested_qty` > 0)),
  CONSTRAINT `purchase_order_item_chk_2` CHECK (((`confirmed_qty` is null) or (`confirmed_qty` >= 0))),
  CONSTRAINT `purchase_order_item_chk_3` CHECK (((`received_qty` is null) or (`received_qty` >= 0))),
  CONSTRAINT `purchase_order_item_chk_4` CHECK ((`unit_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_item`
--

LOCK TABLES `purchase_order_item` WRITE;
/*!40000 ALTER TABLE `purchase_order_item` DISABLE KEYS */;
INSERT INTO `purchase_order_item` (`po_id`, `product_id`, `requested_qty`, `confirmed_qty`, `received_qty`, `unit_cost`) VALUES (101,1,100.00,100.00,100.00,3.50),(102,2,100.00,98.00,NULL,10.00),(103,3,120.00,120.00,120.00,3.80),(104,4,40.00,36.00,NULL,8.66),(105,4,200.00,200.00,200.00,2.80),(106,5,100.00,NULL,NULL,1.90),(107,6,50.00,38.00,NULL,8.42);
/*!40000 ALTER TABLE `purchase_order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_order`
--

DROP TABLE IF EXISTS `sales_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `employee_id` int NOT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`order_id`),
  KEY `employee_id` (`employee_id`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_order_branch_date` (`branch_id`,`order_date`),
  KEY `idx_order_customer` (`customer_id`),
  CONSTRAINT `sales_order_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `sales_order_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
  CONSTRAINT `sales_order_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`employee_id`),
  CONSTRAINT `sales_order_chk_1` CHECK ((`subtotal` >= 0)),
  CONSTRAINT `sales_order_chk_2` CHECK ((`discount_total` >= 0)),
  CONSTRAINT `sales_order_chk_3` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_order`
--

LOCK TABLES `sales_order` WRITE;
/*!40000 ALTER TABLE `sales_order` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_event_log`
--

DROP TABLE IF EXISTS `security_event_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_event_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `performed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_event_log`
--

LOCK TABLES `security_event_log` WRITE;
/*!40000 ALTER TABLE `security_event_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_event_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_audit_log`
--

DROP TABLE IF EXISTS `stock_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `change_qty` int NOT NULL,
  `reason` enum('SALE','RESTOCK','CANCEL','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_order_id` int DEFAULT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `branch_id` (`branch_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_stock_audit_logged` (`logged_at`),
  CONSTRAINT `stock_audit_log_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`),
  CONSTRAINT `stock_audit_log_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_audit_log`
--

LOCK TABLES `stock_audit_log` WRITE;
/*!40000 ALTER TABLE `stock_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_audit_log_partitioned`
--

DROP TABLE IF EXISTS `stock_audit_log_partitioned`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_audit_log_partitioned` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `product_id` int NOT NULL,
  `change_qty` int NOT NULL,
  `reason` enum('SALE','RESTOCK','CANCEL','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_order_id` int DEFAULT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`,`logged_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
/*!50100 PARTITION BY RANGE (year(`logged_at`))
(PARTITION p2024 VALUES LESS THAN (2025) ENGINE = InnoDB,
 PARTITION p2025 VALUES LESS THAN (2026) ENGINE = InnoDB,
 PARTITION p2026 VALUES LESS THAN (2027) ENGINE = InnoDB,
 PARTITION p_future VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_audit_log_partitioned`
--

LOCK TABLES `stock_audit_log_partitioned` WRITE;
/*!40000 ALTER TABLE `stock_audit_log_partitioned` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_audit_log_partitioned` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('PENDING_APPROVAL','ACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (1,'Lanka Fresh Organics Ltd','Sunil Bandara','077-1234567','orders@lankafresh.lk','supplier_organics',NULL,'Colombo','V-10293847',1,'ACTIVE'),(2,'Ceylon Agro Grain Mills','Anura Jayasuriya','071-2345678','sales@ceylonagro.lk','supplier_agro',NULL,'Kurunegala','V-55667788',1,'ACTIVE'),(3,'Highland Dairy Farms','Priya Fernando','072-3456789','supplies@highlanddairy.lk','supplier_dairy',NULL,'Nuwara Eliya','V-99887766',1,'ACTIVE'),(4,'Ocean Harvest Seafoods','Jude Cooray','076-4567890','info@oceanharvest.lk','supplier_ocean',NULL,'Negombo','V-33445566',1,'ACTIVE'),(5,'Dilmah Ceylon Tea Estates','Rohan Dilmah','077-5678901','trade@dilmahtea.lk','supplier_dilmah',NULL,'Kandy','V-11223344',1,'ACTIVE'),(6,'Colombo Artisan Bakehouse','Malik Wickramasinghe','075-6789012','orders@colombobake.lk','supplier_bakehouse',NULL,'Colombo','V-77889900',1,'ACTIVE'),(7,'Mediterranean Olive Orchards','Tariq Mansoor','071-7890123','imports@medolive.lk','supplier_olive',NULL,'Colombo','V-44332211',1,'ACTIVE');
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_of_measure`
--

DROP TABLE IF EXISTS `unit_of_measure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_of_measure` (
  `unit_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`unit_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_of_measure`
--

LOCK TABLES `unit_of_measure` WRITE;
/*!40000 ALTER TABLE `unit_of_measure` DISABLE KEYS */;
/*!40000 ALTER TABLE `unit_of_measure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_active_discounts`
--

DROP TABLE IF EXISTS `v_active_discounts`;
/*!50001 DROP VIEW IF EXISTS `v_active_discounts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_active_discounts` AS SELECT 
 1 AS `rule_id`,
 1 AS `name`,
 1 AS `rule_type`,
 1 AS `kind`,
 1 AS `value`,
 1 AS `min_order_amount`,
 1 AS `max_discount`,
 1 AS `tier`,
 1 AS `start_date`,
 1 AS `end_date`,
 1 AS `priority`,
 1 AS `stackable`,
 1 AS `is_active`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_category_summary`
--

DROP TABLE IF EXISTS `v_category_summary`;
/*!50001 DROP VIEW IF EXISTS `v_category_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_category_summary` AS SELECT 
 1 AS `category_id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `icon`,
 1 AS `parent_id`,
 1 AS `active_product_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_customer_directory`
--

DROP TABLE IF EXISTS `v_customer_directory`;
/*!50001 DROP VIEW IF EXISTS `v_customer_directory`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_customer_directory` AS SELECT 
 1 AS `customer_id`,
 1 AS `full_name`,
 1 AS `phone`,
 1 AS `email`,
 1 AS `loyalty_points`,
 1 AS `tier`,
 1 AS `registered_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_customer_orders`
--

DROP TABLE IF EXISTS `v_customer_orders`;
/*!50001 DROP VIEW IF EXISTS `v_customer_orders`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_customer_orders` AS SELECT 
 1 AS `order_id`,
 1 AS `customer_id`,
 1 AS `order_date`,
 1 AS `status`,
 1 AS `subtotal`,
 1 AS `discount_total`,
 1 AS `total_amount`,
 1 AS `item_count`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_daily_sales`
--

DROP TABLE IF EXISTS `v_daily_sales`;
/*!50001 DROP VIEW IF EXISTS `v_daily_sales`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_daily_sales` AS SELECT 
 1 AS `branch_id`,
 1 AS `sale_date`,
 1 AS `orders`,
 1 AS `total_sales`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_discount_impact`
--

DROP TABLE IF EXISTS `v_discount_impact`;
/*!50001 DROP VIEW IF EXISTS `v_discount_impact`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_discount_impact` AS SELECT 
 1 AS `rule_id`,
 1 AS `name`,
 1 AS `rule_type`,
 1 AS `orders_using`,
 1 AS `total_discount`,
 1 AS `revenue_after_discount`,
 1 AS `roi_ratio`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_low_stock`
--

DROP TABLE IF EXISTS `v_low_stock`;
/*!50001 DROP VIEW IF EXISTS `v_low_stock`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_low_stock` AS SELECT 
 1 AS `branch_id`,
 1 AS `branch`,
 1 AS `product_id`,
 1 AS `product`,
 1 AS `unit_of_measure`,
 1 AS `quantity`,
 1 AS `reorder_level`,
 1 AS `version`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_masked_customer_directory`
--

DROP TABLE IF EXISTS `v_masked_customer_directory`;
/*!50001 DROP VIEW IF EXISTS `v_masked_customer_directory`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_masked_customer_directory` AS SELECT 
 1 AS `customer_id`,
 1 AS `full_name`,
 1 AS `masked_phone`,
 1 AS `email`,
 1 AS `loyalty_points`,
 1 AS `tier`,
 1 AS `registered_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_product_catalog`
--

DROP TABLE IF EXISTS `v_product_catalog`;
/*!50001 DROP VIEW IF EXISTS `v_product_catalog`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_product_catalog` AS SELECT 
 1 AS `product_id`,
 1 AS `sku`,
 1 AS `product_name`,
 1 AS `category_id`,
 1 AS `category_name`,
 1 AS `supplier_id`,
 1 AS `supplier_name`,
 1 AS `unit_price`,
 1 AS `cost_price`,
 1 AS `image_url`,
 1 AS `diet_type`,
 1 AS `unit_of_measure`,
 1 AS `min_order_qty`,
 1 AS `is_active`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_product_ranking`
--

DROP TABLE IF EXISTS `v_product_ranking`;
/*!50001 DROP VIEW IF EXISTS `v_product_ranking`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_product_ranking` AS SELECT 
 1 AS `product_id`,
 1 AS `name`,
 1 AS `sku`,
 1 AS `units_sold`,
 1 AS `revenue`,
 1 AS `revenue_rank`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_supplier_performance`
--

DROP TABLE IF EXISTS `v_supplier_performance`;
/*!50001 DROP VIEW IF EXISTS `v_supplier_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_supplier_performance` AS SELECT 
 1 AS `supplier_id`,
 1 AS `supplier_name`,
 1 AS `contact_person`,
 1 AS `phone`,
 1 AS `city`,
 1 AS `total_orders`,
 1 AS `total_requested_qty`,
 1 AS `total_confirmed_qty`,
 1 AS `total_received_qty`,
 1 AS `total_spend`,
 1 AS `fulfillment_rate`,
 1 AS `rating_tier`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'supermarket_db'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `ev_daily_sales_summary` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = cp850 */ ;;
/*!50003 SET character_set_results = cp850 */ ;;
/*!50003 SET collation_connection  = cp850_general_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `ev_daily_sales_summary` ON SCHEDULE EVERY 1 DAY STARTS '2026-10-23 01:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    INSERT INTO daily_sales_summary (summary_date, branch_id, total_orders, total_sales)
    SELECT 
        DATE(order_date),
        branch_id,
        COUNT(*),
        COALESCE(SUM(total_amount), 0.00)
    FROM sales_order
    WHERE status = 'COMPLETED'
      AND order_date >= CURDATE() - INTERVAL 1 DAY
      AND order_date < CURDATE()
    GROUP BY DATE(order_date), branch_id
    ON DUPLICATE KEY UPDATE 
        total_orders = VALUES(total_orders),
        total_sales  = VALUES(total_sales);
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `ev_expire_discount_rules` */;;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = cp850 */ ;;
/*!50003 SET character_set_results = cp850 */ ;;
/*!50003 SET collation_connection  = cp850_general_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `ev_expire_discount_rules` ON SCHEDULE EVERY 1 DAY STARTS '2026-10-23 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  UPDATE discount_rule
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND end_date < CURDATE();
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `ev_monthly_log_purge` */;;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = cp850 */ ;;
/*!50003 SET character_set_results = cp850 */ ;;
/*!50003 SET collation_connection  = cp850_general_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `ev_monthly_log_purge` ON SCHEDULE EVERY 1 MONTH STARTS '2026-10-23 02:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DELETE FROM stock_audit_log 
    WHERE logged_at < NOW() - INTERVAL 12 MONTH;
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `ev_weekly_low_stock_scan` */;;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = cp850 */ ;;
/*!50003 SET character_set_results = cp850 */ ;;
/*!50003 SET collation_connection  = cp850_general_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `ev_weekly_low_stock_scan` ON SCHEDULE EVERY 1 WEEK STARTS '2026-10-22 21:10:36' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  INSERT INTO low_stock_alert (branch_id, product_id, quantity)
  SELECT i.branch_id, i.product_id, i.quantity FROM inventory i
  WHERE i.quantity <= i.reorder_level
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alert a
      WHERE a.branch_id = i.branch_id AND a.product_id = i.product_id AND a.resolved = FALSE
    );
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'supermarket_db'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_avg_daily_sales` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_avg_daily_sales`(p_branch INT, p_days INT) RETURNS decimal(12,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_avg DECIMAL(12,2);
    
    SELECT AVG(total_sales) INTO v_avg
    FROM daily_sales_summary
    WHERE (p_branch IS NULL OR branch_id = p_branch)
      AND summary_date >= CURDATE() - INTERVAL p_days DAY;

    
    IF v_avg IS NULL THEN
        SELECT COALESCE(AVG(daily_total), 0.00) INTO v_avg
        FROM (
            SELECT DATE(order_date) AS sale_date, SUM(total_amount) AS daily_total
            FROM sales_order
            WHERE status = 'COMPLETED'
              AND (p_branch IS NULL OR branch_id = p_branch)
              AND order_date >= CURDATE() - INTERVAL p_days DAY
            GROUP BY DATE(order_date)
        ) AS daily_agg;
    END IF;
    RETURN COALESCE(v_avg, 0.00);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_coupon_valid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_coupon_valid`(p_code VARCHAR(20), p_rule_id INT) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
  RETURN p_code IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM coupon c
      JOIN discount_rule r ON r.rule_id = c.rule_id
      WHERE c.code = UPPER(TRIM(p_code))
        AND (p_rule_id IS NULL OR c.rule_id = p_rule_id)
        AND c.expires_on >= CURDATE()
        AND c.used_count < c.max_uses
        AND r.is_active = TRUE
        AND CURDATE() BETWEEN r.start_date AND r.end_date
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_customer_tier` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_customer_tier`(p_customer_id INT) RETURNS varchar(10) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    READS SQL DATA
    DETERMINISTIC
BEGIN
  DECLARE v_spent DECIMAL(14,2) DEFAULT 0.00;

  IF p_customer_id IS NULL THEN
    RETURN 'BRONZE';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0.00)
    INTO v_spent
  FROM sales_order
  WHERE customer_id = p_customer_id
    AND status = 'COMPLETED';

  RETURN CASE
    WHEN v_spent >= 100000.00 THEN 'GOLD'
    WHEN v_spent >= 50000.00 THEN 'SILVER'
    ELSE 'BRONZE'
  END;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_is_first_purchase` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_is_first_purchase`(p_customer_id INT, p_order_id INT) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
  RETURN p_customer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM sales_order
      WHERE customer_id = p_customer_id
        AND order_id <> COALESCE(p_order_id, -1)
        AND status = 'COMPLETED'
    );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_is_holiday` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_is_holiday`(p_date DATE) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM holiday
    WHERE holiday_date = p_date
  );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_stock_level` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_stock_level`(p_branch INT, p_product INT) RETURNS decimal(10,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
  DECLARE v_qty DECIMAL(10,2);
  SELECT quantity INTO v_qty FROM inventory
  WHERE branch_id = p_branch AND product_id = p_product;
  RETURN COALESCE(v_qty, 0.00);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_supplier_fulfillment_rate` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_supplier_fulfillment_rate`(p_supplier_id INT) RETURNS decimal(5,2)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE v_requested DECIMAL(12,2);
    DECLARE v_confirmed DECIMAL(12,2);
    DECLARE v_rate DECIMAL(5,2);

    SELECT 
        COALESCE(SUM(poi.requested_qty), 0),
        COALESCE(SUM(poi.confirmed_qty), 0)
    INTO v_requested, v_confirmed
    FROM purchase_order po
    JOIN purchase_order_item poi ON poi.po_id = po.po_id
    WHERE po.supplier_id = p_supplier_id
      AND po.status IN ('CONFIRMED', 'RECEIVED');

    IF v_requested = 0 THEN
        RETURN 100.00;
    END IF;

    SET v_rate = ROUND((v_confirmed / v_requested) * 100.0, 2);
    RETURN LEAST(v_rate, 100.00);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_apply_discounts` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_apply_discounts`(
  IN p_order_id INT,
  IN p_coupon_code VARCHAR(20)
)
BEGIN
  DECLARE v_customer_id INT DEFAULT NULL;
  DECLARE v_order_date DATE;
  DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_running_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_discount DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_allowed DECIMAL(12,2) DEFAULT 0.00;
  DECLARE v_tier VARCHAR(10);
  DECLARE v_first_purchase BOOLEAN DEFAULT FALSE;
  DECLARE v_rule_id INT;
  DECLARE v_rule_type VARCHAR(20);
  DECLARE v_kind VARCHAR(10);
  DECLARE v_value DECIMAL(10,2);
  DECLARE v_min_order DECIMAL(12,2);
  DECLARE v_max_discount DECIMAL(12,2);
  DECLARE v_rule_tier VARCHAR(10);
  DECLARE v_stackable BOOLEAN;
  DECLARE v_coupon_rule_id INT DEFAULT NULL;
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_non_stackable_applied BOOLEAN DEFAULT FALSE;

  DECLARE rule_cursor CURSOR FOR
    SELECT rule_id, rule_type, kind, value, min_order_amount,
           max_discount, tier, stackable
    FROM discount_rule
    WHERE is_active = TRUE
      AND v_order_date BETWEEN start_date AND end_date
    ORDER BY priority ASC, rule_id ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_order_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order ID is required';
  END IF;

  START TRANSACTION;

  SELECT customer_id, DATE(order_date), subtotal
    INTO v_customer_id, v_order_date, v_subtotal
  FROM sales_order
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF v_subtotal IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order does not exist';
  END IF;

  SET v_tier = fn_customer_tier(v_customer_id);
  SET v_first_purchase = fn_is_first_purchase(v_customer_id, p_order_id);

  DELETE FROM order_discount WHERE order_id = p_order_id;

  IF NULLIF(TRIM(p_coupon_code), '') IS NOT NULL THEN
    SELECT c.rule_id
      INTO v_coupon_rule_id
    FROM coupon c
    JOIN discount_rule r ON r.rule_id = c.rule_id
    WHERE c.code = UPPER(TRIM(p_coupon_code))
    FOR UPDATE;

    IF v_coupon_rule_id IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM coupon c
         JOIN discount_rule r ON r.rule_id = c.rule_id
         WHERE c.code = UPPER(TRIM(p_coupon_code))
           AND c.rule_id = v_coupon_rule_id
           AND c.expires_on >= v_order_date
           AND c.used_count < c.max_uses
           AND r.is_active = TRUE
           AND v_order_date BETWEEN r.start_date AND r.end_date
       ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Coupon is invalid or expired';
    END IF;
  END IF;

  OPEN rule_cursor;
  rule_loop: LOOP
    FETCH rule_cursor INTO
      v_rule_id, v_rule_type, v_kind, v_value, v_min_order,
      v_max_discount, v_rule_tier, v_stackable;
    IF v_done THEN
      LEAVE rule_loop;
    END IF;

    IF v_subtotal < v_min_order THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'FIRST_PURCHASE' AND NOT v_first_purchase THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'HOLIDAY' AND NOT fn_is_holiday(v_order_date) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'LOYALTY' AND (v_customer_id IS NULL OR v_rule_tier <> v_tier) THEN
      ITERATE rule_loop;
    END IF;
    IF v_rule_type = 'COUPON' AND v_rule_id <> v_coupon_rule_id THEN
      ITERATE rule_loop;
    END IF;
    IF NOT v_stackable AND v_non_stackable_applied THEN
      ITERATE rule_loop;
    END IF;

    IF v_kind = 'PERCENT' THEN
      SET v_discount = ROUND(v_subtotal * v_value / 100, 2);
    ELSE
      SET v_discount = v_value;
    END IF;
    IF v_max_discount IS NOT NULL THEN
      SET v_discount = LEAST(v_discount, v_max_discount);
    END IF;

    SET v_allowed = ROUND((v_subtotal * 0.50) - v_running_discount, 2);
    SET v_discount = LEAST(v_discount, GREATEST(v_allowed, 0.00));
    IF v_discount > 0 THEN
      INSERT INTO order_discount (order_id, rule_id, amount)
      VALUES (p_order_id, v_rule_id, v_discount);
      SET v_running_discount = v_running_discount + v_discount;
      IF NOT v_stackable THEN
        SET v_non_stackable_applied = TRUE;
      END IF;
      IF v_rule_type = 'COUPON' THEN
        UPDATE coupon
        SET used_count = used_count + 1
        WHERE code = UPPER(TRIM(p_coupon_code))
          AND used_count < max_uses;
      END IF;
    END IF;
  END LOOP;
  CLOSE rule_cursor;

  UPDATE sales_order
  SET discount_total = v_running_discount,
      total_amount = GREATEST(v_subtotal - v_running_discount, 0.00)
  WHERE order_id = p_order_id;

  COMMIT;

  SELECT od.rule_id, r.name AS rule_name, od.amount
  FROM order_discount od
  JOIN discount_rule r ON r.rule_id = od.rule_id
  WHERE od.order_id = p_order_id
  ORDER BY r.priority ASC, od.rule_id ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_category_sales_cte` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_category_sales_cte`()
BEGIN
    WITH RECURSIVE CategoryHierarchy AS (
        
        SELECT 
            category_id,
            name AS category_name,
            CAST('Root' AS CHAR(100)) AS parent_category,
            1 AS hierarchy_level
        FROM category
        WHERE parent_id IS NULL
        UNION ALL
        
        SELECT 
            c.category_id,
            c.name AS category_name,
            ch.category_name AS parent_category,
            ch.hierarchy_level + 1 AS hierarchy_level
        FROM category c
        JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
    ),
    CategorySalesAgg AS (
        SELECT 
            ch.category_id,
            ch.category_name,
            ch.parent_category,
            ch.hierarchy_level,
            COALESCE(SUM(oi.quantity), 0) AS total_products_sold,
            COALESCE(SUM(oi.line_total), 0.00) AS revenue
        FROM CategoryHierarchy ch
        LEFT JOIN product p ON p.category_id = ch.category_id
        LEFT JOIN order_item oi ON oi.product_id = p.product_id
        LEFT JOIN sales_order o ON o.order_id = oi.order_id AND o.status = 'COMPLETED'
        GROUP BY 
            ch.category_id,
            ch.category_name,
            ch.parent_category,
            ch.hierarchy_level
    )
    SELECT 
        category_id,
        category_name,
        parent_category,
        hierarchy_level,
        total_products_sold,
        revenue,
        ROUND(
            COALESCE(revenue * 100.0 / NULLIF(SUM(revenue) OVER (), 0), 0.0), 
            1
        ) AS revenue_share_percent
    FROM CategorySalesAgg
    ORDER BY hierarchy_level ASC, revenue DESC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_create_purchase_order` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_purchase_order`(
  IN p_supplier_id INT, 
  IN p_branch_id INT, 
  IN p_employee_id INT,
  IN p_product_id INT, 
  IN p_qty DECIMAL(10,2), 
  OUT p_po_id INT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT cost_price INTO v_unit_cost FROM product WHERE product_id = p_product_id;

  START TRANSACTION;
  INSERT INTO purchase_order (supplier_id, branch_id, requested_by, status, total_cost)
  VALUES (p_supplier_id, p_branch_id, p_employee_id, 'REQUESTED', (v_unit_cost * p_qty));
  SET p_po_id = LAST_INSERT_ID();

  INSERT INTO purchase_order_item (po_id, product_id, requested_qty, confirmed_qty, unit_cost)
  VALUES (p_po_id, p_product_id, p_qty, p_qty, v_unit_cost);
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_financial_reconciliation_report` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_financial_reconciliation_report`(
    IN p_branch_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

    
    START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY;

    
    SELECT 
        COUNT(order_id) AS total_completed_orders,
        COALESCE(SUM(subtotal), 0.00) AS gross_sales,
        COALESCE(SUM(discount_total), 0.00) AS total_discounts,
        COALESCE(SUM(total_amount), 0.00) AS net_revenue
    FROM sales_order
    WHERE status = 'COMPLETED'
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND DATE(order_date) BETWEEN p_start_date AND p_end_date;

    
    SELECT 
        p.method AS payment_method,
        COUNT(p.payment_id) AS transaction_count,
        COALESCE(SUM(p.amount), 0.00) AS total_collected
    FROM payment p
    JOIN sales_order o ON o.order_id = p.order_id
    WHERE o.status = 'COMPLETED'
      AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND DATE(o.order_date) BETWEEN p_start_date AND p_end_date
    GROUP BY p.method;

    
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_monthly_report` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_monthly_report`(
    IN p_year INT,
    IN p_month INT,
    IN p_branch INT
)
BEGIN
    SELECT 
        o.branch_id,
        MAX(b.name) AS branch_name,
        DATE(o.order_date) AS day,
        COUNT(o.order_id) AS orders,
        SUM(o.total_amount) AS sales
    FROM sales_order o
    JOIN branch b ON b.branch_id = o.branch_id
    WHERE o.status = 'COMPLETED'
      AND YEAR(o.order_date) = p_year
      AND MONTH(o.order_date) = p_month
      AND (p_branch IS NULL OR o.branch_id = p_branch)
    GROUP BY o.branch_id, DATE(o.order_date) WITH ROLLUP;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_receive_purchase` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_receive_purchase`(
  IN p_po_id INT, 
  IN p_employee_id INT, 
  IN p_received_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_branch INT; 
  DECLARE v_prod INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  SELECT branch_id INTO v_branch FROM purchase_order WHERE po_id = p_po_id FOR UPDATE;
  SELECT product_id INTO v_prod FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET received_qty = p_received_qty 
  WHERE po_id = p_po_id;

  
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (v_branch, v_prod, p_received_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_received_qty, 
    version = version + 1;

  
  UPDATE low_stock_alert 
  SET resolved = TRUE 
  WHERE branch_id = v_branch AND product_id = v_prod;

  
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason, ref_order_id)
  VALUES (v_branch, v_prod, p_received_qty, 'RESTOCK', p_po_id);

  UPDATE purchase_order 
  SET status = 'RECEIVED', 
      received_by = p_employee_id, 
      receiving_notes = p_notes, 
      received_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_register_customer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_register_customer`(
  IN p_full_name VARCHAR(120),
  IN p_phone VARCHAR(20),
  IN p_email VARCHAR(100),
  OUT p_customer_id INT
)
BEGIN
  DECLARE v_existing_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_full_name), '') IS NULL OR NULLIF(TRIM(p_phone), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer name and phone are required';
  END IF;

  SELECT customer_id INTO v_existing_id
  FROM customer
  WHERE phone = TRIM(p_phone)
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer phone number already exists';
  END IF;

  START TRANSACTION;
  INSERT INTO customer (full_name, phone, email)
  VALUES (TRIM(p_full_name), TRIM(p_phone), NULLIF(TRIM(p_email), ''));
  SET p_customer_id = LAST_INSERT_ID();
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_coupon` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_coupon`(
  IN p_code VARCHAR(20),
  IN p_rule_id INT,
  IN p_max_uses INT,
  IN p_expires_on DATE
)
BEGIN
  DECLARE v_rule_exists INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT COUNT(*) INTO v_rule_exists FROM discount_rule WHERE rule_id = p_rule_id;
  IF NULLIF(TRIM(p_code), '') IS NULL OR p_max_uses <= 0 OR p_expires_on IS NULL
     OR v_rule_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid coupon details';
  END IF;

  START TRANSACTION;
  INSERT INTO coupon (code, rule_id, max_uses, expires_on)
  VALUES (UPPER(TRIM(p_code)), p_rule_id, p_max_uses, p_expires_on);
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_discount_rule` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_discount_rule`(
  IN p_rule_id INT,
  IN p_name VARCHAR(100),
  IN p_rule_type VARCHAR(20),
  IN p_kind VARCHAR(10),
  IN p_value DECIMAL(10,2),
  IN p_min_order_amount DECIMAL(12,2),
  IN p_max_discount DECIMAL(12,2),
  IN p_tier VARCHAR(10),
  IN p_start_date DATE,
  IN p_end_date DATE,
  IN p_priority INT,
  IN p_stackable BOOLEAN,
  IN p_is_active BOOLEAN,
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_name), '') IS NULL OR p_value <= 0 OR p_min_order_amount < 0
     OR p_priority < 0 OR p_end_date < p_start_date THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid discount rule values';
  END IF;
  IF p_kind = 'PERCENT' AND p_value > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Percentage discount cannot exceed 100';
  END IF;
  IF p_rule_type = 'LOYALTY'
     AND COALESCE(p_tier, '') NOT IN ('BRONZE', 'SILVER', 'GOLD') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loyalty rule requires a valid tier';
  END IF;

  START TRANSACTION;
  IF p_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      TRIM(p_name), p_rule_type, p_kind, p_value, p_min_order_amount, p_max_discount,
      NULLIF(TRIM(p_tier), ''), p_start_date, p_end_date, p_priority,
      COALESCE(p_stackable, TRUE), COALESCE(p_is_active, TRUE)
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    UPDATE discount_rule
    SET name = TRIM(p_name), rule_type = p_rule_type, kind = p_kind,
        value = p_value, min_order_amount = p_min_order_amount,
        max_discount = p_max_discount, tier = NULLIF(TRIM(p_tier), ''),
        start_date = p_start_date, end_date = p_end_date, priority = p_priority,
        stackable = COALESCE(p_stackable, stackable),
        is_active = COALESCE(p_is_active, is_active)
    WHERE rule_id = p_rule_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Discount rule does not exist';
    END IF;
    SET p_saved_rule_id = p_rule_id;
  END IF;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_holiday` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_holiday`(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Holiday date and name are required';
  END IF;

  START TRANSACTION;
  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_holiday_discount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_holiday_discount`(
  IN p_holiday_date DATE,
  IN p_name VARCHAR(100),
  IN p_discount_percent DECIMAL(10,2),
  OUT p_saved_rule_id INT
)
BEGIN
  DECLARE v_rule_name VARCHAR(100);
  DECLARE v_existing_rule_id INT DEFAULT NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_holiday_date IS NULL
     OR NULLIF(TRIM(p_name), '') IS NULL
     OR p_discount_percent <= 0
     OR p_discount_percent > 100 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Holiday date, name and discount percentage are required; percentage must be between 0 and 100';
  END IF;

  SET v_rule_name = LEFT(CONCAT(TRIM(p_name), ' Promotion'), 100);

  START TRANSACTION;

  INSERT INTO holiday (holiday_date, name)
  VALUES (p_holiday_date, TRIM(p_name))
  ON DUPLICATE KEY UPDATE name = VALUES(name);

  SELECT rule_id
    INTO v_existing_rule_id
  FROM discount_rule
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
  ORDER BY rule_id
  LIMIT 1;

  UPDATE discount_rule
  SET name = v_rule_name,
      value = p_discount_percent,
      end_date = p_holiday_date,
      is_active = TRUE
  WHERE rule_id = v_existing_rule_id;

  IF v_existing_rule_id IS NULL THEN
    INSERT INTO discount_rule (
      name, rule_type, kind, value, min_order_amount, max_discount, tier,
      start_date, end_date, priority, stackable, is_active
    )
    VALUES (
      v_rule_name, 'HOLIDAY', 'PERCENT', p_discount_percent, 0.00, NULL, NULL,
      p_holiday_date, p_holiday_date, 50, TRUE, TRUE
    );
    SET p_saved_rule_id = LAST_INSERT_ID();
  ELSE
    SET p_saved_rule_id = v_existing_rule_id;
  END IF;

  UPDATE discount_rule
  SET is_active = FALSE
  WHERE rule_type = 'HOLIDAY'
    AND start_date = p_holiday_date
    AND rule_id <> p_saved_rule_id;

  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_product` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_product`(
  IN p_product_id INT,
  IN p_category_id INT,
  IN p_supplier_id INT,
  IN p_sku VARCHAR(30),
  IN p_name VARCHAR(150),
  IN p_unit_price DECIMAL(10,2),
  IN p_cost_price DECIMAL(10,2),
  IN p_image_url VARCHAR(255),
  IN p_diet_type VARCHAR(20),
  IN p_unit_of_measure VARCHAR(20),
  IN p_min_order_qty DECIMAL(10,2),
  IN p_is_active BOOLEAN,
  OUT p_saved_product_id INT
)
BEGIN
  DECLARE v_category_exists INT DEFAULT 0;
  DECLARE v_supplier_exists INT DEFAULT 0;
  DECLARE v_duplicate_sku INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF NULLIF(TRIM(p_sku), '') IS NULL OR NULLIF(TRIM(p_name), '') IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU and name are required';
  END IF;
  IF p_unit_price < 0 OR p_cost_price < 0 OR p_min_order_qty <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product prices and minimum quantity are invalid';
  END IF;

  SELECT COUNT(*) INTO v_category_exists FROM category WHERE category_id = p_category_id;
  SELECT COUNT(*) INTO v_supplier_exists FROM supplier WHERE supplier_id = p_supplier_id;
  IF v_category_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product category does not exist';
  END IF;
  IF v_supplier_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product supplier does not exist';
  END IF;

  SELECT COUNT(*) INTO v_duplicate_sku
  FROM product
  WHERE sku = TRIM(p_sku)
    AND (p_product_id IS NULL OR product_id <> p_product_id);
  IF v_duplicate_sku > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product SKU already exists';
  END IF;

  START TRANSACTION;
  IF p_product_id IS NULL THEN
    INSERT INTO product (
      category_id, supplier_id, sku, name, unit_price, cost_price,
      image_url, diet_type, unit_of_measure, min_order_qty, is_active
    )
    VALUES (
      p_category_id, p_supplier_id, TRIM(p_sku), TRIM(p_name), p_unit_price, p_cost_price,
      p_image_url, p_diet_type, p_unit_of_measure, p_min_order_qty, COALESCE(p_is_active, TRUE)
    );
    SET p_saved_product_id = LAST_INSERT_ID();
  ELSE
    UPDATE product
    SET category_id = p_category_id,
        supplier_id = p_supplier_id,
        sku = TRIM(p_sku),
        name = TRIM(p_name),
        unit_price = p_unit_price,
        cost_price = p_cost_price,
        image_url = p_image_url,
        diet_type = p_diet_type,
        unit_of_measure = p_unit_of_measure,
        min_order_qty = p_min_order_qty,
        is_active = COALESCE(p_is_active, is_active)
    WHERE product_id = p_product_id;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not exist';
    END IF;
    SET p_saved_product_id = p_product_id;
  END IF;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_supplier_confirm_order` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_supplier_confirm_order`(
  IN p_po_id INT, 
  IN p_supplier_id INT, 
  IN p_confirmed_qty DECIMAL(10,2), 
  IN p_notes TEXT
)
BEGIN
  DECLARE v_unit_cost DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  UPDATE purchase_order_item 
  SET confirmed_qty = p_confirmed_qty 
  WHERE po_id = p_po_id;

  SELECT unit_cost INTO v_unit_cost FROM purchase_order_item WHERE po_id = p_po_id LIMIT 1;

  UPDATE purchase_order 
  SET status = 'CONFIRMED', 
      supplier_notes = p_notes, 
      total_cost = (v_unit_cost * p_confirmed_qty), 
      confirmed_at = CURRENT_TIMESTAMP
  WHERE po_id = p_po_id AND supplier_id = p_supplier_id;
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_transfer_stock` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_transfer_stock`(
  IN p_from_branch INT, 
  IN p_to_branch INT, 
  IN p_product INT, 
  IN p_qty DECIMAL(10,2)
)
BEGIN
  DECLARE v_current DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  START TRANSACTION;
  
  SELECT quantity INTO v_current FROM inventory
  WHERE branch_id = p_from_branch AND product_id = p_product FOR UPDATE;

  
  IF v_current IS NULL OR v_current < p_qty THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock at source branch';
  END IF;

  
  UPDATE inventory 
  SET quantity = quantity - p_qty, 
      version = version + 1
  WHERE branch_id = p_from_branch AND product_id = p_product;

  
  INSERT INTO inventory (branch_id, product_id, quantity, version)
  VALUES (p_to_branch, p_product, p_qty, 0)
  ON DUPLICATE KEY UPDATE 
    quantity = quantity + p_qty, 
    version = version + 1;

  
  INSERT INTO stock_audit_log (branch_id, product_id, change_qty, reason)
  VALUES (p_from_branch, p_product, -p_qty, 'TRANSFER_OUT'),
         (p_to_branch, p_product, p_qty, 'TRANSFER_IN');
  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_active_discounts`
--

/*!50001 DROP VIEW IF EXISTS `v_active_discounts`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_active_discounts` AS select `discount_rule`.`rule_id` AS `rule_id`,`discount_rule`.`name` AS `name`,`discount_rule`.`rule_type` AS `rule_type`,`discount_rule`.`kind` AS `kind`,`discount_rule`.`value` AS `value`,`discount_rule`.`min_order_amount` AS `min_order_amount`,`discount_rule`.`max_discount` AS `max_discount`,`discount_rule`.`tier` AS `tier`,`discount_rule`.`start_date` AS `start_date`,`discount_rule`.`end_date` AS `end_date`,`discount_rule`.`priority` AS `priority`,`discount_rule`.`stackable` AS `stackable`,`discount_rule`.`is_active` AS `is_active` from `discount_rule` where ((`discount_rule`.`is_active` = true) and (curdate() between `discount_rule`.`start_date` and `discount_rule`.`end_date`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_category_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_category_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_category_summary` AS select `c`.`category_id` AS `category_id`,`c`.`name` AS `name`,`c`.`description` AS `description`,`c`.`icon` AS `icon`,`c`.`parent_id` AS `parent_id`,count((case when (`p`.`is_active` = true) then 1 end)) AS `active_product_count` from (`category` `c` left join `product` `p` on((`p`.`category_id` = `c`.`category_id`))) group by `c`.`category_id`,`c`.`name`,`c`.`description`,`c`.`icon`,`c`.`parent_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_customer_directory`
--

/*!50001 DROP VIEW IF EXISTS `v_customer_directory`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_customer_directory` AS select `c`.`customer_id` AS `customer_id`,`c`.`full_name` AS `full_name`,`c`.`phone` AS `phone`,`c`.`email` AS `email`,`c`.`loyalty_points` AS `loyalty_points`,`fn_customer_tier`(`c`.`customer_id`) AS `tier`,`c`.`registered_date` AS `registered_date` from `customer` `c` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_customer_orders`
--

/*!50001 DROP VIEW IF EXISTS `v_customer_orders`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_customer_orders` AS select `o`.`order_id` AS `order_id`,`o`.`customer_id` AS `customer_id`,`o`.`order_date` AS `order_date`,`o`.`status` AS `status`,`o`.`subtotal` AS `subtotal`,`o`.`discount_total` AS `discount_total`,`o`.`total_amount` AS `total_amount`,count(`oi`.`product_id`) AS `item_count` from (`sales_order` `o` left join `order_item` `oi` on((`oi`.`order_id` = `o`.`order_id`))) group by `o`.`order_id`,`o`.`customer_id`,`o`.`order_date`,`o`.`status`,`o`.`subtotal`,`o`.`discount_total`,`o`.`total_amount` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_daily_sales`
--

/*!50001 DROP VIEW IF EXISTS `v_daily_sales`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_daily_sales` AS select `sales_order`.`branch_id` AS `branch_id`,cast(`sales_order`.`order_date` as date) AS `sale_date`,count(0) AS `orders`,coalesce(sum(`sales_order`.`total_amount`),0.00) AS `total_sales` from `sales_order` where (`sales_order`.`status` = 'COMPLETED') group by `sales_order`.`branch_id`,cast(`sales_order`.`order_date` as date) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_discount_impact`
--

/*!50001 DROP VIEW IF EXISTS `v_discount_impact`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_discount_impact` AS select `r`.`rule_id` AS `rule_id`,`r`.`name` AS `name`,`r`.`rule_type` AS `rule_type`,count(distinct `od`.`order_id`) AS `orders_using`,coalesce(sum(`od`.`amount`),0.00) AS `total_discount`,coalesce(sum(`o`.`total_amount`),0.00) AS `revenue_after_discount`,round((coalesce(sum(`o`.`total_amount`),0.00) / nullif(sum(`od`.`amount`),0)),1) AS `roi_ratio` from ((`order_discount` `od` join `discount_rule` `r` on((`r`.`rule_id` = `od`.`rule_id`))) join `sales_order` `o` on(((`o`.`order_id` = `od`.`order_id`) and (`o`.`status` = 'COMPLETED')))) group by `r`.`rule_id`,`r`.`name`,`r`.`rule_type` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_low_stock`
--

/*!50001 DROP VIEW IF EXISTS `v_low_stock`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_low_stock` AS select `i`.`branch_id` AS `branch_id`,`b`.`name` AS `branch`,`p`.`product_id` AS `product_id`,`p`.`name` AS `product`,`p`.`unit_of_measure` AS `unit_of_measure`,`i`.`quantity` AS `quantity`,`i`.`reorder_level` AS `reorder_level`,`i`.`version` AS `version` from ((`inventory` `i` join `product` `p` on((`p`.`product_id` = `i`.`product_id`))) join `branch` `b` on((`b`.`branch_id` = `i`.`branch_id`))) where (`i`.`quantity` <= `i`.`reorder_level`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_masked_customer_directory`
--

/*!50001 DROP VIEW IF EXISTS `v_masked_customer_directory`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_masked_customer_directory` AS select `customer`.`customer_id` AS `customer_id`,`customer`.`full_name` AS `full_name`,concat(left(`customer`.`phone`,3),'****',right(`customer`.`phone`,3)) AS `masked_phone`,`customer`.`email` AS `email`,`customer`.`loyalty_points` AS `loyalty_points`,`fn_customer_tier`(`customer`.`customer_id`) AS `tier`,`customer`.`registered_date` AS `registered_date` from `customer` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_product_catalog`
--

/*!50001 DROP VIEW IF EXISTS `v_product_catalog`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_product_catalog` AS select `p`.`product_id` AS `product_id`,`p`.`sku` AS `sku`,`p`.`name` AS `product_name`,`p`.`category_id` AS `category_id`,`c`.`name` AS `category_name`,`p`.`supplier_id` AS `supplier_id`,`s`.`name` AS `supplier_name`,`p`.`unit_price` AS `unit_price`,`p`.`cost_price` AS `cost_price`,`p`.`image_url` AS `image_url`,`p`.`diet_type` AS `diet_type`,`p`.`unit_of_measure` AS `unit_of_measure`,`p`.`min_order_qty` AS `min_order_qty`,`p`.`is_active` AS `is_active` from ((`product` `p` join `category` `c` on((`c`.`category_id` = `p`.`category_id`))) join `supplier` `s` on((`s`.`supplier_id` = `p`.`supplier_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_product_ranking`
--

/*!50001 DROP VIEW IF EXISTS `v_product_ranking`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_product_ranking` AS select `p`.`product_id` AS `product_id`,`p`.`name` AS `name`,`p`.`sku` AS `sku`,coalesce(sum(`oi`.`quantity`),0) AS `units_sold`,coalesce(sum(`oi`.`line_total`),0.00) AS `revenue`,rank() OVER (ORDER BY coalesce(sum(`oi`.`line_total`),0.00) desc )  AS `revenue_rank` from ((`product` `p` join `order_item` `oi` on((`oi`.`product_id` = `p`.`product_id`))) join `sales_order` `o` on(((`o`.`order_id` = `oi`.`order_id`) and (`o`.`status` = 'COMPLETED')))) group by `p`.`product_id`,`p`.`name`,`p`.`sku` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_supplier_performance`
--

/*!50001 DROP VIEW IF EXISTS `v_supplier_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_supplier_performance` AS select `s`.`supplier_id` AS `supplier_id`,`s`.`name` AS `supplier_name`,`s`.`contact_person` AS `contact_person`,`s`.`phone` AS `phone`,`s`.`city` AS `city`,count(distinct `po`.`po_id`) AS `total_orders`,coalesce(sum(`poi`.`requested_qty`),0.00) AS `total_requested_qty`,coalesce(sum(`poi`.`confirmed_qty`),0.00) AS `total_confirmed_qty`,coalesce(sum(`poi`.`received_qty`),0.00) AS `total_received_qty`,coalesce(sum(`po`.`total_cost`),0.00) AS `total_spend`,`fn_supplier_fulfillment_rate`(`s`.`supplier_id`) AS `fulfillment_rate`,(case when (`fn_supplier_fulfillment_rate`(`s`.`supplier_id`) >= 95.00) then 'PREFERRED' when (`fn_supplier_fulfillment_rate`(`s`.`supplier_id`) >= 85.00) then 'RELIABLE' else 'UNDER_REVIEW' end) AS `rating_tier` from ((`supplier` `s` left join `purchase_order` `po` on((`po`.`supplier_id` = `s`.`supplier_id`))) left join `purchase_order_item` `poi` on((`poi`.`po_id` = `po`.`po_id`))) where (`s`.`is_active` = true) group by `s`.`supplier_id`,`s`.`name`,`s`.`contact_person`,`s`.`phone`,`s`.`city` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24 12:23:46
