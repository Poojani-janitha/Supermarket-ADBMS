package lk.supermarket;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.AbstractDataSource;

import java.sql.Connection;
import java.sql.SQLException;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration"
})
class BackendApplicationTests {
	@TestConfiguration
	static class TestJdbcConfiguration {
		@Bean
		JdbcTemplate jdbcTemplate() {
			return new JdbcTemplate(new AbstractDataSource() {
				@Override
				public Connection getConnection() throws SQLException {
					throw new SQLException("Database access is not used by this context test");
				}

				@Override
				public Connection getConnection(String username, String password) throws SQLException {
					throw new SQLException("Database access is not used by this context test");
				}
			});
		}
	}

	@Test
	void contextLoads() {
	}

}
