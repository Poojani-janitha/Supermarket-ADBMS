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

-- CHANGE MASTER TO MASTER_LOG_FILE='KRISHAN-bin.000018', MASTER_LOG_POS=157;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'category',
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
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loyalty_points` int NOT NULL DEFAULT '0',
  `registered_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone` (`phone`),
  CONSTRAINT `customer_chk_1` CHECK ((`loyalty_points` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'Jacob Jones','0771234567','jacob@example.com',420,'2023-01-15 10:00:00'),(2,'Bessie Coleman','0772345678','bessie@example.com',180,'2023-04-20 11:30:00'),(3,'Ralph Edwards','0773456789','ralph@example.com',60,'2024-01-10 14:15:00'),(4,'Devon Lane','0774567890','devon@example.com',0,'2024-03-01 09:00:00');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
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

--
-- Table structure for table `discount_rule`
--

DROP TABLE IF EXISTS `discount_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount_rule` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` enum('FIRST_PURCHASE','HOLIDAY','LOYALTY','COUPON') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('PERCENT','FIXED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `tier` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  `changed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `full_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','MANAGER','CASHIER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hire_date` date NOT NULL DEFAULT (curdate()),
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `username` (`username`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,1,'System Administrator','ADMIN','admin','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(2,1,'Arlene McCoy (Manager)','MANAGER','manager1','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(3,1,'Floyd Miles (Cashier)','CASHIER','cashier1','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(100,1,'Kavindu Perera (Admin)','ADMIN','admin_kavindu','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(101,1,'Floyd Miles','CASHIER','cashier_floyd','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(102,1,'Arlene McCoy','MANAGER','manager_arlene','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(103,2,'Kamal Gunaratne','CASHIER','cashier_kamal','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1),(104,3,'Nimal Silva','MANAGER','manager_nimal','$2a$10$k4W9LDVKtmPEVd4jd36lFefCxn94jzlkEWHYFV1YKkRlLVtlK1EXi','2026-10-18',1);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
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
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_security_alert` BEFORE UPDATE ON `employee` FOR EACH ROW BEGIN
  
  IF (OLD.employee_id IN (1, 100) OR OLD.username IN ('admin', 'admin_kavindu')) 
     AND (NEW.role <> 'ADMIN' OR NEW.is_active = FALSE) THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Security Violation: Primary root administrator account cannot be deactivated or demoted';
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
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_employee_audit` AFTER UPDATE ON `employee` FOR EACH ROW BEGIN
  IF OLD.role <> NEW.role 
     OR OLD.branch_id <> NEW.branch_id 
     OR OLD.is_active <> NEW.is_active THEN
    INSERT INTO employee_audit_log (
      employee_id, 
      old_role, 
      new_role, 
      old_branch_id, 
      new_branch_id, 
      is_active_changed, 
      changed_by,
      changed_at
    ) VALUES (
      NEW.employee_id, 
      OLD.role, 
      NEW.role, 
      OLD.branch_id, 
      NEW.branch_id,
      (OLD.is_active <> NEW.is_active), 
      USER(),
      NOW()
    );
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employee_audit_log`
--

DROP TABLE IF EXISTS `employee_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `old_role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_branch_id` int DEFAULT NULL,
  `new_branch_id` int DEFAULT NULL,
  `is_active_changed` tinyint(1) NOT NULL DEFAULT '0',
  `changed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_audit_log`
--

LOCK TABLES `employee_audit_log` WRITE;
/*!40000 ALTER TABLE `employee_audit_log` DISABLE KEYS */;
INSERT INTO `employee_audit_log` VALUES (9,101,'CASHIER','MANAGER',1,1,0,'root@localhost','2026-10-18 11:25:48'),(10,101,'MANAGER','CASHIER',1,1,0,'root@localhost','2026-10-18 11:25:56'),(11,103,'CASHIER','CASHIER',2,2,1,'root@localhost','2026-10-18 11:29:48'),(12,101,'CASHIER','MANAGER',1,1,0,'root@localhost','2026-10-18 11:29:48'),(13,103,'CASHIER','CASHIER',2,2,1,'root@localhost','2026-10-18 11:29:48'),(14,101,'MANAGER','CASHIER',1,1,0,'root@localhost','2026-10-18 11:29:48');
/*!40000 ALTER TABLE `employee_audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holiday`
--

DROP TABLE IF EXISTS `holiday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holiday` (
  `holiday_date` date NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holiday`
--

LOCK TABLES `holiday` WRITE;
/*!40000 ALTER TABLE `holiday` DISABLE KEYS */;
INSERT INTO `holiday` VALUES ('2026-01-01','New Year Day'),('2026-04-14','Sinhala and Tamil New Year'),('2026-05-01','May Day'),('2026-10-18','Today Special Supermarket Promotion'),('2026-12-25','Christmas Day');
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
  `method` enum('CASH','CARD','QR','ONLINE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `changed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `sku` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diet_type` enum('VEG','NON_VEG') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'VEG',
  `unit_of_measure` enum('KG','G','L','ML','PACKET','PIECE','CAN','BOTTLE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PIECE',
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
INSERT INTO `product` VALUES (1,1,1,'PRD-AVO-001','Fresh Hass Avocados (1kg)',5.99,3.50,NULL,'VEG','PIECE',1.00,1),(2,2,1,'PRD-RIC-002','Keeri Samba Rice (5kg)',14.50,10.00,NULL,'VEG','PIECE',1.00,1),(3,3,2,'PRD-MLK-003','Fresh Pasturised Milk 1L',5.60,3.80,NULL,'VEG','PIECE',1.00,1),(4,4,3,'PRD-TEA-004','Ceylon Orange Pekoe Tea',4.80,2.80,NULL,'VEG','PIECE',1.00,1),(5,5,1,'PRD-BRD-005','Whole Wheat Sourdough Bread',3.40,1.90,NULL,'VEG','PIECE',1.00,1),(6,1,1,'PRD-BAN-006','Organic Cavendish Bananas',2.50,1.20,NULL,'VEG','PIECE',1.00,1);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

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
  `status` enum('REQUESTED','CONFIRMED','RECEIVED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUESTED',
  `total_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `supplier_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `receiving_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order`
--

LOCK TABLES `purchase_order` WRITE;
/*!40000 ALTER TABLE `purchase_order` DISABLE KEYS */;
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
  `status` enum('COMPLETED','CANCELLED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED',
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
  `event_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `performed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logged_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_event_log`
--

LOCK TABLES `security_event_log` WRITE;
/*!40000 ALTER TABLE `security_event_log` DISABLE KEYS */;
INSERT INTO `security_event_log` VALUES (1,'ROLE_CHANGE','Emp ID: 999 New Role: MANAGER','root@localhost','2026-10-18 11:15:41'),(2,'EMPLOYEE_DEACTIVATED','Target Employee ID: 999','root@localhost','2026-10-18 11:15:41'),(3,'ROLE_CHANGE','Emp ID: 999 New Role: MANAGER','root@localhost','2026-10-18 11:16:07'),(4,'EMPLOYEE_DEACTIVATED','Target Employee ID: 999','root@localhost','2026-10-18 11:16:07'),(5,'ROLE_CHANGE','Emp ID: 999 New Role: MANAGER','root@localhost','2026-10-18 11:17:17'),(6,'EMPLOYEE_DEACTIVATED','Target Employee ID: 999','root@localhost','2026-10-18 11:17:17'),(7,'ROLE_CHANGE','Emp ID: 999 New Role: MANAGER','root@localhost','2026-10-18 11:19:07'),(8,'EMPLOYEE_DEACTIVATED','Target Employee ID: 999','root@localhost','2026-10-18 11:19:07'),(9,'ROLE_CHANGE','Emp ID: 101 New Role: MANAGER','root@localhost','2026-10-18 11:25:48'),(10,'ROLE_CHANGE','Emp ID: 101 New Role: CASHIER','root@localhost','2026-10-18 11:25:56'),(11,'EMPLOYEE_DEACTIVATED','Target Employee ID: 103','root@localhost','2026-10-18 11:29:48'),(12,'ROLE_CHANGE','Emp ID: 101 New Role: MANAGER','root@localhost','2026-10-18 11:29:48');
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
  `reason` enum('SALE','RESTOCK','CANCEL','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('PENDING_APPROVAL','ACTIVE','SUSPENDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (1,'Lanka Agro Farms PLC','Sunil Perera','0779988111','sunil@lankaagro.lk',NULL,NULL,'Colombo',NULL,1,'ACTIVE'),(2,'CIC Dairies & Foods','Kamal Fernando','0778877222','kamal@cicfoods.lk',NULL,NULL,'Kurunegala',NULL,1,'ACTIVE'),(3,'Ceylon Tea Exports Ltd','Nimal Silva','0776655333','nimal@ceylontea.lk',NULL,NULL,'Kandy',NULL,1,'ACTIVE');
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_active_discounts`
--

DROP TABLE IF EXISTS `v_active_discounts`;
/*!50001 DROP VIEW IF EXISTS `v_active_discounts`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_active_discounts` AS SELECT 
 1 AS `rule_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_daily_sales`
--

DROP TABLE IF EXISTS `v_daily_sales`;
/*!50001 DROP VIEW IF EXISTS `v_daily_sales`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_daily_sales` AS SELECT 
 1 AS `branch_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_discount_impact`
--

DROP TABLE IF EXISTS `v_discount_impact`;
/*!50001 DROP VIEW IF EXISTS `v_discount_impact`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_discount_impact` AS SELECT 
 1 AS `rule_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_employee_audit_history`
--

DROP TABLE IF EXISTS `v_employee_audit_history`;
/*!50001 DROP VIEW IF EXISTS `v_employee_audit_history`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_employee_audit_history` AS SELECT 
 1 AS `log_id`,
 1 AS `employee_id`,
 1 AS `employee_name`,
 1 AS `old_role`,
 1 AS `new_role`,
 1 AS `old_branch_name`,
 1 AS `new_branch_name`,
 1 AS `is_active_changed`,
 1 AS `changed_by`,
 1 AS `changed_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_low_stock`
--

DROP TABLE IF EXISTS `v_low_stock`;
/*!50001 DROP VIEW IF EXISTS `v_low_stock`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_low_stock` AS SELECT 
 1 AS `branch_id`*/;
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
 1 AS `registered_date`,
 1 AS `loyalty_points`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_product_ranking`
--

DROP TABLE IF EXISTS `v_product_ranking`;
/*!50001 DROP VIEW IF EXISTS `v_product_ranking`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_product_ranking` AS SELECT 
 1 AS `product_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_security_audit_log`
--

DROP TABLE IF EXISTS `v_security_audit_log`;
/*!50001 DROP VIEW IF EXISTS `v_security_audit_log`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_security_audit_log` AS SELECT 
 1 AS `log_id`,
 1 AS `event_type`,
 1 AS `details`,
 1 AS `performed_by`,
 1 AS `logged_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'supermarket_db'
--

--
-- Dumping routines for database 'supermarket_db'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_check_password_strength` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_check_password_strength`(p_password VARCHAR(100)) RETURNS varchar(20) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    DETERMINISTIC
BEGIN
  DECLARE v_score INT DEFAULT 0;

  IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
    RETURN 'WEAK';
  END IF;

  
  SET v_score = v_score + 1;

  
  IF REGEXP_LIKE(p_password, '[A-Z]', 'c') THEN
    SET v_score = v_score + 1;
  END IF;

  
  IF REGEXP_LIKE(p_password, '[a-z]', 'c') THEN
    SET v_score = v_score + 1;
  END IF;

  
  IF p_password REGEXP '[0-9]' THEN
    SET v_score = v_score + 1;
  END IF;

  
  IF p_password REGEXP '[-!@#$%^&*()_+|~=`{}\\[\\]:";\'<>?,./]' THEN
    SET v_score = v_score + 1;
  END IF;

  IF v_score >= 5 THEN
    RETURN 'STRONG';
  ELSEIF v_score >= 4 THEN
    RETURN 'MEDIUM';
  ELSE
    RETURN 'WEAK';
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_mask_phone` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_mask_phone`(p_phone VARCHAR(20)) RETURNS varchar(20) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    DETERMINISTIC
BEGIN
  IF p_phone IS NULL OR LENGTH(p_phone) < 7 THEN
    RETURN p_phone;
  END IF;

  RETURN CONCAT(LEFT(p_phone, 3), '****', RIGHT(p_phone, 3));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_add_stock` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_stock`(IN p_dummy INT)
BEGIN END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_change_user_role` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_change_user_role`(
  IN p_emp_id INT, 
  IN p_new_role VARCHAR(20)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  
  IF p_new_role NOT IN ('ADMIN', 'MANAGER', 'CASHIER') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Invalid role: must be ADMIN, MANAGER, or CASHIER';
  END IF;

  
  IF (SELECT COUNT(*) FROM employee WHERE employee_id = p_emp_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Employee not found';
  END IF;

  START TRANSACTION;

  UPDATE employee 
  SET role = p_new_role 
  WHERE employee_id = p_emp_id;

  INSERT INTO security_event_log (event_type, details, performed_by)
  VALUES ('ROLE_CHANGE', CONCAT('Emp ID: ', p_emp_id, ' New Role: ', p_new_role), USER());

  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_deactivate_employee` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deactivate_employee`(
  IN p_admin_id INT, 
  IN p_target_emp_id INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION 
  BEGIN 
    ROLLBACK; 
    RESIGNAL; 
  END;

  
  IF p_admin_id = p_target_emp_id THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'Security Violation: Administrator cannot deactivate own account';
  END IF;

  
  IF (SELECT COUNT(*) FROM employee WHERE employee_id = p_target_emp_id) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Employee not found';
  END IF;

  START TRANSACTION;

  UPDATE employee 
  SET is_active = FALSE 
  WHERE employee_id = p_target_emp_id;

  INSERT INTO security_event_log (event_type, details, performed_by)
  VALUES ('EMPLOYEE_DEACTIVATED', CONCAT('Target Employee ID: ', p_target_emp_id), USER());

  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_login` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_login`(IN p_username VARCHAR(50))
BEGIN
  SELECT employee_id, branch_id, full_name, role, password_hash, is_active
  FROM employee 
  WHERE username = p_username AND is_active = TRUE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_place_order` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_place_order`(IN p_dummy JSON)
BEGIN END ;;
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_receive_purchase`(IN p_dummy INT)
BEGIN END ;;
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_register_customer`(IN p_dummy VARCHAR(50))
BEGIN END ;;
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_transfer_stock`(IN p_dummy INT)
BEGIN END ;;
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
/*!50001 VIEW `v_active_discounts` AS select 1 AS `rule_id` */;
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
/*!50001 VIEW `v_daily_sales` AS select 1 AS `branch_id` */;
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
/*!50001 VIEW `v_discount_impact` AS select 1 AS `rule_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_employee_audit_history`
--

/*!50001 DROP VIEW IF EXISTS `v_employee_audit_history`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_employee_audit_history` AS select `eal`.`log_id` AS `log_id`,`eal`.`employee_id` AS `employee_id`,`e`.`full_name` AS `employee_name`,`eal`.`old_role` AS `old_role`,`eal`.`new_role` AS `new_role`,`b_old`.`name` AS `old_branch_name`,`b_new`.`name` AS `new_branch_name`,`eal`.`is_active_changed` AS `is_active_changed`,`eal`.`changed_by` AS `changed_by`,`eal`.`changed_at` AS `changed_at` from (((`employee_audit_log` `eal` join `employee` `e` on((`e`.`employee_id` = `eal`.`employee_id`))) left join `branch` `b_old` on((`b_old`.`branch_id` = `eal`.`old_branch_id`))) left join `branch` `b_new` on((`b_new`.`branch_id` = `eal`.`new_branch_id`))) */;
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
/*!50001 VIEW `v_low_stock` AS select 1 AS `branch_id` */;
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
/*!50001 VIEW `v_masked_customer_directory` AS select `customer`.`customer_id` AS `customer_id`,`customer`.`full_name` AS `full_name`,`fn_mask_phone`(`customer`.`phone`) AS `masked_phone`,`customer`.`registered_date` AS `registered_date`,`customer`.`loyalty_points` AS `loyalty_points` from `customer` */;
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
/*!50001 VIEW `v_product_ranking` AS select 1 AS `product_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_security_audit_log`
--

/*!50001 DROP VIEW IF EXISTS `v_security_audit_log`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_security_audit_log` AS select `security_event_log`.`log_id` AS `log_id`,`security_event_log`.`event_type` AS `event_type`,`security_event_log`.`details` AS `details`,`security_event_log`.`performed_by` AS `performed_by`,`security_event_log`.`logged_at` AS `logged_at` from `security_event_log` */;
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

-- Dump completed on 2026-10-18 14:45:58
