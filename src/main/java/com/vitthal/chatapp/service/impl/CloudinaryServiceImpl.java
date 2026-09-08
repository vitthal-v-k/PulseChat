package com.vitthal.chatapp.service.impl;

import com.cloudinary.AuthToken;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    /** Maximum allowed file size: 10 MB */
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

    /**
     * Base URL used only when Cloudinary is unavailable and the file falls back
     * to local storage. Set this to your server's public hostname in production.
     * Example: https://api.yourdomain.com
     */
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // -------------------------------------------------------------------------
    // Upload helpers
    // -------------------------------------------------------------------------

    @Override
    public Map uploadFile(MultipartFile file, String folder) {
        validateFileSize(file);

        String mime = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String lowerName = originalName.toLowerCase();

        String resourceType = "raw";
        if (mime.startsWith("image/") || lowerName.matches(".*\\.(jpg|jpeg|png|gif|webp|bmp|svg)$")) {
            resourceType = "image";
        } else if (mime.startsWith("video/") || lowerName.matches(".*\\.(mp4|mkv|avi|mov|webm)$")) {
            resourceType = "video";
        }

        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "chatapp/" + folder,
                    "resource_type", resourceType,
                    "type", "authenticated",   // 🔒 Private — not publicly accessible
                    "use_filename", true,
                    "unique_filename", true
            ));
        } catch (Exception e) {
            log.warn("Cloudinary upload ({}) failed for file: {}. Falling back to local storage.",
                    resourceType, file.getOriginalFilename());
            return saveFileLocally(file, folder);
        }
    }

    @Override
    public Map uploadImage(MultipartFile file, String folder) {
        validateFileSize(file);
        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "chatapp/images/" + folder,
                    "resource_type", "image",
                    "type", "authenticated"    // 🔒 Private
            ));
        } catch (Exception e) {
            log.warn("Cloudinary image upload failed. Falling back to local storage.");
            return saveFileLocally(file, "images/" + folder);
        }
    }

    @Override
    public Map uploadVideo(MultipartFile file, String folder) {
        validateFileSize(file);
        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "chatapp/videos/" + folder,
                    "resource_type", "video",
                    "type", "authenticated"    // 🔒 Private
            ));
        } catch (Exception e) {
            log.warn("Cloudinary video upload failed. Falling back to local storage.");
            return saveFileLocally(file, "videos/" + folder);
        }
    }

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------

    @Override
    public Map deleteFile(String publicId) {
        try {
            // Must pass type="authenticated" to delete private assets
            return cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("type", "authenticated"));
        } catch (Exception e) {
            log.warn("Failed to delete file from Cloudinary: {}", publicId);
            return Map.of("result", "ok");
        }
    }

    // -------------------------------------------------------------------------
    // Signed URL (time-limited access for authenticated assets)
    // -------------------------------------------------------------------------

    /**
     * Returns a signed, expiring URL so only your authenticated API users
     * can access private Cloudinary assets. URLs expire after {@code expiresInSeconds}.
     * Uses AuthToken — compatible with Cloudinary SDK 1.39.0.
     */
    @Override
    public String getSignedUrl(String publicId, long expiresInSeconds) {
        long expiresAt = (System.currentTimeMillis() / 1000) + expiresInSeconds;
        AuthToken token = new AuthToken()
                .expiration(expiresAt);
        return cloudinary.url()
                .signed(true)
                .type("authenticated")
                .authToken(token)
                .generate(publicId);
    }

    // -------------------------------------------------------------------------
    // Local fallback (Cloudinary unavailable)
    // -------------------------------------------------------------------------

    private Map saveFileLocally(MultipartFile file, String folder) {
        try {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String fileExtension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalName.substring(dotIndex);
            }

            String uniqueName = UUID.randomUUID() + fileExtension;
            Path uploadDir = Paths.get("uploads", folder);
            Files.createDirectories(uploadDir);

            Path targetPath = uploadDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Use configurable baseUrl — works both locally and in production
            String fileUrl = baseUrl + "/uploads/" + folder + "/" + uniqueName;

            return Map.of(
                    "secure_url", fileUrl,
                    "url", fileUrl,
                    "public_id", "local_" + uniqueName
            );
        } catch (IOException ioException) {
            log.error("Failed to save file locally", ioException);
            throw new BadRequestException("Failed to save attachment file locally: " + ioException.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * Rejects files larger than MAX_FILE_SIZE_BYTES (10 MB) before they are
     * sent to Cloudinary, protecting your quota and preventing abuse.
     */
    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                    "File '" + file.getOriginalFilename() + "' exceeds the 10 MB size limit.");
        }
    }
}
