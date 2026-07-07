package com.cms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${app.cloudinary.cloud-name:placeholder}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:placeholder}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:placeholder}")
    private String apiSecret;

    public Map<String, String> uploadFile(MultipartFile file, String folder) throws IOException {
        String resourceType = "auto"; // Auto detect type (image, video, raw)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf")) {
            resourceType = "raw"; // PDFs are raw files in Cloudinary
        }

        // Check if Cloudinary credentials are set to default placeholders
        if (isCloudinaryMocked()) {
            log.info("Cloudinary is unconfigured. Uploading file locally to fallback storage.");
            return saveFileLocally(file);
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", resourceType
            ));

            Map<String, String> result = new HashMap<>();
            result.put("url", (String) uploadResult.get("secure_url"));
            result.put("public_id", (String) uploadResult.get("public_id"));
            return result;
        } catch (Exception e) {
            log.error("Cloudinary upload failed, falling back to local file storage: {}", e.getMessage());
            return saveFileLocally(file);
        }
    }

    private boolean isCloudinaryMocked() {
        return "placeholder".equalsIgnoreCase(cloudName) 
            || "placeholder".equalsIgnoreCase(apiKey) 
            || "placeholder".equalsIgnoreCase(apiSecret)
            || cloudName == null 
            || cloudName.isBlank();
    }

    private Map<String, String> saveFileLocally(MultipartFile file) throws IOException {
        File uploadDir = new File("uploads");
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        String extension = "";
        String origName = file.getOriginalFilename();
        if (origName != null && origName.contains(".")) {
            extension = origName.substring(origName.lastIndexOf("."));
        } else {
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.contains("png")) extension = ".png";
                else if (contentType.contains("gif")) extension = ".gif";
                else if (contentType.contains("pdf")) extension = ".pdf";
                else extension = ".jpg";
            }
        }

        String fileName = UUID.randomUUID().toString() + extension;
        File dest = new File(uploadDir, fileName);
        Files.copy(file.getInputStream(), dest.toPath(), StandardCopyOption.REPLACE_EXISTING);

        Map<String, String> result = new HashMap<>();
        // Return fully qualified local API address to render in user dashboard directly
        result.put("url", "http://localhost:8080/api/public/files/" + fileName);
        result.put("public_id", fileName);
        return result;
    }

    public void deleteFile(String publicId, String fileType) {
        if (isCloudinaryMocked()) {
            log.info("Cloudinary is mocked. Deleting local fallback file: {}", publicId);
            File localFile = new File("uploads", publicId);
            if (localFile.exists()) {
                localFile.delete();
            }
            return;
        }

        try {
            String resourceType = "image";
            if ("PDF".equalsIgnoreCase(fileType)) {
                resourceType = "raw";
            } else if ("VIDEO".equalsIgnoreCase(fileType)) {
                resourceType = "video";
            }
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
            log.info("Successfully deleted asset from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete asset from Cloudinary: {}", publicId, e);
        }
    }
}
