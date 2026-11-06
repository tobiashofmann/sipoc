// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.ProcessStepDtos;
import de.itsfullofstars.sipoc.server.dto.GoDtos;
import de.itsfullofstars.sipoc.server.model.ProcessStep;

/** Converts between {@link de.itsfullofstars.sipoc.server.model.ProcessStep} and its DTOs. */
public class ProcessStepMapper {

    public static ProcessStepDtos.ProcessStepListItemDto toListItem(ProcessStep processStep) {
        ProcessStepDtos.ProcessStepListItemDto dto = new ProcessStepDtos.ProcessStepListItemDto();
        dto.id = processStep.getId();
        dto.name = processStep.getName();
        dto.updatedAt = processStep.getUpdatedAt();
        return dto;
    }

    public static ProcessStepDtos.ProcessStepDto toDetail(ProcessStep processStep) {
        ProcessStepDtos.ProcessStepDto dto = new ProcessStepDtos.ProcessStepDto();
        dto.id = processStep.getId();
        dto.name = processStep.getName();
        dto.description = processStep.getDescription();
        dto.audit = new GoDtos.AuditDto();
        dto.audit.createdAt = processStep.getCreatedAt();
        dto.audit.createdBy = processStep.getCreatedBy();
        dto.audit.updatedAt = processStep.getUpdatedAt();
        dto.audit.updatedBy = processStep.getUpdatedBy();
        return dto;
    }

    public static ProcessStep toEntity(ProcessStepDtos.ProcessStepCreateDto dto) {
        ProcessStep entity = new ProcessStep();
        entity.setName(dto.name);
        entity.setDescription(dto.description);
        return entity;
    }
}

