// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.dto;

import java.time.Instant;
import java.util.List;

/**
 * Request/response DTOs for {@link de.itsfullofstars.sipoc.server.model.Lipok}. {@code Ordered*Dto}
 * classes are the flattened SIPOC join rows (see SCHEMA.md); the {@code lipokInputId}/
 * {@code lipokOutputId}/{@code lipokProcessStepId} fields are the join row's own id, needed to
 * address the {@code .../link} and {@code .../customers} endpoints â€” not the referenced master
 * data's id.
 */
public class LipokDtos {

    public static class LipokListItemDto {
        public String id;
        public String name;
        public String description;
        public Instant createdAt;
        public Instant updatedAt;
    }

    public static class LinkedGoDto {
        public String id;
        public String name;
        public String description;
    }

    public static class OrderedSupplierDto {
        public String id;
        public String name;
        public Integer position;
    }

    public static class OrderedInputDto {
        public Long lipokInputId;
        public String id;
        public String name;
        public Integer position;
        public String supplierId;
        public String processStepId;
    }

    public static class OrderedProcessStepDto {
        public Long lipokProcessStepId;
        public String id;
        public String name;
        public Integer position;
        public Long predecessorId;
    }

    public static class OrderedOutputDto {
        public Long lipokOutputId;
        public String id;
        public String name;
        public Integer position;
        public String processStepId;
        public List<String> customerIds;
    }

    public static class OrderedCustomerDto {
        public String id;
        public String name;
        public Integer position;
    }

    public static class ReorderDto {
        public List<String> orderedIds;
    }

    public static class LipokInputLinkDto {
        public String supplierId;
        public String processStepId;
    }

    public static class LipokOutputLinkDto {
        public String processStepId;
    }

    public static class LipokProcessStepLinkDto {
        public Long predecessorId;
    }

    public static class LipokCommentDto {
        public Long id;
        public Integer number;
        public String content;
        public Instant createdAt;
    }

    public static class LipokCommentCreateDto {
        public String content;
    }

    public static class LipokCommentUpdateDto {
        public String content;
    }

    public static class LipokDto {
        public String id;
        public String name;
        public String description;
        public List<LinkedGoDto> gos;
        public List<OrderedSupplierDto> suppliers;
        public List<OrderedInputDto> inputs;
        public List<OrderedProcessStepDto> processSteps;
        public List<OrderedOutputDto> outputs;
        public List<OrderedCustomerDto> customers;
        public List<LipokCommentDto> comments;
        public GoDtos.AuditDto audit;
    }

    public static class LipokCreateDto {
        public String name;
        public String description;
    }

    public static class LipokUpdateDto {
        public String name;
        public String description;
    }

    public static class PageLipokListItemDto extends GoDtos.PageMetaDto {
        public List<LipokListItemDto> content;
    }
}

