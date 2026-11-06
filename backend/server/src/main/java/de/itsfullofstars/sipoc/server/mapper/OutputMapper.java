// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.OutputDtos;
import de.itsfullofstars.sipoc.server.dto.GoDtos;
import de.itsfullofstars.sipoc.server.model.Output;

/** Converts between {@link de.itsfullofstars.sipoc.server.model.Output} and its DTOs. */
public class OutputMapper {

    public static OutputDtos.OutputListItemDto toListItem(Output output) {
        OutputDtos.OutputListItemDto dto = new OutputDtos.OutputListItemDto();
        dto.id = output.getId();
        dto.name = output.getName();
        dto.updatedAt = output.getUpdatedAt();
        return dto;
    }

    public static OutputDtos.OutputDto toDetail(Output output) {
        OutputDtos.OutputDto dto = new OutputDtos.OutputDto();
        dto.id = output.getId();
        dto.name = output.getName();
        dto.description = output.getDescription();
        dto.type = output.getType() != null ? output.getType().toString() : null;
        dto.linkUrl = output.getLinkUrl();
        dto.audit = new GoDtos.AuditDto();
        dto.audit.createdAt = output.getCreatedAt();
        dto.audit.createdBy = output.getCreatedBy();
        dto.audit.updatedAt = output.getUpdatedAt();
        dto.audit.updatedBy = output.getUpdatedBy();
        return dto;
    }

    public static Output toEntity(OutputDtos.OutputCreateDto dto) {
        Output entity = new Output();
        entity.setName(dto.name);
        entity.setDescription(dto.description);
        if (dto.type != null) {
            entity.setType(de.itsfullofstars.sipoc.server.model.DocumentableType.valueOf(dto.type));
        }
        entity.setLinkUrl(dto.linkUrl);
        return entity;
    }
}

