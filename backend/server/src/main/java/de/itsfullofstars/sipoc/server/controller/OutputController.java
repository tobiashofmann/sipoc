package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.OutputDtos;
import de.itsfullofstars.sipoc.server.service.OutputService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
/** Plain CRUD for Output master data. */
@RequestMapping("/api/outputs")
public class OutputController {

    @Autowired
    private OutputService service;

    @GetMapping
    public ResponseEntity<OutputDtos.PageOutputListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Page<OutputDtos.OutputListItemDto> result = service.list(page, size, sort);
        OutputDtos.PageOutputListItemDto response = new OutputDtos.PageOutputListItemDto();
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
    public ResponseEntity<OutputDtos.OutputDto> create(@RequestBody OutputDtos.OutputCreateDto dto) {
        OutputDtos.OutputDto result = service.create(dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OutputDtos.OutputDto> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OutputDtos.OutputDto> updatePatch(@PathVariable String id, @RequestBody OutputDtos.OutputUpdateDto dto) {
        try {
            OutputDtos.OutputDto result = service.updatePatch(id, dto);
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

