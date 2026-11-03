package com.goswami.shaadi.config;

import com.goswami.shaadi.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/auth/heartbeat").authenticated()
                .requestMatchers("/api/auth/**", "/api/public/**", "/uploads/**", "/ws/**").permitAll()
                .anyRequest().authenticated())
            // A missing or expired token gets 401, so the apps know to sign the member in again.
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration c = new CorsConfiguration();

        c.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://172.20.10.2:5173",
            // Expo web preview of the mobile app (the native app sends no Origin header).
            "http://localhost:8081",
            "http://127.0.0.1:8081"
        ));

        c.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        c.setAllowedHeaders(List.of("*"));

        c.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        // The phone apps' websocket sends the server's own public address as its Origin, which the
        // list above would refuse. Any origin may open the socket: it is useless without a valid
        // login token in the STOMP CONNECT frame (see WebSocketConfig).
        CorsConfiguration websocket = new CorsConfiguration();
        websocket.setAllowedOriginPatterns(List.of("*"));
        websocket.setAllowedMethods(List.of("GET", "OPTIONS"));
        websocket.setAllowedHeaders(List.of("*"));
        source.registerCorsConfiguration("/ws", websocket);
        source.registerCorsConfiguration("/ws/**", websocket);

        source.registerCorsConfiguration("/**", c);

        return source;
    }
}
