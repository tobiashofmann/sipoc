// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.GoDtos.*;
import de.itsfullofstars.sipoc.server.mapper.GoMapper;
import de.itsfullofstars.sipoc.server.model.Go;
import de.itsfullofstars.sipoc.server.model.Lipok;
import de.itsfullofstars.sipoc.server.repository.GoRepository;
import de.itsfullofstars.sipoc.server.repository.LipokRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * CRUD, custom properties, and hierarchy queries for {@link Go} taxonomy nodes. Note this is
 * unrelated to {@code ProcessStep} despite both being "steps" in a hierarchy/sequence sense.
 */
@Service
public class GoService {

    private final GoRepository repo;
    private final LipokRepository lipokRepository;

    public GoService(GoRepository repo, LipokRepository lipokRepository) {
        this.repo = repo;
        this.lipokRepository = lipokRepository;
    }

    public Page<Go> list(int page, int size, List<String> sort) {
        Sort s = Sort.unsorted();
        if (sort != null && !sort.isEmpty()) {
            List<Sort.Order> orders = new ArrayList<>();
            for (String spec : sort) {
                String[] parts = spec.split(",");
                if (parts.length == 2) orders.add(new Sort.Order(Sort.Direction.fromString(parts[1]), parts[0]));
                else orders.add(new Sort.Order(Sort.Direction.ASC, parts[0]));
            }
            s = Sort.by(orders);
        }
        Pageable p = PageRequest.of(page, size, s);
        return repo.findAll(p);
    }

    /** Rejects duplicate {@code customProperties} keys before creating; each key must be unique per Go. */
    @Transactional
    public Go create(GoCreateDto dto) {
        Go e = GoMapper.toEntity(dto);
        if (dto.parentId != null) repo.findById(dto.parentId).ifPresent(e::setParent);
        if (dto.customProperties != null) {
            validateUniqueKeys(dto.customProperties);
            for (CustomPropertyDto p : dto.customProperties) {
                e.getCustomProperties().add(GoMapper.toCustomProperty(e, p));
            }
        }
        return repo.save(e);
    }

    @Transactional(readOnly = true)
    public Optional<GoDetailDto> findDetailById(String id) {
        return repo.findById(id).map(go -> {
            GoDetailDto dto = GoMapper.toDetail(go);
            dto.lipokUsages = findLipokUsages(id);
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public List<LipokUsageDto> findLipokUsages(String goId) {
        List<Lipok> lipoks = lipokRepository.findDistinctByGos_Go_Id(goId);
        return lipoks.stream().map(lipok -> {
            LipokUsageDto dto = new LipokUsageDto();
            dto.lipokId = lipok.getId();
            dto.lipokName = lipok.getName();
            return dto;
        }).collect(Collectors.toList());
    }

    /** The full hierarchy tree (from the top-most ancestor down) this Go belongs to, or empty if it's standalone (no parent, no children). */
    @Transactional(readOnly = true)
    public List<GoTreeNodeDto> buildHierarchyFor(String goId) {
        Go go = repo.findById(goId).orElseThrow(() -> new NoSuchElementException("Go not found"));
        if (go.getParent() == null && go.getChildren().isEmpty()) {
            return List.of();
        }
        Go root = go;
        while (root.getParent() != null) {
            root = root.getParent();
        }
        return List.of(GoMapper.toTreeNode(root));
    }

    @Transactional
    public GoDetailDto updatePatch(String id, GoUpdateDto dto) {
        Go e = repo.findById(id).orElseThrow(() -> new NoSuchElementException("Go not found"));
        if (dto.name != null) e.setName(dto.name);
        if (dto.description != null) e.setDescription(dto.description);
        if (dto.category != null) e.setCategory(dto.category);
        if (dto.parentId != null) repo.findById(dto.parentId).ifPresent(e::setParent);
        if (dto.type != null) e.setType(dto.type);
        if (dto.importance != null) e.setImportance(dto.importance);
        if (dto.criticality != null) e.setCriticality(dto.criticality);
        if (dto.customProperties != null) {
            validateUniqueKeys(dto.customProperties);
            e.getCustomProperties().clear();
            for (CustomPropertyDto p : dto.customProperties) {
                e.getCustomProperties().add(GoMapper.toCustomProperty(e, p));
            }
        }
        Go saved = repo.save(e);
        GoDetailDto result = GoMapper.toDetail(saved);
        result.lipokUsages = findLipokUsages(id);
        return result;
    }

    private void validateUniqueKeys(List<CustomPropertyDto> properties) {
        Set<String> seen = new HashSet<>();
        for (CustomPropertyDto p : properties) {
            if (!seen.add(p.key)) {
                throw new IllegalArgumentException("Duplicate custom property key: " + p.key);
            }
        }
    }

    public void delete(String id) { repo.deleteById(id); }

    /** The full forest of Go nodes: every top-level (parentless) Go with its descendants nested underneath. */
    @Transactional(readOnly = true)
    public List<GoTreeNodeDto> buildTree() {
        List<Go> all = repo.findAll();
        Map<String, GoTreeNodeDto> map = new HashMap<>();
        Map<String, List<Go>> childrenMap = new HashMap<>();
        for (Go g : all) {
            childrenMap.computeIfAbsent(g.getParent() == null ? "root" : g.getParent().getId(), k -> new ArrayList<>()).add(g);
        }
        List<GoTreeNodeDto> roots = new ArrayList<>();
        for (Go g : all) {
            if (g.getParent() == null) roots.add(GoMapper.toTreeNode(g));
        }
        return roots;
    }
}

