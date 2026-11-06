// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.BusinessPartnerDtos;
import de.itsfullofstars.sipoc.server.dto.GoDtos;
import de.itsfullofstars.sipoc.server.model.BusinessPartner;
import java.util.stream.Collectors;

/** Converts between {@link de.itsfullofstars.sipoc.server.model.BusinessPartner} and its DTOs. */
public class BusinessPartnerMapper {

    public static BusinessPartnerDtos.BusinessPartnerListItemDto toListItem(BusinessPartner partner) {
        BusinessPartnerDtos.BusinessPartnerListItemDto dto = new BusinessPartnerDtos.BusinessPartnerListItemDto();
        dto.id = partner.getId();
        dto.name = partner.getName();
        dto.updatedAt = partner.getUpdatedAt();
        return dto;
    }

    public static BusinessPartnerDtos.BusinessPartnerDto toDetail(BusinessPartner partner) {
        BusinessPartnerDtos.BusinessPartnerDto dto = new BusinessPartnerDtos.BusinessPartnerDto();
        dto.id = partner.getId();
        dto.name = partner.getName();
        dto.description = partner.getDescription();
        dto.inputs = partner.getInputs().stream().map(bpi -> {
            BusinessPartnerDtos.LinkedInputDto i = new BusinessPartnerDtos.LinkedInputDto();
            i.id = bpi.getInput().getId();
            i.name = bpi.getInput().getName();
            return i;
        }).collect(Collectors.toList());
        dto.audit = new GoDtos.AuditDto();
        dto.audit.createdAt = partner.getCreatedAt();
        dto.audit.createdBy = partner.getCreatedBy();
        dto.audit.updatedAt = partner.getUpdatedAt();
        dto.audit.updatedBy = partner.getUpdatedBy();
        return dto;
    }

    public static BusinessPartner toEntity(BusinessPartnerDtos.BusinessPartnerCreateDto dto) {
        BusinessPartner entity = new BusinessPartner();
        entity.setName(dto.name);
        entity.setDescription(dto.description);
        return entity;
    }
}

