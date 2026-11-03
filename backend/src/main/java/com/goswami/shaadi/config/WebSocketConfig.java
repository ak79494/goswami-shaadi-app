package com.goswami.shaadi.config;

import com.goswami.shaadi.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Per-member topics: /topic/chat/{userId} (new messages), /topic/call/{userId} (call signalling)
     * and /topic/audio/{userId} (relay-mode call audio). These are the only destinations a client may subscribe to.
     */
    private static final Pattern PRIVATE_TOPIC = Pattern.compile("^/topic/(chat|call|audio)/(\\d+)$");

    /**
     * The server pings every 10s, so a phone can tell when its connection has silently died (say, on moving from
     * Wi-Fi to mobile data) and reconnect. It expects nothing back: Android pauses an app's timers in the background,
     * and closing those connections would stop calls from ringing on a phone with the app in the background.
     */
    private static final long[] SERVER_HEARTBEAT = {10_000, 0};

    private final JwtService jwt;

    public WebSocketConfig(JwtService jwt) {
        this.jwt = jwt;
    }

    private TaskScheduler heartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.setDaemon(true);
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue")
            .setTaskScheduler(heartbeatScheduler())
            .setHeartbeatValue(SERVER_HEARTBEAT);
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
    }

    /**
     * Clients must send their JWT in the STOMP CONNECT frame ("Authorization: Bearer ...") and may
     * only subscribe to their own private topics, so nobody can listen in on someone else's chats or calls.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getCommand() == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String header = accessor.getFirstNativeHeader("Authorization");
                    if (header == null || !header.startsWith("Bearer ")) {
                        throw new MessagingException("Missing token");
                    }
                    try {
                        String userId = jwt.parse(header.substring(7)).getSubject();
                        accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
                    } catch (Exception e) {
                        throw new MessagingException("Invalid token");
                    }
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    // Exact own topics only: this also rules out wildcard subscriptions like /topic/call/*.
                    String destination = accessor.getDestination();
                    Matcher m = PRIVATE_TOPIC.matcher(destination == null ? "" : destination);
                    Principal user = accessor.getUser();
                    if (!m.matches() || user == null || !m.group(2).equals(user.getName())) {
                        throw new MessagingException("Not allowed to subscribe to " + destination);
                    }
                } else if (StompCommand.SEND.equals(accessor.getCommand())) {
                    // Clients may only send to the app's handlers, never straight onto someone's topic.
                    String destination = accessor.getDestination();
                    if (accessor.getUser() == null || destination == null || !destination.startsWith("/app/")) {
                        throw new MessagingException("Not allowed to send to " + destination);
                    }
                }
                return message;
            }
        });
    }
}
