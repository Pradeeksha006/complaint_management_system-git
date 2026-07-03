package com.cms.util;

import com.cms.entity.Priority;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class AiHelper {

    private AiHelper() {}

    /**
     * Rules-based categorization heuristic that returns the recommended department code
     */
    public static String predictDepartment(String title, String description) {
        String content = (title + " " + description).toLowerCase();
        
        if (content.contains("water") || content.contains("leak") || content.contains("pipe") || content.contains("drain") || content.contains("sewer")) {
            return "WT"; // Water Department
        } else if (content.contains("road") || content.contains("pothole") || content.contains("highway") || content.contains("street") || content.contains("bridge")) {
            return "RD"; // Road
        } else if (content.contains("electricity") || content.contains("power") || content.contains("wire") || content.contains("spark") || content.contains("transformer") || content.contains("light")) {
            return "EL"; // Electricity
        } else if (content.contains("garbage") || content.contains("trash") || content.contains("waste") || content.contains("sanitation") || content.contains("clean")) {
            return "SN"; // Sanitation (Sanitation code SN)
        } else if (content.contains("theft") || content.contains("robbery") || content.contains("police") || content.contains("crime") || content.contains("fight") || content.contains("security")) {
            return "PL"; // Police
        } else if (content.contains("bus") || content.contains("metro") || content.contains("traffic") || content.contains("transport") || content.contains("vehicle")) {
            return "TR"; // Transport
        } else if (content.contains("hospital") || content.contains("doctor") || content.contains("health") || content.contains("disease") || content.contains("medicine")) {
            return "HL"; // Health
        } else if (content.contains("school") || content.contains("college") || content.contains("education") || content.contains("teacher") || content.contains("student")) {
            return "ED"; // Education
        } else if (content.contains("tax") || content.contains("revenue") || content.contains("property") || content.contains("land")) {
            return "RV"; // Revenue
        } else if (content.contains("pollution") || content.contains("tree") || content.contains("forest") || content.contains("environment") || content.contains("air")) {
            return "EN"; // Environment
        }
        
        return "IT"; // Default to IT/General support
    }

    /**
     * Priority prediction based on critical safety hazards
     */
    public static Priority predictPriority(String title, String description) {
        String content = (title + " " + description).toLowerCase();

        // Critical safety threats
        if (content.contains("sparking") || content.contains("fire") || content.contains("live wire") || content.contains("accident") || content.contains("gas leak") || content.contains("collapse")) {
            return Priority.CRITICAL;
        }
        // Urgent infrastructure failures
        if (content.contains("blackout") || content.contains("flood") || content.contains("broken pipe") || content.contains("blocked") || content.contains("theft")) {
            return Priority.HIGH;
        }
        // General maintenance
        if (content.contains("cleanliness") || content.contains("garbage") || content.contains("pothole") || content.contains("billing")) {
            return Priority.MEDIUM;
        }

        return Priority.LOW;
    }

    /**
     * Dictionary-based sentiment analyzer
     */
    public static String analyzeSentiment(String text) {
        if (text == null || text.isBlank()) return "NEUTRAL";
        
        String cleanText = text.toLowerCase();
        
        List<String> positiveWords = Arrays.asList("good", "great", "excellent", "happy", "thank", "resolved", "satisfied", "perfect", "fast", "awesome");
        List<String> negativeWords = Arrays.asList("bad", "poor", "slow", "terrible", "angry", "unsatisfied", "worst", "delay", "useless", "broken");

        long positiveCount = positiveWords.stream().filter(cleanText::contains).count();
        long negativeCount = negativeWords.stream().filter(cleanText::contains).count();

        if (positiveCount > negativeCount) {
            return "POSITIVE";
        } else if (negativeCount > positiveCount) {
            return "NEGATIVE";
        }
        return "NEUTRAL";
    }

    /**
     * Levenshtein Distance for similarity analysis
     */
    public static double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        
        String longer = s1.toLowerCase(), shorter = s2.toLowerCase();
        if (s1.length() < s2.length()) {
            longer = s2.toLowerCase();
            shorter = s1.toLowerCase();
        }
        
        int longerLength = longer.length();
        if (longerLength == 0) return 1.0; /* both are empty */

        int editDistance = editDistance(longer, shorter);
        return (longerLength - editDistance) / (double) longerLength;
    }

    private static int editDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        int newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length()] = lastValue;
            }
        }
        return costs[s2.length()];
    }
}
