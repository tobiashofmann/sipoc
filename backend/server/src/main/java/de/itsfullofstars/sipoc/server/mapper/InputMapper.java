// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.InputDtos;
import de.itsfullofstars.sipoc.server.dto.GoDtos;
import de.itsfullofstars.sipoc.server.model.Input;
import java.util.stream.Collectors;

/** Converts between {@link de.itsfullofstars.sipoc.server.model.Input} and its DTOs. */
public class InputMapper {

    public static InputDtos.InputListItemDto toListItem(Input input) {
        InputDtos.InputListItemDto dto = new InputDtos.InputListItemDto();
        dto.id = input.getId();
        dto.name = input.getName();
        dto.updatedAt = input.getUpdatedAt();
        return dto;
    }

    public static InputDtos.InputDto toDetail(Input input) {
        InputDtos.InputDto dto = new InputDtos.InputDto();
        dto.id = input.getId();
        dto.name = input.getName();
        dto.description = input.getDescription();
        dto.type = input.getType() != null ? input.getType().toString() : null;
        dto.linkUrl = input.getLinkUrl();
        dto.partners = input.getPartners().stream().map(bpi -> {
            InputDtos.LinkedPartnerDto p = new InputDtos.LinkedPartnerDto();
            p.id = bpi.getPartner().getId();
            p.name = bpi.getPartner().getName();
            return p;
        }).collect(Collectors.toList());
        dto.audit = new GoDtos.AuditDto();
        dto.audit.createdAt = input.getCreatedAt();
        dto.audit.createdBy = input.getCreatedBy();
        dto.audit.updatedAt = input.getUpdatedAt();
        dto.audit.updatedBy = input.getUpdatedBy();
        return dto;
    }

    public static Input toEntity(InputDtos.InputCreateDto dto) {
        Input entity = new Input();
        entity.setName(dto.name);
        entity.setDescription(dto.description);
        if (dto.type != null) {
            entity.setType(de.itsfullofstars.sipoc.server.model.DocumentableType.valueOf(dto.type));
        }
        entity.setLinkUrl(dto.linkUrl);
        return entity;
    }
}
