package de.itsfullofstars.sipoc.server.dto;

import java.time.Instant;

/** Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.Output}. */
public class OutputDtos {

    public static class OutputListItemDto {
        public String id;
        public String name;
        public Instant updatedAt;
    }

    public static class OutputDto {
        public String id;
        public String name;
        public String description;
        public String type;
        public String linkUrl;
        public GoDtos.AuditDto audit;
    }

    public static class OutputCreateDto {
        public String name;
        public String description;
        public String type;
        public String linkUrl;
    }

    public static class OutputUpdateDto {
        public String name;
        public String description;
        public String type;
        public String linkUrl;
    }

    public static class PageOutputListItemDto extends GoDtos.PageMetaDto {
        public java.util.List<OutputListItemDto> content;
    }
}

