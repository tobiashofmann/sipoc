// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.LipokDtos;
import de.itsfullofstars.sipoc.server.service.LipokExportService;
import de.itsfullofstars.sipoc.server.service.LipokService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
/**
 * CRUD for {@link de.itsfullofstars.sipoc.server.model.Lipok} plus its full extra surface: attach/detach
 * and reorder the five SIPOC columns, Go tagging, the fine-grained supplier/process-step/customer
 * links, comments, and Markdown export. See SCHEMA.md's "REST API" section for the full endpoint
 * reference; the constraints behind these endpoints live in {@link de.itsfullofstars.sipoc.server.service.LipokService}.
 */
@RequestMapping("/api/lipoks")
public class LipokController {

    @Autowired
    private LipokService service;

    @Autowired
    private LipokExportService exportService;

    @GetMapping
    public ResponseEntity<LipokDtos.PageLipokListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Page<LipokDtos.LipokListItemDto> result = service.list(page, size, sort);
        LipokDtos.PageLipokListItemDto response = new LipokDtos.PageLipokListItemDto();
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
    public ResponseEntity<LipokDtos.LipokDto> create(@RequestBody LipokDtos.LipokCreateDto dto) {
        LipokDtos.LipokDto result = service.create(dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAll() {
        Map<String, String> filenameToContent = exportService.exportAllMarkdown();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
            for (Map.Entry<String, String> entry : filenameToContent.entrySet()) {
                zos.putNextEntry(new ZipEntry(entry.getKey()));
                zos.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"lipok-export.zip\"")
                .body(baos.toByteArray());
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportOne(@PathVariable String id) {
        return exportService.findById(id)
                .map(lipok -> {
                    String content = exportService.generateMarkdownExport(id)
                            .orElseThrow(() -> new RuntimeException("Failed to generate markdown export for Lipok with id: " + id));
                    String filename = exportService.buildFileName(lipok);
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                            .body(content.getBytes(StandardCharsets.UTF_8));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LipokDtos.LipokDto> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<LipokDtos.LipokDto> updatePatch(@PathVariable String id, @RequestBody LipokDtos.LipokUpdateDto dto) {
        try {
            LipokDtos.LipokDto result = service.updatePatch(id, dto);
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

    @PostMapping("/{lipokId}/gos/{goId}")
    public ResponseEntity<LipokDtos.LipokDto> addGo(
            @PathVariable String lipokId,
            @PathVariable String goId) {
        try {
            LipokDtos.LipokDto result = service.addGo(lipokId, goId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/gos")
    public ResponseEntity<LipokDtos.LipokDto> addNewGo(
            @PathVariable String lipokId,
            @RequestBody de.itsfullofstars.sipoc.server.dto.GoDtos.GoCreateDto dto) {
        try {
            LipokDtos.LipokDto result = service.addNewGo(lipokId, dto);
            return ResponseEntity.status(201).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/gos/{goId}")
    public ResponseEntity<LipokDtos.LipokDto> removeGo(@PathVariable String lipokId, @PathVariable String goId) {
        try {
            return ResponseEntity.ok(service.removeGo(lipokId, goId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/suppliers/{supplierId}")
    public ResponseEntity<LipokDtos.LipokDto> addSupplier(
            @PathVariable String lipokId,
            @PathVariable String supplierId,
            @RequestParam(required = false) Integer position) {
        try {
            LipokDtos.LipokDto result = service.addSupplier(lipokId, supplierId, position);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/inputs/{inputId}")
    public ResponseEntity<LipokDtos.LipokDto> addInput(
            @PathVariable String lipokId,
            @PathVariable String inputId,
            @RequestParam(required = false) Integer position) {
        try {
            LipokDtos.LipokDto result = service.addInput(lipokId, inputId, position);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/process-steps/{processStepId}")
    public ResponseEntity<LipokDtos.LipokDto> addProcessStep(
            @PathVariable String lipokId,
            @PathVariable String processStepId,
            @RequestParam(required = false) Integer position) {
        try {
            LipokDtos.LipokDto result = service.addProcessStep(lipokId, processStepId, position);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/outputs/{outputId}")
    public ResponseEntity<LipokDtos.LipokDto> addOutput(
            @PathVariable String lipokId,
            @PathVariable String outputId,
            @RequestParam(required = false) Integer position) {
        try {
            LipokDtos.LipokDto result = service.addOutput(lipokId, outputId, position);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/customers/{customerId}")
    public ResponseEntity<LipokDtos.LipokDto> addCustomer(
            @PathVariable String lipokId,
            @PathVariable String customerId,
            @RequestParam(required = false) Integer position) {
        try {
            LipokDtos.LipokDto result = service.addCustomer(lipokId, customerId, position);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/suppliers/{supplierId}")
    public ResponseEntity<LipokDtos.LipokDto> removeSupplier(@PathVariable String lipokId, @PathVariable String supplierId) {
        try {
            return ResponseEntity.ok(service.removeSupplier(lipokId, supplierId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/inputs/{inputId}")
    public ResponseEntity<LipokDtos.LipokDto> removeInput(@PathVariable String lipokId, @PathVariable String inputId) {
        try {
            return ResponseEntity.ok(service.removeInput(lipokId, inputId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/process-steps/{processStepId}")
    public ResponseEntity<LipokDtos.LipokDto> removeProcessStep(@PathVariable String lipokId, @PathVariable String processStepId) {
        try {
            return ResponseEntity.ok(service.removeProcessStep(lipokId, processStepId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/outputs/{outputId}")
    public ResponseEntity<LipokDtos.LipokDto> removeOutput(@PathVariable String lipokId, @PathVariable String outputId) {
        try {
            return ResponseEntity.ok(service.removeOutput(lipokId, outputId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/customers/{customerId}")
    public ResponseEntity<LipokDtos.LipokDto> removeCustomer(@PathVariable String lipokId, @PathVariable String customerId) {
        try {
            return ResponseEntity.ok(service.removeCustomer(lipokId, customerId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/suppliers/reorder")
    public ResponseEntity<LipokDtos.LipokDto> reorderSuppliers(@PathVariable String lipokId, @RequestBody LipokDtos.ReorderDto dto) {
        try {
            return ResponseEntity.ok(service.reorderSuppliers(lipokId, dto.orderedIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/inputs/reorder")
    public ResponseEntity<LipokDtos.LipokDto> reorderInputs(@PathVariable String lipokId, @RequestBody LipokDtos.ReorderDto dto) {
        try {
            return ResponseEntity.ok(service.reorderInputs(lipokId, dto.orderedIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/outputs/reorder")
    public ResponseEntity<LipokDtos.LipokDto> reorderOutputs(@PathVariable String lipokId, @RequestBody LipokDtos.ReorderDto dto) {
        try {
            return ResponseEntity.ok(service.reorderOutputs(lipokId, dto.orderedIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/customers/reorder")
    public ResponseEntity<LipokDtos.LipokDto> reorderCustomers(@PathVariable String lipokId, @RequestBody LipokDtos.ReorderDto dto) {
        try {
            return ResponseEntity.ok(service.reorderCustomers(lipokId, dto.orderedIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/inputs/{lipokInputId}/link")
    public ResponseEntity<LipokDtos.LipokDto> linkInput(
            @PathVariable String lipokId,
            @PathVariable Long lipokInputId,
            @RequestBody LipokDtos.LipokInputLinkDto dto) {
        try {
            LipokDtos.LipokDto result = service.linkInput(lipokId, lipokInputId, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/outputs/{lipokOutputId}/link")
    public ResponseEntity<LipokDtos.LipokDto> linkOutput(
            @PathVariable String lipokId,
            @PathVariable Long lipokOutputId,
            @RequestBody LipokDtos.LipokOutputLinkDto dto) {
        try {
            LipokDtos.LipokDto result = service.linkOutput(lipokId, lipokOutputId, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/process-steps/{lipokProcessStepId}/link")
    public ResponseEntity<LipokDtos.LipokDto> linkProcessStep(
            @PathVariable String lipokId,
            @PathVariable Long lipokProcessStepId,
            @RequestBody LipokDtos.LipokProcessStepLinkDto dto) {
        try {
            LipokDtos.LipokDto result = service.linkProcessStep(lipokId, lipokProcessStepId, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/outputs/{lipokOutputId}/customers/{customerId}")
    public ResponseEntity<LipokDtos.LipokDto> addOutputCustomer(
            @PathVariable String lipokId,
            @PathVariable Long lipokOutputId,
            @PathVariable String customerId) {
        try {
            LipokDtos.LipokDto result = service.addOutputCustomer(lipokId, lipokOutputId, customerId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/outputs/{lipokOutputId}/customers/{customerId}")
    public ResponseEntity<LipokDtos.LipokDto> removeOutputCustomer(
            @PathVariable String lipokId,
            @PathVariable Long lipokOutputId,
            @PathVariable String customerId) {
        try {
            LipokDtos.LipokDto result = service.removeOutputCustomer(lipokId, lipokOutputId, customerId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{lipokId}/comments")
    public ResponseEntity<LipokDtos.LipokDto> addComment(
            @PathVariable String lipokId,
            @RequestBody LipokDtos.LipokCommentCreateDto dto) {
        try {
            LipokDtos.LipokDto result = service.addComment(lipokId, dto);
            return ResponseEntity.status(201).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{lipokId}/comments/{commentId}")
    public ResponseEntity<LipokDtos.LipokDto> updateComment(
            @PathVariable String lipokId,
            @PathVariable Long commentId,
            @RequestBody LipokDtos.LipokCommentUpdateDto dto) {
        try {
            LipokDtos.LipokDto result = service.updateComment(lipokId, commentId, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{lipokId}/comments/{commentId}")
    public ResponseEntity<LipokDtos.LipokDto> removeComment(@PathVariable String lipokId, @PathVariable Long commentId) {
        try {
            return ResponseEntity.ok(service.removeComment(lipokId, commentId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
