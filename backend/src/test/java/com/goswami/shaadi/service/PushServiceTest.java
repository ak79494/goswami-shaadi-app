package com.goswami.shaadi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goswami.shaadi.repository.DeviceTokenRepository;
import com.goswami.shaadi.repository.UserRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PushServiceTest {

    private final DeviceTokenRepository tokens = mock(DeviceTokenRepository.class);
    private final ObjectMapper json = new ObjectMapper();
    private final PushService push = new PushService(tokens, mock(UserRepository.class), json, "");

    @Test
    void offWithoutAKeySoNothingIsLookedUpOrSent() {
        push.send(1L, new PushService.Push(PushService.MESSAGES, null, "t", "b", Map.of()));
        verifyNoInteractions(tokens);
    }

    @Test
    void aBadKeyFileLeavesItOffInsteadOfStoppingTheServer() {
        PushService broken = new PushService(tokens, mock(UserRepository.class), json, "/no/such/file.json");
        broken.send(1L, new PushService.Push(PushService.MESSAGES, null, "t", "b", Map.of()));
        verifyNoInteractions(tokens);
    }

    @Test
    void messageHasTheShapeFirebaseExpects() throws Exception {
        JsonNode m = json.readTree(push.payload("abc", new PushService.Push(PushService.CALLS, "call-1", "Incoming voice call", "Priya is calling", Map.of("type", "call")))).path("message");
        assertEquals("abc", m.path("token").asText());
        assertEquals("Incoming voice call", m.path("notification").path("title").asText());
        assertEquals("call", m.path("data").path("type").asText());
        assertEquals("HIGH", m.path("android").path("priority").asText());
        assertEquals("calls", m.path("android").path("notification").path("channel_id").asText());
        assertEquals("call-1", m.path("android").path("notification").path("tag").asText());
    }
}
