package de.itsfullofstars.sipoc.server.dto;

import de.itsfullofstars.sipoc.server.model.BoType;
import de.itsfullofstars.sipoc.server.model.Criticality;
import de.itsfullofstars.sipoc.server.model.Importance;

import java.time.Instant;
import java.util.List;

/**
 * Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.Go}. On {@code GoUpdateDto} a
 * {@code null} field means "leave unchanged" â€” except {@code customProperties}, where a non-null
 * list fully replaces the existing set (see {@link de.itsfullofstars.sipoc.server.service.GoService#updatePatch}).
 */
public class GoDtos {

    public static class CustomPropertyDto {
        public String key;
        public String value;
    }

    public static class GoListItemDto {
        public String id;
        public String name;
        public String category;
        public String parentId;
        public Instant updatedAt;
    }

    public static class GoDetailDto {
        public String id;
        public String name;
        public String description;
        public String category;
        public String parentId;
        public BoType type;
        public Importance importance;
        public Criticality criticality;
        public List<CustomPropertyDto> customProperties;
        public List<LipokUsageDto> lipokUsages;
        public AuditDto audit;
    }

    public static class LipokUsageDto {
        public String lipokId;
        public String lipokName;
    }

    public static class GoCreateDto {
        public String name;
        public String description;
        public String category;
        public String parentId;
        public BoType type;
        public Importance importance;
        public Criticality criticality;
        public List<CustomPropertyDto> customProperties;
    }

    public static class GoUpdateDto {
        public String name;
        public String description;
        public String category;
        public String parentId;
        public BoType type;
        public Importance importance;
        public Criticality criticality;
        public List<CustomPropertyDto> customProperties;
    }

    public static class GoTreeNodeDto {
        public String id;
        public String name;
        public String description;
        public String category;
        public List<GoTreeNodeDto> children;
    }

    public static class AuditDto {
        public Instant createdAt;
        public String createdBy;
        public Instant updatedAt;
        public String updatedBy;
    }

    public static class PageMetaDto {
        public long totalElements;
        public int totalPages;
        public int size;
        public int number;
        public int numberOfElements;
        public boolean first;
        public boolean last;
        public boolean empty;
    }

    public static class PageGoListItemDto extends PageMetaDto {
        public List<GoListItemDto> content;
    }
}

