package lk.supermarket.discount;

import java.sql.CallableStatement;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

@Repository
public class DiscountDao {
    private final JdbcTemplate jdbcTemplate;

    public DiscountDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findActiveRules() {
        return jdbcTemplate.queryForList("""
                SELECT rule_id, name, rule_type, kind, value, min_order_amount,
                       max_discount, tier, start_date, end_date, priority, stackable, is_active
                FROM discount_rule
                WHERE is_active = TRUE
                ORDER BY priority, rule_id
                """);
    }

    public List<Map<String, Object>> findCoupons() {
        return jdbcTemplate.queryForList("""
                SELECT c.code, c.rule_id, r.name AS rule_name, c.max_uses,
                       c.used_count, c.expires_on
                FROM coupon c
                JOIN discount_rule r ON r.rule_id = c.rule_id
                ORDER BY c.expires_on, c.code
                """);
    }

    public List<Map<String, Object>> findHolidays() {
        return jdbcTemplate.queryForList(
                """
                SELECT h.holiday_date, h.name,
                       MAX(CASE WHEN r.rule_type = 'HOLIDAY'
                                AND r.start_date = h.holiday_date
                                AND r.is_active = TRUE
                                THEN r.value END) AS discount_percent
                FROM holiday h
                LEFT JOIN discount_rule r
                  ON r.rule_type = 'HOLIDAY'
                 AND r.start_date = h.holiday_date
                GROUP BY h.holiday_date, h.name
                ORDER BY h.holiday_date
                """);
    }

    public void saveCoupon(Map<String, ?> request) {
        jdbcTemplate.call(connection -> {
            CallableStatement statement = connection.prepareCall("{call sp_save_coupon(?,?,?,?)}");
            statement.setString(1, (String) request.get("code"));
            statement.setObject(2, request.get("ruleId"));
            statement.setObject(3, request.get("maxUses"));
            statement.setObject(4, request.get("expiresOn"));
            return statement;
        }, List.of(
                new SqlParameter("p_code", Types.VARCHAR),
                new SqlParameter("p_rule_id", Types.INTEGER),
                new SqlParameter("p_max_uses", Types.INTEGER),
                new SqlParameter("p_expires_on", Types.DATE)));
    }

    public int saveRule(Map<String, ?> parameters) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_save_discount_rule")
                .declareParameters(
                        new SqlParameter("p_rule_id", Types.INTEGER),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_rule_type", Types.VARCHAR),
                        new SqlParameter("p_kind", Types.VARCHAR),
                        new SqlParameter("p_value", Types.DECIMAL),
                        new SqlParameter("p_min_order_amount", Types.DECIMAL),
                        new SqlParameter("p_max_discount", Types.DECIMAL),
                        new SqlParameter("p_tier", Types.VARCHAR),
                        new SqlParameter("p_start_date", Types.DATE),
                        new SqlParameter("p_end_date", Types.DATE),
                        new SqlParameter("p_priority", Types.INTEGER),
                        new SqlParameter("p_stackable", Types.BOOLEAN),
                        new SqlParameter("p_is_active", Types.BOOLEAN),
                        new SqlOutParameter("p_saved_rule_id", Types.INTEGER));
        Number id = (Number) call.execute(parameters).get("p_saved_rule_id");
        return id.intValue();
    }

    public void saveHoliday(Map<String, ?> request) {
        jdbcTemplate.call(connection -> {
            CallableStatement statement = connection.prepareCall("{call sp_save_holiday(?,?)}");
            statement.setObject(1, request.get("holidayDate"));
            statement.setString(2, (String) request.get("name"));
            return statement;
        }, List.of(
                new SqlParameter("p_holiday_date", Types.DATE),
                new SqlParameter("p_name", Types.VARCHAR)));
    }

    public int saveHolidayDiscount(Map<String, ?> request) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_save_holiday_discount")
                .declareParameters(
                        new SqlParameter("p_holiday_date", Types.DATE),
                        new SqlParameter("p_name", Types.VARCHAR),
                        new SqlParameter("p_discount_percent", Types.DECIMAL),
                        new SqlOutParameter("p_saved_rule_id", Types.INTEGER));
        Number id = (Number) call.execute(Map.of(
                "p_holiday_date", request.get("holidayDate"),
                "p_name", request.get("name"),
                "p_discount_percent", request.get("discountPercent")
        )).get("p_saved_rule_id");
        return id.intValue();
    }
}
