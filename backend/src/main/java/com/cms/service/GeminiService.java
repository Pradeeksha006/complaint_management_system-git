package com.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-2.0-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String callGemini(String prompt, boolean jsonMode) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key is not configured. Returning empty response.");
            return "";
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

            Map<String, Object> partsMap = new HashMap<>();
            partsMap.put("text", prompt);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", List.of(partsMap));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(contentMap));

            if (jsonMode) {
                Map<String, Object> generationConfig = new HashMap<>();
                generationConfig.put("responseMimeType", "application/json");
                requestBody.put("generationConfig", generationConfig);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidate = root.path("candidates").get(0);
                if (candidate != null) {
                    JsonNode textNode = candidate.path("content").path("parts").get(0).path("text");
                    if (textNode != null) {
                        return textNode.asText().trim();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Gemini API key rate limited or failed. Triggering local fallbacks.", e.getMessage());
        }
        return "";
    }

    public String generateSummary(String description) {
        String prompt = "Summarize the following citizen complaint description in one short, clear sentence (maximum 12 words). " +
                "Do not include any prefix, greeting, markdown formatting, quotes, or trailing explanations. " +
                "Be straight to the point. Complaint description: " + description;
        String summary = callGemini(prompt, false);
        if (summary == null || summary.trim().isEmpty()) {
            // Local fallback summary
            if (description.length() <= 80) {
                summary = description;
            } else {
                summary = description.substring(0, 77) + "...";
            }
        }
        return summary;
    }

    public String translateToEnglish(String text) {
        String prompt = "Translate the following text to English if it is written in Tamil, Hindi, Telugu, Malayalam, or any other non-English language. " +
                "If the text is already entirely in English, return it exactly as it is without any changes. " +
                "Return ONLY the plain translated text. Do not add labels, greetings, comments, or notes. Text: " + text;
        
        String translation = callGemini(prompt, false);
        
        if (translation == null || translation.trim().isEmpty() || translation.equals(text)) {
            // Local fallback using MyMemory Translation API (Free, no key needed)
            try {
                String sourceLang = "auto";
                String cleanText = text;
                if (text.startsWith("[Language: ")) {
                    int closeBracket = text.indexOf(']');
                    if (closeBracket > 0) {
                        String langName = text.substring(11, closeBracket).trim().toLowerCase();
                        cleanText = text.substring(closeBracket + 1).trim();
                        if (langName.contains("tamil")) sourceLang = "ta";
                        else if (langName.contains("hindi")) sourceLang = "hi";
                        else if (langName.contains("telugu")) sourceLang = "te";
                        else if (langName.contains("malayalam")) sourceLang = "ml";
                    }
                }
                
                String myMemoryUrl = "https://api.mymemory.translated.net/get?q=" + 
                        java.net.URLEncoder.encode(cleanText, "UTF-8") + 
                        "&langpair=" + (sourceLang.equals("auto") ? "ta" : sourceLang) + "|en";
                
                RestTemplate tempTemplate = new RestTemplate();
                ResponseEntity<String> res = tempTemplate.getForEntity(myMemoryUrl, String.class);
                if (res.getStatusCode() == HttpStatus.OK && res.getBody() != null) {
                    JsonNode root = objectMapper.readTree(res.getBody());
                    String match = root.path("responseData").path("translatedText").asText();
                    if (match != null && !match.trim().isEmpty()) {
                        return match.trim();
                    }
                }
            } catch (Exception e) {
                log.warn("MyMemory fallback translation failed: {}", e.getMessage());
            }
        }
        return translation != null && !translation.trim().isEmpty() ? translation : text;
    }

    public String detectDuplicates(String newTitle, String newDescription, String candidatesJson) {
        String prompt = "You are a duplicate checker for a Complaint Management System. " +
                "Compare this new complaint:\n" +
                "Title: \"" + newTitle + "\"\n" +
                "Description: \"" + newDescription + "\"\n\n" +
                "Against this list of nearby complaints in the same area:\n" +
                candidatesJson + "\n\n" +
                "Determine if the new complaint describes the exact same physical issue as any of the nearby complaints.\n" +
                "Return a JSON object containing:\n" +
                "{\n" +
                "  \"isDuplicate\": true or false,\n" +
                "  \"matchedComplaintId\": \"ID of the duplicate complaint or null if isDuplicate is false\",\n" +
                "  \"reason\": \"brief explanation of why it is or is not a duplicate\"\n" +
                "}";
        String aiResult = callGemini(prompt, true);
        if (aiResult == null || aiResult.trim().isEmpty() || aiResult.equals("{}")) {
            // Local fallback duplicate check
            try {
                JsonNode candidates = objectMapper.readTree(candidatesJson);
                boolean found = false;
                String matchedId = null;
                String reason = "No similar complaints found nearby.";
                
                for (JsonNode cand : candidates) {
                    String candId = cand.path("id").asText();
                    String candDesc = cand.path("description").asText("");
                    
                    double score = calculateSimilarity(newDescription, candDesc);
                    if (score > 0.35) {
                        found = true;
                        matchedId = candId;
                        reason = "AI Local Fallback: Detected high text similarity match of " + 
                                Math.round(score * 100) + "% with Ticket ID " + candId;
                        break;
                    }
                }
                
                ObjectNode fallbackJson = objectMapper.createObjectNode();
                fallbackJson.put("isDuplicate", found);
                fallbackJson.put("matchedComplaintId", matchedId);
                fallbackJson.put("reason", reason);
                return objectMapper.writeValueAsString(fallbackJson);
            } catch (Exception e) {
                log.warn("Local duplicate scan failed: {}", e.getMessage());
            }
        }
        return aiResult;
    }

    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        String[] w1 = s1.toLowerCase().split("\\W+");
        String[] w2 = s2.toLowerCase().split("\\W+");
        java.util.Set<String> set1 = new java.util.HashSet<>(List.of(w1));
        java.util.Set<String> set2 = new java.util.HashSet<>(List.of(w2));
        int intersectionSize = 0;
        for (String w : set1) {
            if (set2.contains(w)) {
                intersectionSize++;
            }
        }
        int unionSize = set1.size() + set2.size() - intersectionSize;
        return unionSize == 0 ? 0.0 : (double) intersectionSize / unionSize;
    }

    public String chatCMS(String message, String historyJson) {
        String prompt = "You are an AI assistant built strictly to help citizens interact with this Complaint Management System (CMS)...";
        String reply = callGemini(prompt, false);
        if (reply == null || reply.trim().isEmpty()) {
            // Local fallback rule-based chat
            String msg = message.toLowerCase();
            if (msg.contains("file") || msg.contains("register") || msg.contains("submit")) {
                return "To file a new complaint, please navigate to the 'File Complaint' tab on your left sidebar, choose the department, pinpoint your location on the map, upload any support files, and submit.";
            } else if (msg.contains("track") || msg.contains("status")) {
                return "To track your complaint status, go to the 'Track Complaint' option on the menu, select your ticket from the list or search using your Ticket ID.";
            } else if (msg.contains("reopen")) {
                return "You can reopen a complaint if the resolution is unsatisfactory. Go to the complaint details page and click the 'Reopen Complaint' button.";
            } else if (msg.contains("water") || msg.contains("sewer") || msg.contains("pipe")) {
                return "Water Supply & Sewage Department handles pipeline leaks, water contamination, sewage blockages, and tap water issues.";
            } else if (msg.contains("garbage") || msg.contains("trash") || msg.contains("waste") || msg.contains("sanitation")) {
                return "Sanitation & Waste Management Department handles garbage cleaning, littering, and sweeping issues.";
            } else if (msg.contains("electricity") || msg.contains("light") || msg.contains("power")) {
                return "Electricity & Public Lighting Department handles streetlight failures and wire hazards.";
            } else {
                return "I am the Complaint Management System AI Assistant. I can assist you with filing complaints, tracking tickets, reopening cases, and department routing queries.";
            }
        }
        return reply;
    }

    public String semanticSearch(String query, String candidatesJson) {
        String prompt = "Filter and return the IDs of complaints that are semantically relevant to the search query: \"" + query + "\".\n" +
                "The candidates are:\n" +
                candidatesJson + "\n\n" +
                "Return a JSON object containing an array of matched complaint IDs sorted by relevance:\n" +
                "{\n" +
                "  \"matchedIds\": [\"ID-1\", \"ID-2\"]\n" +
                "}";
        String aiResult = callGemini(prompt, true);
        if (aiResult == null || aiResult.trim().isEmpty() || aiResult.equals("{}")) {
            // Local fallback keyword ranker
            try {
                JsonNode candidates = objectMapper.readTree(candidatesJson);
                List<String> matchedIds = new ArrayList<>();
                String qLower = query.toLowerCase();
                
                for (JsonNode cand : candidates) {
                    String candId = cand.path("id").asText();
                    String candTitle = cand.path("title").asText("").toLowerCase();
                    String candSummary = cand.path("summary").asText("").toLowerCase();
                    
                    boolean match = candTitle.contains(qLower) || candSummary.contains(qLower);
                    if (!match) {
                        for (String word : qLower.split("\\s+")) {
                            if (word.length() > 3 && (candTitle.contains(word) || candSummary.contains(word))) {
                                match = true;
                                break;
                            }
                        }
                    }
                    if (match) {
                        matchedIds.add(candId);
                    }
                }
                
                ObjectNode fallbackJson = objectMapper.createObjectNode();
                com.fasterxml.jackson.databind.node.ArrayNode arrayNode = fallbackJson.putArray("matchedIds");
                for (String matchedId : matchedIds) {
                    arrayNode.add(matchedId);
                }
                return objectMapper.writeValueAsString(fallbackJson);
            } catch (Exception e) {
                log.warn("Keyword search fallback failed: {}", e.getMessage());
            }
        }
        return aiResult;
    }

    public String predictResolution(String department, String category, String priority, double historicalAverageHours) {
        String prompt = "Predict the estimated resolution time for a new citizen complaint...\n" +
                "Department: \"" + department + "\"\n" +
                "Category: \"" + category + "\"\n" +
                "Priority: \"" + priority + "\"\n" +
                "Historical average resolution time: " + historicalAverageHours;
        String aiResponse = callGemini(prompt, true);
        if (aiResponse == null || aiResponse.trim().isEmpty() || aiResponse.equals("{}")) {
            try {
                int estHours = (int) Math.round(historicalAverageHours);
                if (priority.equalsIgnoreCase("high")) {
                    estHours = Math.min(estHours, 24);
                } else if (priority.equalsIgnoreCase("medium")) {
                    estHours = Math.min(estHours, 72);
                }
                int estDays = (int) Math.ceil((double) estHours / 24.0);
                double confidence = 0.85;
                
                ObjectNode fallbackJson = objectMapper.createObjectNode();
                fallbackJson.put("estimatedHours", estHours);
                fallbackJson.put("estimatedDays", estDays);
                fallbackJson.put("confidenceScore", confidence);
                return objectMapper.writeValueAsString(fallbackJson);
            } catch (Exception e) {
                log.warn("Resolution prediction fallback failed: {}", e.getMessage());
            }
        }
        return aiResponse;
    }
}
