package com.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private String callGemini(String prompt, boolean jsonMode) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key is not configured. Returning empty response.");
            return jsonMode ? "{}" : "";
        }

        try {
            String url = GEMINI_API_URL + apiKey;

            // Request body construction
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
            log.error("Error invoking Gemini API", e);
        }
        return jsonMode ? "{}" : "";
    }

    public String generateSummary(String description) {
        String prompt = "Summarize the following citizen complaint description in one short, clear sentence (maximum 12 words). " +
                "Do not include any prefix, greeting, markdown formatting, quotes, or trailing explanations. " +
                "Be straight to the point. Complaint description: " + description;
        String summary = callGemini(prompt, false);
        return summary.isEmpty() ? "No Summary" : summary;
    }

    public String translateToEnglish(String text) {
        String prompt = "Translate the following text to English if it is written in Tamil, Hindi, Telugu, Malayalam, or any other non-English language. " +
                "If the text is already entirely in English, return it exactly as it is without any changes. " +
                "Return ONLY the plain translated text. Do not add labels, greetings, comments, or notes. Text: " + text;
        String translation = callGemini(prompt, false);
        return translation.isEmpty() ? text : translation;
    }

    public String detectDuplicates(String newTitle, String newDescription, String candidatesJson) {
        String prompt = "You are a duplicate checker for a Complaint Management System. " +
                "Compare this new complaint:\n" +
                "Title: \"" + newTitle + "\"\n" +
                "Description: \"" + newDescription + "\"\n\n" +
                "Against this list of nearby complaints in the same area:\n" +
                candidatesJson + "\n\n" +
                "Determine if the new complaint describes the exact same physical issue (e.g. the same road pothole, the same leaking pipe, the same broken streetlight, same garbage pile) as any of the nearby complaints.\n" +
                "Return a JSON object containing:\n" +
                "{\n" +
                "  \"isDuplicate\": true or false,\n" +
                "  \"matchedComplaintId\": \"ID of the duplicate complaint or null if isDuplicate is false\",\n" +
                "  \"reason\": \"brief explanation of why it is or is not a duplicate\"\n" +
                "}";
        return callGemini(prompt, true);
    }

    public String chatCMS(String message, String historyJson) {
        String prompt = "You are an AI assistant built strictly to help citizens interact with this Complaint Management System (CMS). " +
                "You can answer questions about how to register, how to file complaints, tracking status, reopening a ticket, which department handles which issues (e.g. Water, Electricity, Police, Sanitation, Roads), and average resolution times.\n" +
                "CRITICAL: If the user asks about ANYTHING unrelated to the CMS (e.g. coding help, capital cities, general knowledge, jokes, writing stories, math), you MUST politely decline and say you can only help with CMS-related issues.\n" +
                "Chat history context:\n" +
                historyJson + "\n\n" +
                "Citizen's current message: \"" + message + "\"\n" +
                "Answer: ";
        return callGemini(prompt, false);
    }

    public String semanticSearch(String query, String candidatesJson) {
        String prompt = "Filter and return the IDs of complaints that are semantically relevant to the search query: \"" + query + "\".\n" +
                "The candidates are:\n" +
                candidatesJson + "\n\n" +
                "Return a JSON object containing an array of matched complaint IDs sorted by relevance:\n" +
                "{\n" +
                "  \"matchedIds\": [\"ID-1\", \"ID-2\"]\n" +
                "}";
        return callGemini(prompt, true);
    }

    public String predictResolution(String department, String category, String priority, double historicalAverageHours) {
        String prompt = "Predict the estimated resolution time for a new citizen complaint.\n" +
                "Department: \"" + department + "\"\n" +
                "Category: \"" + category + "\"\n" +
                "Priority: \"" + priority + "\"\n" +
                "Historical average resolution time for this category/department: " + historicalAverageHours + " hours.\n\n" +
                "Rule: high priority complaints should ideally be solved within 24 hours, medium in 2-3 days, low in 5-7 business days.\n" +
                "Return a JSON object containing:\n" +
                "{\n" +
                "  \"estimatedHours\": number,\n" +
                "  \"estimatedDays\": number,\n" +
                "  \"confidenceScore\": float (between 0.0 and 1.0 based on how close historical data aligns with the priority)\n" +
                "}";
        return callGemini(prompt, true);
    }
}
