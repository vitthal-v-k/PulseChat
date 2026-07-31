package com.vitthal.chatapp.mapper;

import com.vitthal.chatapp.dto.response.AttachmentResponse;
import com.vitthal.chatapp.entity.Attachment;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AttachmentMapper {

    public AttachmentResponse toResponse(Attachment attachment) {
        if (attachment == null) return null;

        return AttachmentResponse.builder()
                .id(attachment.getId())
                .type(attachment.getType() != null ? attachment.getType().name() : null)
                .url(attachment.getUrl())
                .fileName(attachment.getFileName())
                .fileSize(attachment.getFileSize())
                .mimeType(attachment.getMimeType())
                .duration(attachment.getDuration())
                .thumbnailUrl(attachment.getThumbnailUrl())
                .width(attachment.getWidth())
                .height(attachment.getHeight())
                .build();
    }

    public List<AttachmentResponse> toResponseList(List<Attachment> attachments) {
        if (attachments == null) return Collections.emptyList();
        return attachments.stream().map(this::toResponse).collect(Collectors.toList());
    }
}
