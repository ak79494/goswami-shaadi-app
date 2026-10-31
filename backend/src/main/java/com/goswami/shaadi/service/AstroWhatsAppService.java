package com.goswami.shaadi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class AstroWhatsAppService {

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient =
            HttpClient.newHttpClient();

    @Value("${astro.whatsapp.graph-api-url:}")
    private String graphApiUrl;

    @Value("${astro.whatsapp.access-token:}")
    private String accessToken;

    /*
     * IMPORTANT:
     * These numbers stay ONLY on backend.
     * React never receives them.
     */
    private final Map<String, String> astroNumbers =
            Map.of(
                "dilip", "919386289377",
                "jayashree", "919840924789",
                "mamta", "919821254044",
                "medha", "919205402879"
            );

    public AstroWhatsAppService(
            ObjectMapper objectMapper
    ) {
        this.objectMapper = objectMapper;
    }

    public void sendText(
            String astroId,
            String message
    ) {

        String to = astroNumbers.get(astroId);

        if (to == null) {
            throw new IllegalArgumentException(
                    "Unknown astrologer"
            );
        }

        if (
            message == null ||
            message.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Message cannot be empty"
            );
        }

        if (
            graphApiUrl == null ||
            graphApiUrl.isBlank() ||
            accessToken == null ||
            accessToken.isBlank()
        ) {
            throw new IllegalStateException(
                    "WhatsApp Cloud API is not configured on the server"
            );
        }

        try {

            String body =
                    objectMapper.writeValueAsString(
                        Map.of(
                            "messaging_product",
                            "whatsapp",

                            "recipient_type",
                            "individual",

                            "to",
                            to,

                            "type",
                            "text",

                            "text",
                            Map.of(
                                "preview_url",
                                false,

                                "body",
                                message.trim()
                            )
                        )
                    );

            HttpRequest request =
                    HttpRequest.newBuilder()
                        .uri(
                            URI.create(graphApiUrl)
                        )
                        .header(
                            HttpHeaders.AUTHORIZATION,
                            "Bearer " + accessToken
                        )
                        .header(
                            HttpHeaders.CONTENT_TYPE,
                            MediaType.APPLICATION_JSON_VALUE
                        )
                        .POST(
                            HttpRequest.BodyPublishers
                                .ofString(body)
                        )
                        .build();

            HttpResponse<String> response =
                    httpClient.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                    );

            if (
                response.statusCode() < 200 ||
                response.statusCode() >= 300
            ) {

                throw new IllegalStateException(
                    "WhatsApp API returned HTTP "
                    + response.statusCode()
                    + ": "
                    + response.body()
                );
            }

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                "WhatsApp request was interrupted",
                e
            );

        } catch (Exception e) {

            if (
                e instanceof IllegalStateException
            ) {
                throw (IllegalStateException) e;
            }

            throw new IllegalStateException(
                "Unable to send WhatsApp message",
                e
            );
        }
    }
}