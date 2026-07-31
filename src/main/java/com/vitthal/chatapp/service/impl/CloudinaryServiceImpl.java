package com.vitthal.chatapp.service.impl;

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

    @Value("${server.port:8080}")
    private String serverPort;

    @Override
    public Map uploadFile(MultipartFile file, String folder) {
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
                    "use_filename", true,
                    "unique_filename", true
            ));
        } catch (Exception e) {
            log.warn("Cloudinary upload ({}) failed for file: {}. Falling back to local storage.", resourceType, file.getOriginalFilename());
            return saveFileLocally(file, folder);
        }
    }

    @Override
    public Map uploadImage(MultipartFile file, String folder) {
        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "chatapp/images/" + folder,
                    "resource_type", "image"
            ));
        } catch (Exception e) {
            log.warn("Cloudinary image upload failed. Falling back to local storage.");
            return saveFileLocally(file, "images/" + folder);
        }
    }

    @Override
    public Map uploadVideo(MultipartFile file, String folder) {
        try {
            return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "chatapp/videos/" + folder,
                    "resource_type", "video"
            ));
        } catch (Exception e) {
            log.warn("Cloudinary video upload failed. Falling back to local storage.");
            return saveFileLocally(file, "videos/" + folder);
        }
    }

    @Override
    public Map deleteFile(String publicId) {
        try {
            return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.warn("Failed to delete file from Cloudinary: {}", publicId);
            return Map.of("result", "ok");
        }
    }

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

            String fileUrl = "http://localhost:" + serverPort + "/uploads/" + folder + "/" + uniqueName;

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
}
