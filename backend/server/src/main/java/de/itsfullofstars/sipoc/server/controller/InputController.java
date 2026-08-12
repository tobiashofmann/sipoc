package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.InputDtos;
import de.itsfullofstars.sipoc.server.service.InputService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
/** Plain CRUD for Input master data. */
@RequestMapping("/api/inputs")
public class InputController {

    @Autowired
    private InputService service;

    @GetMapping
    public ResponseEntity<InputDtos.PageInputListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Page<InputDtos.InputListItemDto> result = service.list(page, size, sort);
        InputDtos.PageInputListItemDto response = new InputDtos.PageInputListItemDto();
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
    public ResponseEntity<InputDtos.InputDto> create(@RequestBody InputDtos.InputCreateDto dto) {
        InputDtos.InputDto result = service.create(dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InputDtos.InputDto> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<InputDtos.InputDto> updatePatch(@PathVariable String id, @RequestBody InputDtos.InputUpdateDto dto) {
        try {
            InputDtos.InputDto result = service.updatePatch(id, dto);
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

