package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.ProcessStepDtos;
import de.itsfullofstars.sipoc.server.service.ProcessStepService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
/** Plain CRUD for Process step master data. */
@RequestMapping("/api/process-steps")
public class ProcessStepController {

    @Autowired
    private ProcessStepService service;

    @GetMapping
    public ResponseEntity<ProcessStepDtos.PageProcessStepListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Page<ProcessStepDtos.ProcessStepListItemDto> result = service.list(page, size, sort);
        ProcessStepDtos.PageProcessStepListItemDto response = new ProcessStepDtos.PageProcessStepListItemDto();
        response.content = result.getContent();
        response.totalElements = result.getTotalElements();
        response.totalPages = result.getTotalPages();
        response.size = result.getSize();
        response.number = result.getNumber();
        response.numberOfElements = result.getNumberOfElements();
        response.first = result.isFirst();
        response.last = result.isLast();
        response.empty = result.isEmpty();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ProcessStepDtos.ProcessStepDto> create(@RequestBody ProcessStepDtos.ProcessStepCreateDto dto) {
        ProcessStepDtos.ProcessStepDto result = service.create(dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessStepDtos.ProcessStepDto> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProcessStepDtos.ProcessStepDto> updatePatch(@PathVariable String id, @RequestBody ProcessStepDtos.ProcessStepUpdateDto dto) {
        try {
            ProcessStepDtos.ProcessStepDto result = service.updatePatch(id, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

