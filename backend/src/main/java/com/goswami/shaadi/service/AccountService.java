package com.goswami.shaadi.service;

import com.goswami.shaadi.model.Role;
import com.goswami.shaadi.model.User;
import com.goswami.shaadi.repository.UserRepository;
import com.goswami.shaadi.security.LoginGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Deletes a member's account and everything linked to it, as Google Play requires. Only anonymous payment
 * records stay (plan, amount, reference, date), because tax rules require them; the privacy policy says so.
 */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final LoginGuard guard;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private final Path uploadDir;

    public AccountService(
            UserRepository users,
            PasswordEncoder encoder,
            LoginGuard guard,
            JdbcTemplate jdbc,
            PlatformTransactionManager transactions,
            @Value("${app.upload-dir}") String uploadDir
    ) {
        this.users = users;
        this.encoder = encoder;
        this.guard = guard;
        this.jdbc = jdbc;
        this.transaction = new TransactionTemplate(transactions);
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /** From inside the app or the website while signed in. The password is asked again because this can't be undone. */
    public void deleteSignedIn(Long userId, String password, String reason) {
        User user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        confirmPassword(user, password, "Your password is incorrect");
        delete(user, reason);
    }

    /** From the public deletion page, which has to work without the app. */
    public void deleteWithLogin(String email, String password, String reason) {
        String clean = email == null ? "" : email.trim().toLowerCase();
        User user = users.findByEmail(clean).orElse(null);
        if (user == null) {
            guard.check(clean);
            guard.failed(clean);
            throw new IllegalArgumentException("Email or password is incorrect");
        }
        confirmPassword(user, password, "Email or password is incorrect");
        delete(user, reason);
    }

    private void confirmPassword(User user, String password, String wrongMessage) {
        guard.check(user.getEmail());
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            guard.failed(user.getEmail());
            throw new IllegalArgumentException(wrongMessage);
        }
        guard.succeeded(user.getEmail());
    }

    private void delete(User user, String reason) {
        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin accounts can't be deleted here. Please contact support.");
        }
        Long id = user.getId();
        List<String> files = transaction.execute(status -> removeRows(id));
        // Only after the database change has gone through, so a failure never leaves a profile without its photos.
        files.forEach(this::removeFile);
        log.info("Account {} deleted. Reason: {}", id, reason == null || reason.isBlank() ? "not given" : reason);
    }

    private List<String> removeRows(Long id) {
        List<String> files = new ArrayList<>(jdbc.queryForList(
            "SELECT file_name FROM profile_photos WHERE user_id = ?", String.class, id));
        files.addAll(jdbc.queryForList(
            "SELECT m.audio_url FROM messages m JOIN conversations c ON m.conversation_id = c.id "
                + "WHERE (c.user1_id = ? OR c.user2_id = ?) AND m.audio_url IS NOT NULL", String.class, id, id));
        files.addAll(jdbc.queryForList(
            "SELECT evidence_path FROM profile_reports "
                + "WHERE (reporter_user_id = ? OR reported_user_id = ?) AND evidence_path IS NOT NULL", String.class, id, id));

        removeNameFromOthersNotifications(id);

        jdbc.update("DELETE m FROM messages m JOIN conversations c ON m.conversation_id = c.id "
            + "WHERE c.user1_id = ? OR c.user2_id = ?", id, id);
        removeLinks("conversations", "user1_id", "user2_id", id);
        removeLinks("interest_requests", "sender_id", "receiver_id", id);
        removeLinks("shortlists", "user_id", "target_user_id", id);
        removeLinks("hidden_profiles", "user_id", "hidden_user_id", id);
        removeLinks("blocks", "user_id", "blocked_user_id", id);
        removeLinks("profile_visits", "visitor_user_id", "profile_user_id", id);
        removeLinks("profile_reports", "reporter_user_id", "reported_user_id", id);
        jdbc.update("DELETE FROM notifications WHERE user_id = ?", id);
        jdbc.update("DELETE FROM help_requests WHERE user_id = ?", id);
        jdbc.update("DELETE FROM partner_preferences WHERE user_id = ?", id);
        jdbc.update("DELETE FROM profile_photos WHERE user_id = ?", id);
        jdbc.update("DELETE h FROM profile_hobbies h JOIN profiles p ON h.profile_id = p.id WHERE p.user_id = ?", id);
        jdbc.update("DELETE FROM profiles WHERE user_id = ?", id);
        // A payment that reached the account stays as an anonymous record; orders never paid for just go.
        jdbc.update("UPDATE premium_orders SET user_id = NULL WHERE user_id = ? AND transaction_id IS NOT NULL", id);
        jdbc.update("DELETE FROM premium_orders WHERE user_id = ?", id);
        jdbc.update("DELETE FROM users WHERE id = ?", id);
        return files;
    }

    private void removeLinks(String table, String column1, String column2, Long id) {
        jdbc.update("DELETE FROM " + table + " WHERE " + column1 + " = ? OR " + column2 + " = ?", id, id);
    }

    /** "Priya sent you an interest" and the like in the inboxes of members this person dealt with. */
    private void removeNameFromOthersNotifications(Long id) {
        List<String> names = jdbc.queryForList("SELECT first_name FROM profiles WHERE user_id = ?", String.class, id);
        if (names.isEmpty() || names.get(0) == null || names.get(0).isBlank()) return;
        List<Long> others = jdbc.queryForList(
            "SELECT user1_id FROM conversations WHERE user2_id = ? "
                + "UNION SELECT user2_id FROM conversations WHERE user1_id = ? "
                + "UNION SELECT receiver_id FROM interest_requests WHERE sender_id = ? "
                + "UNION SELECT sender_id FROM interest_requests WHERE receiver_id = ? "
                + "UNION SELECT profile_user_id FROM profile_visits WHERE visitor_user_id = ?",
            Long.class, id, id, id, id, id);
        for (Long other : others) {
            jdbc.update("DELETE FROM notifications WHERE user_id = ? AND LOCATE(?, message) > 0", other, names.get(0));
        }
    }

    private void removeFile(String name) {
        try {
            // Reports keep a /uploads/reports/x path, photos a bare name and voice notes /uploads/x.
            String relative = name.startsWith("/uploads/") ? name.substring("/uploads/".length()) : name;
            Path file = uploadDir.resolve(relative).normalize();
            if (file.startsWith(uploadDir)) Files.deleteIfExists(file);
        } catch (Exception e) {
            log.warn("Could not remove file {}: {}", name, e.getMessage());
        }
    }
}
