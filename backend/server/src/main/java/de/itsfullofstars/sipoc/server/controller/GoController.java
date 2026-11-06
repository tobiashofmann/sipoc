// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.GoDtos.*;
import de.itsfullofstars.sipoc.server.mapper.GoMapper;
import de.itsfullofstars.sipoc.server.model.Go;
import de.itsfullofstars.sipoc.server.service.GoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
/** CRUD for Go taxonomy nodes, plus the full-tree and single-node-hierarchy read endpoints. */
@RequestMapping("/api/gos")
public class GoController {

    private final GoService service;

    public GoController(GoService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<PageGoListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) List<String> sort
    ) {
        Page<Go> p = service.list(page, size, sort);
        PageGoListItemDto dto = new PageGoListItemDto();
        dto.totalElements = p.getTotalElements();
        dto.totalPages = p.getTotalPages();
        dto.size = p.getSize();
        dto.number = p.getNumber();
        dto.numberOfElements = p.getNumberOfElements();
        dto.first = p.isFirst();
        dto.last = p.isLast();
        dto.empty = p.isEmpty();
        dto.content = p.stream().map(GoMapper::toListItem).collect(Collectors.toList());
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<GoDetailDto> create(@RequestBody GoCreateDto dto) {
        try {
            Go created = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(GoMapper.toDetail(created));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/tree")
    public ResponseEntity<List<GoTreeNodeDto>> tree() {
        return ResponseEntity.ok(service.buildTree());
    }

    @GetMapping("/{goId}")
    public ResponseEntity<GoDetailDto> get(@PathVariable String goId) {
        return service.findDetailById(goId).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{goId}/hierarchy")
    public ResponseEntity<List<GoTreeNodeDto>> hierarchy(@PathVariable String goId) {
        try {
            return ResponseEntity.ok(service.buildHierarchyFor(goId));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{goId}")
    public ResponseEntity<GoDetailDto> patch(@PathVariable String goId, @RequestBody GoUpdateDto dto) {
        try {
            return ResponseEntity.ok(service.updatePatch(goId, dto));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{goId}")
    public ResponseEntity<Void> delete(@PathVariable String goId) {
        service.delete(goId);
        return ResponseEntity.noContent().build();
    }
}

