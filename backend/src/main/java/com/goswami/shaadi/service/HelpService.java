package com.goswami.shaadi.service;

import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.HelpRequestRepository;
import com.goswami.shaadi.repository.NotificationRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class HelpService {

    private static final Set<String> STATUSES = Set.of("NEW", "CONTACTED", "CLOSED");

    private final HelpRequestRepository requests;
    private final UserRepository users;
    private final NotificationRepository notifications;

    public HelpService(HelpRequestRepository requests, UserRepository users, NotificationRepository notifications) {
        this.requests = requests;
        this.users = users;
        this.notifications = notifications;
    }

    public record HelpRequestBody(String name, String phone, String topic, String message) {}

    public record HelpRequestView(Long id, Long userId, String goswamiId, String name, String phone,
                                  String topic, String message, String status, LocalDateTime createdAt) {}

    /** userId is null for visitors who aren't signed in. */
    @Transactional
    public HelpRequestView create(Long userId, HelpRequestBody body) {
        if (body == null) throw new IllegalArgumentException("Tell us how we can help");
        String name = trim(body.name(), 100);
        if (name == null || name.length() < 2) throw new IllegalArgumentException("Enter your name");
        String phone = body.phone() == null ? "" : body.phone().replaceAll("[^0-9]", "");
        if (phone.length() == 12 && phone.startsWith("91")) phone = phone.substring(2);
        if (!phone.matches("[6-9][0-9]{9}")) throw new IllegalArgumentException("Enter a valid 10-digit mobile number");
        String topic = trim(body.topic(), 60);
        if (topic == null) topic = "General";

        HelpRequest r = new HelpRequest();
        if (userId != null) r.setUser(users.findById(userId).orElse(null));
        r.setName(name);
        r.setPhone(phone);
        r.setTopic(topic);
        r.setMessage(trim(body.message(), 1000));
        requests.save(r);

        for (User admin : users.findByRole(Role.ADMIN)) {
            Notification n = new Notification();
            n.setUser(admin);
            n.setType("HELP");
            n.setMessage("New help request from " + name + " (" + phone + "): " + topic);
            n.setRead(false);
            notifications.save(n);
        }
        return view(r);
    }

    @Transactional(readOnly = true)
    public List<HelpRequestView> recent() {
        return requests.findTop100ByOrderByCreatedAtDesc().stream().map(this::view).toList();
    }

    @Transactional
    public HelpRequestView setStatus(Long id, String status) {
        String s = status == null ? "" : status.trim().toUpperCase();
        if (!STATUSES.contains(s)) throw new IllegalArgumentException("Unknown status");
        HelpRequest r = requests.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
        r.setStatus(s);
        return view(requests.save(r));
    }

    private HelpRequestView view(HelpRequest r) {
        User u = r.getUser();
        return new HelpRequestView(r.getId(), u == null ? null : u.getId(), u == null ? null : u.getGoswamiId(),
            r.getName(), r.getPhone(), r.getTopic(), r.getMessage(), r.getStatus(), r.getCreatedAt());
    }

    private String trim(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
