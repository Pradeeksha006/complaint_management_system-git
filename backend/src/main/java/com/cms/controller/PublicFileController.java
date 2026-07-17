package com.cms.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import com.cms.security.SecurityUtils;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/public/files")
public class PublicFileController {

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            // Ensure the user is authenticated before allowing access
            if (!SecurityUtils.isAuthenticated()) {
                return ResponseEntity.status(403).build();
            }

            // Local file retrieval (e.g., uploads folder)
            Path file = Paths.get("uploads").resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determine content type (basic handling)
                String contentType = "application/octet-stream";
                if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (filename.toLowerCase().endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (filename.toLowerCase().endsWith(".webp")) {
                    contentType = "image/webp";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
