package de.itsfullofstars.sipoc.server.controller;

import de.itsfullofstars.sipoc.server.dto.BusinessPartnerDtos;
import de.itsfullofstars.sipoc.server.service.BusinessPartnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
/** Plain CRUD for business partners, plus linking/unlinking the Inputs they can generally supply. */
@RequestMapping("/api/business-partners")
public class BusinessPartnerController {

    @Autowired
    private BusinessPartnerService service;

    @GetMapping
    public ResponseEntity<BusinessPartnerDtos.PageBusinessPartnerListItemDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort) {
        Page<BusinessPartnerDtos.BusinessPartnerListItemDto> result = service.list(page, size, sort);
        BusinessPartnerDtos.PageBusinessPartnerListItemDto response = new BusinessPartnerDtos.PageBusinessPartnerListItemDto();
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
    public ResponseEntity<BusinessPartnerDtos.BusinessPartnerDto> create(@RequestBody BusinessPartnerDtos.BusinessPartnerCreateDto dto) {
        BusinessPartnerDtos.BusinessPartnerDto result = service.create(dto);
        return ResponseEntity.status(201).body(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessPartnerDtos.BusinessPartnerDto> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BusinessPartnerDtos.BusinessPartnerDto> updatePatch(@PathVariable String id, @RequestBody BusinessPartnerDtos.BusinessPartnerUpdateDto dto) {
        try {
            BusinessPartnerDtos.BusinessPartnerDto result = service.updatePatch(id, dto);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{partnerId}/inputs/{inputId}")
    public ResponseEntity<BusinessPartnerDtos.BusinessPartnerDto> addInput(@PathVariable String partnerId, @PathVariable String inputId) {
        try {
            BusinessPartnerDtos.BusinessPartnerDto result = service.addInput(partnerId, inputId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{partnerId}/inputs/{inputId}")
    public ResponseEntity<BusinessPartnerDtos.BusinessPartnerDto> removeInput(@PathVariable String partnerId, @PathVariable String inputId) {
        try {
            BusinessPartnerDtos.BusinessPartnerDto result = service.removeInput(partnerId, inputId);
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

