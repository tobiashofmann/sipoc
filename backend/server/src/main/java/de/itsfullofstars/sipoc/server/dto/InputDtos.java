// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.dto;

import java.time.Instant;

/** Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.Input}. */
public class InputDtos {

    public static class InputListItemDto {
        public String id;
        public String name;
        public Instant updatedAt;
    }

    public static class LinkedPartnerDto {
        public String id;
        public String name;
    }

    public static class InputDto {
        public String id;
        public String name;
        public String description;
        public String type;
        public String linkUrl;
        public java.util.List<LinkedPartnerDto> partners;
        public GoDtos.AuditDto audit;
    }

    public static class InputCreateDto {
        public String name;
        public String description;
        public String type;
        public String linkUrl;
    }

    public static class InputUpdateDto {
        public String name;
        public String description;
        public String type;
        public String linkUrl;
    }

    public static class PageInputListItemDto extends GoDtos.PageMetaDto {
        public java.util.List<InputListItemDto> content;
    }
}
