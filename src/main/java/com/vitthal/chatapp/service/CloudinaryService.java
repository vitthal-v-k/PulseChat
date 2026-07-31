package com.vitthal.chatapp.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface CloudinaryService {

    Map uploadFile(MultipartFile file, String folder);

    Map uploadImage(MultipartFile file, String folder);

    Map uploadVideo(MultipartFile file, String folder);

    Map deleteFile(String publicId);
}
