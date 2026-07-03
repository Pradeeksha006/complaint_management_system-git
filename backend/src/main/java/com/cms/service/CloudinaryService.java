package com.cms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, String> uploadFile(MultipartFile file, String folder) throws IOException {
        String resourceType = "auto"; // Auto detect type (image, video, raw)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf")) {
            resourceType = "raw"; // PDFs are raw files in Cloudinary
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", folder,
                "resource_type", resourceType
        ));

        Map<String, String> result = new HashMap<>();
        result.put("url", (String) uploadResult.get("secure_url"));
        result.put("public_id", (String) uploadResult.get("public_id"));
        return result;
    }

    public void deleteFile(String publicId, String fileType) {
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
