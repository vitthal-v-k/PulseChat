package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.request.CreateStatusRequest;
import com.vitthal.chatapp.dto.response.StatusResponse;
import com.vitthal.chatapp.dto.response.StatusViewResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StatusService {

    StatusResponse createStatus(User currentUser, CreateStatusRequest request, List<MultipartFile> mediaFiles);

    List<StatusResponse> getContactStatuses(User currentUser);

    List<StatusResponse> getMyStatuses(User currentUser);

    StatusViewResponse viewStatus(User currentUser, Long statusId, String replyText);

    StatusResponse reactToStatus(User currentUser, Long statusId, String emoji);

    void deleteStatus(User currentUser, Long statusId);

    void autoDeleteExpiredStatuses();
}
