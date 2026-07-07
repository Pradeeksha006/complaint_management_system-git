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
        
        // Water Supply & Sewage (WT)
        if (content.contains("water") || content.contains("leak") || content.contains("pipe") || content.contains("drain") || content.contains("sewer") || content.contains("plumb") || content.contains("tap") ||
            content.contains("குடிநீர்") || content.contains("தண்ணீர்") || content.contains("குழாய்") || content.contains("கசிவு") || content.contains("சாக்கடை") || content.contains("தண்ணி") ||
            content.contains("पानी") || content.contains("जल") || content.contains("पाइप") || content.contains("नाला") || content.contains("लीक") ||
            content.contains("నీరు") || content.contains("నీళ్లు") || content.contains("పైప్") || content.contains("లీకేజీ") ||
            content.contains("വെള്ളം") || content.contains("ചോർച്ച") || content.contains("പൈപ്പ്") ||
            content.contains("ಸೋರಿಕೆ") || content.contains("ನಳ್ಳಿ")) {
            return "WT"; // Water Department
        } 
        // Road & Public Works (RD)
        else if (content.contains("road") || content.contains("pothole") || content.contains("highway") || content.contains("street") || content.contains("bridge") || content.contains("tar") || content.contains("pavement") ||
                   content.contains("சாலை") || content.contains("பள்ளம்") || content.contains("பாதை") || content.contains("தெரு") || content.contains("ரோடு") ||
                   content.contains("सड़क") || content.contains("गड्ढा") || content.contains("रास्ता") || content.contains("मार्ग") ||
                   content.contains("రోడ్డు") || content.contains("గుంత") || content.contains("రహదారి") ||
                   content.contains("റോഡ്") || content.contains("കുഴി") || content.contains("വഴി") ||
                   content.contains("ರಸ್ತೆ") || content.contains("ಗುಂಡಿ") || content.contains("ಮಾರ್ಗ")) {
            return "RD"; // Road
        } 
        // Electricity & Lighting (EL)
        else if (content.contains("electricity") || content.contains("power") || content.contains("wire") || content.contains("spark") || content.contains("transformer") || content.contains("light") || content.contains("voltage") ||
                   content.contains("மின்சாரம்") || content.contains("கரண்ட்") || content.contains("கம்பம்") || content.contains("விளக்கு") || content.contains("பவர்") ||
                   content.contains("बिजली") || content.contains("तार") || content.contains("खंभा") || content.contains("लाइट") || content.contains("ट्रांसफार्मर") ||
                   content.contains("విద్యుత్") || content.contains("కరెంట్") || content.contains("వైరు") || content.contains("స్తంభం") ||
                   content.contains("വൈദ്യുതി") || content.contains("ലൈറ്റ്") || content.contains("കറന്റ്") ||
                   content.contains("ವಿದ್ಯುತ್") || content.contains("ಕಂಬ") || content.contains("ದೀಪ")) {
            return "EL"; // Electricity
        } 
        // Sanitation & Waste (SN)
        else if (content.contains("garbage") || content.contains("trash") || content.contains("waste") || content.contains("sanitation") || content.contains("clean") || content.contains("dump") || content.contains("sweep") ||
                   content.contains("குப்பை") || content.contains("அசுத்தம்") || content.contains("கழிவுகள்") || content.contains("சுத்தம்") ||
                   content.contains("कचरा") || content.contains("कूड़ा") || content.contains("सफाई") || content.contains("गंदगी") ||
                   content.contains("చెత్త") || content.contains("వ్యర్థాలు") || content.contains("శుభ్రం") ||
                   content.contains("മാലിന്യം") || content.contains("ചപ്പുചവറുകൾ") || content.contains("വൃത്തി") ||
                   content.contains("ಕಸ") || content.contains("ಸ್ವಚ್ಛತೆ")) {
            return "SN"; // Sanitation
        } 
        // Police & Law (PL)
        else if (content.contains("theft") || content.contains("robbery") || content.contains("police") || content.contains("crime") || content.contains("fight") || content.contains("security") ||
                   content.contains("drinking") || content.contains("alcohol") || content.contains("drunk") || content.contains("liquor") || content.contains("drugs") ||
                   content.contains("போலீஸ்") || content.contains("திருட்டு") || content.contains("சண்டை") || content.contains("பாதுகாப்பு") || content.contains("மது") || content.contains("சாராயம்") || content.contains("குடி") ||
                   content.contains("पुलिस") || content.contains("चोरी") || content.contains("लड़ाई") || content.contains("शराब") ||
                   content.contains("దొంగతనం") || content.contains("పోలీస్") || content.contains("గొడవ") ||
                   content.contains("കള്ളൻ") || content.contains("പോലീസ്") || content.contains("അടിപിടി") ||
                   content.contains("ಕಳ್ಳತನ") || content.contains("ಜಗಳ")) {
            return "PL"; // Police
        } 
        // Public Health (HL)
        else if (content.contains("stray") || content.contains("dog") || content.contains("health") || content.contains("disease") || content.contains("mosquito") || content.contains("hygiene") ||
                   content.contains("நாய்") || content.contains("கொசு") || content.contains("நோய்") ||
                   content.contains("कुत्ता") || content.contains("मच्छर") || content.contains("बीमारी") ||
                   content.contains("కుక్క") || content.contains("దోమలు") ||
                   content.contains("പട്ടി") || content.contains("കൊതുക്") || content.contains("രോഗം") ||
                   content.contains("ನಾಯಿ") || content.contains("ಸೊಳ್ಳೆ") || content.contains("ಕಾಯಿಲೆ")) {
            return "HL"; // Health
        } 
        // Transport & Traffic (TR)
        else if (content.contains("bus") || content.contains("metro") || content.contains("traffic") || content.contains("transport") || content.contains("vehicle") ||
                 content.contains("பேருந்து") || content.contains("வண்டி") || content.contains("போக்குவரத்து") ||
                 content.contains("बस") || content.contains("यातायात") || content.contains("ગાડી")) {
            return "TR"; // Transport
        }
        
        return "IT"; // Default to IT/General support
    }s("கொசு") || content.contains("நோய்") ||
                   content.contains("कुत्ता") || content.contains("मच्छर") || content.contains("बीमारी")) {
            return "HL"; // Health
        } else if (content.contains("bus") || content.contains("metro") || content.contains("traffic") || content.contains("transport") || content.contains("vehicle")) {
            return "TR"; // Transport
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

    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    public static double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        String clean1 = s1.toLowerCase().replaceAll("[^a-zA-Z0-9\\s\\u0B80-\\u0BFF\\u0900-\\u097F]", "");
        String clean2 = s2.toLowerCase().replaceAll("[^a-zA-Z0-9\\s\\u0B80-\\u0BFF\\u0900-\\u097F]", "");
        
        String[] w1 = clean1.split("\\s+");
        String[] w2 = clean2.split("\\s+");
        
        Set<String> set1 = new HashSet<>();
        for (String w : w1) {
            if (w.length() > 2) set1.add(w);
        }
        
        Set<String> set2 = new HashSet<>();
        for (String w : w2) {
            if (w.length() > 2) set2.add(w);
        }
        
        if (set1.isEmpty() && set2.isEmpty()) return 1.0;
        if (set1.isEmpty() || set2.isEmpty()) return 0.0;
        
        int intersection = 0;
        for (String w : set1) {
            if (set2.contains(w)) {
                intersection++;
            }
        }
        
        int union = set1.size() + set2.size() - intersection;
        return (double) intersection / (double) union;
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
