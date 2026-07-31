package com.vitthal.chatapp.mapper;

import com.vitthal.chatapp.dto.response.*;
import com.vitthal.chatapp.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StatusMapper {

    private final UserMapper userMapper;

    public StatusResponse toResponse(Status status, User currentUser) {
        if (status == null) return null;

        boolean isViewed = false;
        if (currentUser != null && status.getViews() != null) {
            isViewed = status.getViews().stream()
                    .anyMatch(v -> v.getViewer().getId().equals(currentUser.getId()));
        }

        List<StatusMediaResponse> mediaResponses = status.getMediaItems() != null ?
                status.getMediaItems().stream().map(this::toMediaResponse).collect(Collectors.toList())
                : Collections.emptyList();

        List<StatusViewResponse> viewResponses = status.getViews() != null ?
                status.getViews().stream().map(this::toViewResponse).collect(Collectors.toList())
                : Collections.emptyList();

        List<StatusReactionResponse> reactionResponses = status.getReactions() != null ?
                status.getReactions().stream().map(this::toReactionResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return StatusResponse.builder()
                .id(status.getId())
                .user(userMapper.toResponse(status.getUser()))
                .type(status.getType() != null ? status.getType().name() : null)
                .content(status.getContent())
                .backgroundColor(status.getBackgroundColor())
                .textColor(status.getTextColor())
                .privacyType(status.getPrivacyType() != null ? status.getPrivacyType().name() : null)
                .viewCount(status.getViewCount())
                .isViewed(isViewed)
                .mediaItems(mediaResponses)
                .viewers(viewResponses)
                .reactions(reactionResponses)
                .createdAt(status.getCreatedAt())
                .expiresAt(status.getExpiresAt())
                .build();
    }

    public StatusMediaResponse toMediaResponse(StatusMedia media) {
        if (media == null) return null;

        return StatusMediaResponse.builder()
                .id(media.getId())
                .mediaUrl(media.getMediaUrl())
                .mediaType(media.getMediaType())
                .duration(media.getDuration())
                .thumbnailUrl(media.getThumbnailUrl())
                .displayOrder(media.getDisplayOrder())
                .build();
    }

    public StatusViewResponse toViewResponse(StatusView view) {
        if (view == null) return null;

        return StatusViewResponse.builder()
                .id(view.getId())
                .viewer(userMapper.toResponse(view.getViewer()))
                .viewedAt(view.getViewedAt())
                .replyText(view.getReplyText())
                .build();
    }

    public StatusReactionResponse toReactionResponse(StatusReaction reaction) {
        if (reaction == null) return null;

        return StatusReactionResponse.builder()
                .id(reaction.getId())
                .reactor(userMapper.toResponse(reaction.getReactor()))
                .emoji(reaction.getEmoji())
                .reactedAt(reaction.getReactedAt())
                .build();
    }
}
