package de.itsfullofstars.sipoc.server.dto;

import java.time.Instant;

/** Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.ProcessStep}. */
public class ProcessStepDtos {

    public static class ProcessStepListItemDto {
        public String id;
        public String name;
        public Instant updatedAt;
    }

    public static class ProcessStepDto {
        public String id;
        public String name;
        public String description;
        public GoDtos.AuditDto audit;
    }

    public static class ProcessStepCreateDto {
        public String name;
        public String description;
    }

    public static class ProcessStepUpdateDto {
        public String name;
        public String description;
    }

    public static class PageProcessStepListItemDto extends GoDtos.PageMetaDto {
        public java.util.List<ProcessStepListItemDto> content;
    }
}

