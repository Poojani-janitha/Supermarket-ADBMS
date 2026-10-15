-- ============================================================================
-- SUPERMARKET CHAIN MANAGEMENT SYSTEM
-- ICT3222 Advanced Database Management Systems (ADBMS)
-- Script: 03_functions_security.sql
-- Primary Owner: Member 5 (Security, RBAC, Data Masking & Administration)
-- ============================================================================

USE supermarket_db;

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 1. fn_mask_phone
-- Dynamic Data Masking UDF for PII compliance.
-- Converts '0771234567' -> '077****567' to protect customer phone numbers from
-- unauthorized exposure at Cashier terminals.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_mask_phone$$
CREATE FUNCTION fn_mask_phone(p_phone VARCHAR(20)) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  IF p_phone IS NULL OR LENGTH(p_phone) < 7 THEN
    RETURN p_phone;
  END IF;

  RETURN CONCAT(LEFT(p_phone, 3), '****', RIGHT(p_phone, 3));
END$$

-- ----------------------------------------------------------------------------
-- 2. fn_check_password_strength
-- Evaluates password complexity directly inside MySQL to prevent weak credentials.
-- Criteria: Minimum 8 chars, lowercase, uppercase, numeric digit, special char.
-- Returns: 'STRONG', 'MEDIUM', or 'WEAK'
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_check_password_strength$$
CREATE FUNCTION fn_check_password_strength(p_password VARCHAR(100)) 
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE v_score INT DEFAULT 0;

  IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
    RETURN 'WEAK';
  END IF;

  -- 1 point for meeting min length 8
  SET v_score = v_score + 1;

  -- Check uppercase
  IF p_password REGEXP '[A-Z]' THEN
    SET v_score = v_score + 1;
  END IF;

  -- Check lowercase
  IF p_password REGEXP '[a-z]' THEN
    SET v_score = v_score + 1;
  END IF;

  -- Check numbers
  IF p_password REGEXP '[0-9]' THEN
    SET v_score = v_score + 1;
  END IF;

  -- Check special characters
  IF p_password REGEXP '[-!@#$%^&*()_+|~=`{}\\[\\]:";\'<>?,./]' THEN
    SET v_score = v_score + 1;
  END IF;

  IF v_score >= 5 THEN
    RETURN 'STRONG';
  ELSEIF v_score >= 3 THEN
    RETURN 'MEDIUM';
  ELSE
    RETURN 'WEAK';
  END IF;
END$$

DELIMITER ;
