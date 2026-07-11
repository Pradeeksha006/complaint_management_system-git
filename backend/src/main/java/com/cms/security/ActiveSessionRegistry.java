package com.cms.security;

import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ActiveSessionRegistry {

    private static class SessionInfo {
        private final String token;
        private LocalDateTime lastActivity;

        public SessionInfo(String token, LocalDateTime lastActivity) {
            this.token = token;
            this.lastActivity = lastActivity;
        }

        public String getToken() {
            return token;
        }

        public LocalDateTime getLastActivity() {
            return lastActivity;
        }

        public void setLastActivity(LocalDateTime lastActivity) {
            this.lastActivity = lastActivity;
        }
    }

    // Maps username to their current active session info
    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    public boolean isSessionActive(String username) {
        SessionInfo info = activeSessions.get(username);
        if (info == null) {
            return false;
        }
        // Inactivity timeout: if the last activity was more than 5 minutes ago, consider the session inactive
        if (info.getLastActivity().isBefore(LocalDateTime.now().minusMinutes(5))) {
            activeSessions.remove(username);
            return false;
        }
        return true;
    }

    public void registerSession(String username, String token) {
        activeSessions.put(username, new SessionInfo(token, LocalDateTime.now()));
    }

    public void updateActivity(String username) {
        SessionInfo info = activeSessions.get(username);
        if (info != null) {
            info.setLastActivity(LocalDateTime.now());
        }
    }

    public void removeSession(String username) {
        activeSessions.remove(username);
    }
}
