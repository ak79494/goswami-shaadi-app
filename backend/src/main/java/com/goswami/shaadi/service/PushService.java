package com.goswami.shaadi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.goswami.shaadi.model.DeviceToken;
import com.goswami.shaadi.repository.DeviceTokenRepository;
import com.goswami.shaadi.repository.UserRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Notifications while the app is closed, sent through Firebase Cloud Messaging. Off until
 * FIREBASE_SERVICE_ACCOUNT_FILE points at the project's service account key.
 */
@Service
public class PushService {

    /** Android notification channels, created by the app (see lib/push.ts and lib/calls.tsx). */
    public static final String CALLS = "calls";
    public static final String MESSAGES = "messages";

    private static final Logger log = LoggerFactory.getLogger(PushService.class);
    private static final String SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

    /** tag: a new notification with the same tag replaces the old one, like a missed call over its ringing call. */
    public record Push(String channel, String tag, String title, String body, Map<String, String> data) {}

    private final DeviceTokenRepository tokens;
    private final UserRepository users;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ExecutorService sender = Executors.newFixedThreadPool(4, r -> {
        Thread thread = new Thread(r, "push-sender");
        thread.setDaemon(true);
        return thread;
    });
    private final GoogleCredentials credentials;
    private final String sendUrl;

    public PushService(
            DeviceTokenRepository tokens,
            UserRepository users,
            ObjectMapper json,
            @Value("${app.push.service-account-file:}") String serviceAccountFile
    ) {
        this.tokens = tokens;
        this.users = users;
        this.json = json;
        GoogleCredentials loaded = null;
        String url = null;
        if (!serviceAccountFile.isBlank()) {
            try (InputStream in = new FileInputStream(serviceAccountFile)) {
                ServiceAccountCredentials account = ServiceAccountCredentials.fromStream(in);
                loaded = account.createScoped(SCOPE);
                url = "https://fcm.googleapis.com/v1/projects/" + account.getProjectId() + "/messages:send";
                log.info("Notifications are on for Firebase project {}", account.getProjectId());
            } catch (Exception e) {
                log.error("Notifications are off: could not read the Firebase key: {}", e.getMessage());
            }
        }
        this.credentials = loaded;
        this.sendUrl = url;
    }

    /** Never slows down the caller, and a failed notification never fails what the member was doing. */
    public void send(Long userId, Push push) {
        if (credentials == null) return;
        try {
            List<String> targets = tokens.tokensOf(userId);
            if (!targets.isEmpty()) sender.submit(() -> targets.forEach(token -> sendOne(token, push)));
        } catch (Exception e) {
            log.warn("Could not queue a notification: {}", e.getMessage());
        }
    }

    @Transactional
    public void saveToken(Long userId, String token) {
        if (token == null || token.isBlank() || token.length() > 512) {
            throw new IllegalArgumentException("Invalid device token");
        }
        DeviceToken device = tokens.findByToken(token).orElseGet(DeviceToken::new);
        device.setUser(users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found")));
        device.setToken(token);
        device.setUpdatedAt(LocalDateTime.now());
        tokens.save(device);
    }

    public void removeToken(Long userId, String token) {
        if (token != null) tokens.removeTokenOf(userId, token);
    }

    private void sendOne(String token, Push push) {
        try {
            credentials.refreshIfExpired();
            HttpRequest request = HttpRequest.newBuilder(URI.create(sendUrl))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + credentials.getAccessToken().getTokenValue())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload(token, push)))
                .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404 || response.body().contains("UNREGISTERED")) {
                // The app was uninstalled, or the phone got a new token.
                tokens.removeToken(token);
            } else if (response.statusCode() >= 300) {
                log.warn("Firebase refused a notification: {} {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("Could not send a notification: {}", e.getMessage());
        }
    }

    String payload(String token, Push push) throws Exception {
        ObjectNode message = json.createObjectNode();
        message.put("token", token);
        message.putObject("notification").put("title", push.title()).put("body", push.body());
        ObjectNode data = message.putObject("data");
        push.data().forEach(data::put);
        ObjectNode android = message.putObject("android");
        android.put("priority", "HIGH");
        ObjectNode notification = android.putObject("notification").put("channel_id", push.channel()).put("sound", "default");
        if (push.tag() != null) notification.put("tag", push.tag());
        ObjectNode root = json.createObjectNode();
        root.set("message", message);
        return json.writeValueAsString(root);
    }
}
