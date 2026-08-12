package de.itsfullofstars.sipoc.server.mapper;

import de.itsfullofstars.sipoc.server.dto.LipokDtos;
import de.itsfullofstars.sipoc.server.dto.GoDtos;
import de.itsfullofstars.sipoc.server.model.Lipok;
import java.util.stream.Collectors;

/**
 * Converts between {@link de.itsfullofstars.sipoc.server.model.Lipok} and its DTOs, including flattening
 * the five SIPOC join-entity lists (and their optional fine-grained links) into the
 * {@code LipokDto} shape documented in SCHEMA.md.
 */
public class LipokMapper {

    public static LipokDtos.LipokListItemDto toListItem(Lipok lipok) {
        LipokDtos.LipokListItemDto dto = new LipokDtos.LipokListItemDto();
        dto.id = lipok.getId();
        dto.name = lipok.getName();
        dto.description = lipok.getDescription();
        dto.createdAt = lipok.getCreatedAt();
        dto.updatedAt = lipok.getUpdatedAt();
        return dto;
    }

    public static LipokDtos.LipokDto toDetail(Lipok lipok) {
        LipokDtos.LipokDto dto = new LipokDtos.LipokDto();
        dto.id = lipok.getId();
        dto.name = lipok.getName();
        dto.description = lipok.getDescription();
        dto.gos = lipok.getGos().stream().map(lg -> {
            LipokDtos.LinkedGoDto g = new LipokDtos.LinkedGoDto();
            g.id = lg.getGo().getId();
            g.name = lg.getGo().getName();
            g.description = lg.getGo().getDescription();
            return g;
        }).collect(Collectors.toList());
        dto.suppliers = lipok.getSuppliers().stream().map(ls -> {
            LipokDtos.OrderedSupplierDto s = new LipokDtos.OrderedSupplierDto();
            s.id = ls.getSupplier().getId();
            s.name = ls.getSupplier().getName();
            s.position = ls.getPosition();
            return s;
        }).collect(Collectors.toList());
        dto.inputs = lipok.getInputs().stream().map(li -> {
            LipokDtos.OrderedInputDto i = new LipokDtos.OrderedInputDto();
            i.lipokInputId = li.getId();
            i.id = li.getInput().getId();
            i.name = li.getInput().getName();
            i.position = li.getPosition();
            i.supplierId = li.getSupplier() != null ? li.getSupplier().getId() : null;
            i.processStepId = li.getProcessStep() != null ? li.getProcessStep().getId() : null;
            return i;
        }).collect(Collectors.toList());
        dto.processSteps = lipok.getProcessSteps().stream().map(lp -> {
            LipokDtos.OrderedProcessStepDto p = new LipokDtos.OrderedProcessStepDto();
            p.lipokProcessStepId = lp.getId();
            p.id = lp.getProcessStep().getId();
            p.name = lp.getProcessStep().getName();
            p.position = lp.getPosition();
            p.predecessorId = lp.getPredecessor() != null ? lp.getPredecessor().getId() : null;
            return p;
        }).collect(Collectors.toList());
        dto.outputs = lipok.getOutputs().stream().map(lo -> {
            LipokDtos.OrderedOutputDto o = new LipokDtos.OrderedOutputDto();
            o.lipokOutputId = lo.getId();
            o.id = lo.getOutput().getId();
            o.name = lo.getOutput().getName();
            o.position = lo.getPosition();
            o.processStepId = lo.getProcessStep() != null ? lo.getProcessStep().getId() : null;
            o.customerIds = lo.getCustomerLinks().stream()
                    .map(link -> link.getCustomer().getId())
                    .collect(Collectors.toList());
            return o;
        }).collect(Collectors.toList());
        dto.customers = lipok.getCustomers().stream().map(lc -> {
            LipokDtos.OrderedCustomerDto c = new LipokDtos.OrderedCustomerDto();
            c.id = lc.getCustomer().getId();
            c.name = lc.getCustomer().getName();
            c.position = lc.getPosition();
            return c;
        }).collect(Collectors.toList());
        dto.comments = lipok.getComments().stream().map(lc -> {
            LipokDtos.LipokCommentDto c = new LipokDtos.LipokCommentDto();
            c.id = lc.getId();
            c.number = lc.getNumber();
            c.content = lc.getContent();
            c.createdAt = lc.getCreatedAt();
            return c;
        }).collect(Collectors.toList());
        dto.audit = new GoDtos.AuditDto();
        dto.audit.createdAt = lipok.getCreatedAt();
        dto.audit.createdBy = lipok.getCreatedBy();
        dto.audit.updatedAt = lipok.getUpdatedAt();
        dto.audit.updatedBy = lipok.getUpdatedBy();
        return dto;
    }

    public static Lipok toEntity(LipokDtos.LipokCreateDto dto) {
        Lipok entity = new Lipok();
        entity.setName(dto.name);
        entity.setDescription(dto.description);
        return entity;
    }
}
