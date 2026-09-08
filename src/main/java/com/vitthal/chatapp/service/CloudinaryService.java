package com.vitthal.chatapp.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CloudinaryService {

    Map uploadFile(MultipartFile file, String folder);

    Map uploadImage(MultipartFile file, String folder);

    Map uploadVideo(MultipartFile file, String folder);

    Map deleteFile(String publicId);

    /**
     * Generates a time-limited signed URL for an authenticated Cloudinary asset.
     * @param publicId  the Cloudinary public_id of the asset
     * @param expiresInSeconds  how long (in seconds) the URL should remain valid
     * @return a signed HTTPS URL
     */
    String getSignedUrl(String publicId, long expiresInSeconds);
}
