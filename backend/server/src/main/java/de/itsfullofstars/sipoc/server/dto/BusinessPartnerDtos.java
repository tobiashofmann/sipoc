// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.dto;

import java.time.Instant;

/**
 * Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.BusinessPartner}. As with every
 * {@code *Dtos} grouping class, fields are plain public data holders (see {@code mapper/} for
 * entity conversion); on {@code *UpdateDto} a {@code null} field means "leave unchanged", not
 * "clear this field" (see {@link de.itsfullofstars.sipoc.server.service.BusinessPartnerService#updatePatch}).
 */
public class BusinessPartnerDtos {

    public static class BusinessPartnerListItemDto {
        public String id;
        public String name;
        public Instant updatedAt;
    }

    public static class LinkedInputDto {
        public String id;
        public String name;
    }

    /**
     * One Lipok this partner is attached to, in whichever role(s) apply there. A partner can be
     * the supplier and the customer of the very same Lipok (e.g. a purchasing department is the
     * supplier of a purchase request and the customer of its confirmation) â€” in that case both
     * `inputs` and `outputs` are populated on the same entry.
     */
    public static class LipokUsageDto {
        public String lipokId;
        public String lipokName;
        /** Non-null when this partner is attached as the supplier in this Lipok. */
        public java.util.List<LinkedInputDto> inputs;
        /** Non-null when this partner is attached as the customer in this Lipok. */
        public java.util.List<LinkedInputDto> outputs;
    }

    public static class BusinessPartnerDto {
        public String id;
        public String name;
        public String description;
        public java.util.List<LinkedInputDto> inputs;
        public java.util.List<LipokUsageDto> lipokUsages;
        public GoDtos.AuditDto audit;
    }

    public static class BusinessPartnerCreateDto {
        public String name;
        public String description;
    }

    public static class BusinessPartnerUpdateDto {
        public String name;
        public String description;
    }

    public static class PageBusinessPartnerListItemDto extends GoDtos.PageMetaDto {
        public java.util.List<BusinessPartnerListItemDto> content;
    }
}

