// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.GoDtos.*;
import de.itsfullofstars.sipoc.server.model.Go;
import de.itsfullofstars.sipoc.server.model.GoCustomProperty;

import java.util.ArrayList;
import java.util.stream.Collectors;

/** Converts between {@link de.itsfullofstars.sipoc.server.model.Go} (and its custom properties) and its DTOs. */
public class GoMapper {

    public static GoListItemDto toListItem(Go e) {
        if (e == null) return null;
        GoListItemDto d = new GoListItemDto();
        d.id = e.getId();
        d.name = e.getName();
        d.category = e.getCategory();
        d.parentId = e.getParent() != null ? e.getParent().getId() : null;
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    public static GoDetailDto toDetail(Go e) {
        if (e == null) return null;
        GoDetailDto d = new GoDetailDto();
        d.id = e.getId();
        d.name = e.getName();
        d.description = e.getDescription();
        d.category = e.getCategory();
        d.parentId = e.getParent() != null ? e.getParent().getId() : null;
        d.type = e.getType();
        d.importance = e.getImportance();
        d.criticality = e.getCriticality();
        d.customProperties = e.getCustomProperties().stream()
                .map(GoMapper::toCustomPropertyDto)
                .collect(Collectors.toList());
        d.lipokUsages = new ArrayList<>();
        AuditDto a = new AuditDto();
        a.createdAt = e.getCreatedAt();
        a.createdBy = e.getCreatedBy();
        a.updatedAt = e.getUpdatedAt();
        a.updatedBy = e.getUpdatedBy();
        d.audit = a;
        return d;
    }

    public static CustomPropertyDto toCustomPropertyDto(GoCustomProperty p) {
        CustomPropertyDto d = new CustomPropertyDto();
        d.key = p.getKey();
        d.value = p.getValue();
        return d;
    }

    public static GoCustomProperty toCustomProperty(Go go, CustomPropertyDto dto) {
        return new GoCustomProperty(go, dto.key, dto.value);
    }

    public static GoTreeNodeDto toTreeNode(Go e) {
        if (e == null) return null;
        GoTreeNodeDto n = new GoTreeNodeDto();
        n.id = e.getId();
        n.name = e.getName();
        n.description = e.getDescription();
        n.category = e.getCategory();
        n.children = new ArrayList<>();
        for (Go c : e.getChildren()) n.children.add(toTreeNode(c));
        return n;
    }

    public static Go toEntity(GoCreateDto dto) {
        if (dto == null) return null;
        Go e = new Go();
        e.setName(dto.name);
        e.setDescription(dto.description);
        e.setCategory(dto.category);
        e.setType(dto.type);
        e.setImportance(dto.importance);
        e.setCriticality(dto.criticality);
        return e;
    }
}

