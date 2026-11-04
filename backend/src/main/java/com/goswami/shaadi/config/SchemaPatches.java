package com.goswami.shaadi.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Column changes that Hibernate's ddl-auto=update can't make on its own. Each patch checks the
 * current schema first, so it runs once and is a no-op afterwards.
 */
@Component
public class SchemaPatches implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaPatches.class);

    private final JdbcTemplate jdbc;

    public SchemaPatches(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Older databases created these as MySQL ENUMs, which reject the new PENDING / REJECTED
        // statuses and the extra payment methods.
        toVarchar("premium_orders", "status", "varchar(20) NOT NULL");
        toVarchar("premium_orders", "payment_method", "varchar(30) NULL");
        // A payment record outlives the account that made it (see AccountService).
        makeNullable("premium_orders", "user_id", "bigint NULL");
        renameMemberIds();
    }

    private void makeNullable(String table, String column, String definition) {
        try {
            List<String> nullable = jdbc.queryForList(
                "SELECT IS_NULLABLE FROM information_schema.COLUMNS "
                    + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);
            if (!nullable.isEmpty() && "NO".equalsIgnoreCase(nullable.get(0))) {
                jdbc.execute("ALTER TABLE " + table + " MODIFY " + column + " " + definition);
                log.info("Schema patch: {}.{} is now {}", table, column, definition);
            }
        } catch (Exception e) {
            log.warn("Schema patch for {}.{} skipped: {}", table, column, e.getMessage());
        }
    }

    /** Member IDs started with GS under the old name. ProfileService still finds a typed GS0014. */
    private void renameMemberIds() {
        try {
            int changed = jdbc.update(
                "UPDATE users SET goswami_id = CONCAT('GJ', SUBSTRING(goswami_id, 3)) WHERE goswami_id LIKE 'GS%'");
            if (changed > 0) log.info("Data patch: {} member IDs now start with GJ", changed);
        } catch (Exception e) {
            log.warn("Data patch for member IDs skipped: {}", e.getMessage());
        }
    }

    private void toVarchar(String table, String column, String definition) {
        try {
            List<String> types = jdbc.queryForList(
                "SELECT DATA_TYPE FROM information_schema.COLUMNS "
                    + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                String.class, table, column);
            if (!types.isEmpty() && "enum".equalsIgnoreCase(types.get(0))) {
                jdbc.execute("ALTER TABLE " + table + " MODIFY " + column + " " + definition);
                log.info("Schema patch: {}.{} is now {}", table, column, definition);
            }
        } catch (Exception e) {
            log.warn("Schema patch for {}.{} skipped: {}", table, column, e.getMessage());
        }
    }
}
