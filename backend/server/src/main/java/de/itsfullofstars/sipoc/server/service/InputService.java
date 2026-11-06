// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.InputDtos;
import de.itsfullofstars.sipoc.server.mapper.InputMapper;
import de.itsfullofstars.sipoc.server.model.Input;
import de.itsfullofstars.sipoc.server.repository.InputRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
/** Plain CRUD for {@link Input} master data. */
public class InputService {

    @Autowired
    private InputRepository repository;

    @Transactional(readOnly = true)
    public Page<InputDtos.InputListItemDto> list(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.ASC;
        String field = "name";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            direction = "desc".equalsIgnoreCase(parts[1]) ? Sort.Direction.DESC : Sort.Direction.ASC;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, field));
        Page<Input> entities = repository.findAll(pageable);
        return entities.map(InputMapper::toListItem);
    }

    @Transactional
    public InputDtos.InputDto create(InputDtos.InputCreateDto dto) {
        Input entity = InputMapper.toEntity(dto);
        Input saved = repository.save(entity);
        return InputMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public Optional<InputDtos.InputDto> findById(String id) {
        return repository.findById(id).map(InputMapper::toDetail);
    }

    @Transactional
    public InputDtos.InputDto updatePatch(String id, InputDtos.InputUpdateDto dto) {
        Input entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Input not found"));
        if (dto.name != null) entity.setName(dto.name);
        if (dto.description != null) entity.setDescription(dto.description);
        if (dto.type != null) entity.setType(de.itsfullofstars.sipoc.server.model.DocumentableType.valueOf(dto.type));
        if (dto.linkUrl != null) entity.setLinkUrl(dto.linkUrl);
        Input saved = repository.save(entity);
        return InputMapper.toDetail(saved);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}

