// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.BusinessPartnerDtos;
import de.itsfullofstars.sipoc.server.mapper.BusinessPartnerMapper;
import de.itsfullofstars.sipoc.server.model.BusinessPartner;
import de.itsfullofstars.sipoc.server.model.BusinessPartnerInput;
import de.itsfullofstars.sipoc.server.model.Input;
import de.itsfullofstars.sipoc.server.model.Lipok;
import de.itsfullofstars.sipoc.server.repository.BusinessPartnerRepository;
import de.itsfullofstars.sipoc.server.repository.InputRepository;
import de.itsfullofstars.sipoc.server.repository.LipokRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** CRUD and Input-capability linking for {@link BusinessPartner} master data. */
@Service
public class BusinessPartnerService {

    @Autowired
    private BusinessPartnerRepository repository;

    @Autowired
    private InputRepository inputRepository;

    @Autowired
    private LipokRepository lipokRepository;

    @Transactional(readOnly = true)
    public Page<BusinessPartnerDtos.BusinessPartnerListItemDto> list(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.ASC;
        String field = "name";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            direction = "desc".equalsIgnoreCase(parts[1]) ? Sort.Direction.DESC : Sort.Direction.ASC;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, field));
        Page<BusinessPartner> entities = repository.findAll(pageable);
        return entities.map(BusinessPartnerMapper::toListItem);
    }

    @Transactional
    public BusinessPartnerDtos.BusinessPartnerDto create(BusinessPartnerDtos.BusinessPartnerCreateDto dto) {
        BusinessPartner entity = BusinessPartnerMapper.toEntity(dto);
        BusinessPartner saved = repository.save(entity);
        return BusinessPartnerMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public Optional<BusinessPartnerDtos.BusinessPartnerDto> findById(String id) {
        return repository.findById(id).map(partner -> {
            BusinessPartnerDtos.BusinessPartnerDto dto = BusinessPartnerMapper.toDetail(partner);
            dto.lipokUsages = buildLipokUsages(id);
            return dto;
        });
    }

    /**
     * One entry per Lipok this partner is attached to, with {@code inputs} populated when the
     * partner supplies one of that Lipok's inputs and/or {@code outputs} populated when it
     * receives one of that Lipok's outputs (both can be set on the same entry, e.g. a department
     * that is both the supplier of a request and the customer of its confirmation).
     */
    private List<BusinessPartnerDtos.LipokUsageDto> buildLipokUsages(String partnerId) {
        Map<String, BusinessPartnerDtos.LipokUsageDto> byLipokId = new LinkedHashMap<>();

        for (Lipok lipok : lipokRepository.findDistinctBySuppliers_Supplier_Id(partnerId)) {
            BusinessPartnerDtos.LipokUsageDto usage = byLipokId.computeIfAbsent(lipok.getId(), id -> {
                BusinessPartnerDtos.LipokUsageDto u = new BusinessPartnerDtos.LipokUsageDto();
                u.lipokId = lipok.getId();
                u.lipokName = lipok.getName();
                return u;
            });
            usage.inputs = lipok.getInputs().stream()
                    .filter(li -> li.getSupplier() != null && li.getSupplier().getId().equals(partnerId))
                    .map(li -> {
                        BusinessPartnerDtos.LinkedInputDto i = new BusinessPartnerDtos.LinkedInputDto();
                        i.id = li.getInput().getId();
                        i.name = li.getInput().getName();
                        return i;
                    })
                    .collect(Collectors.toList());
        }

        for (Lipok lipok : lipokRepository.findDistinctByCustomers_Customer_Id(partnerId)) {
            BusinessPartnerDtos.LipokUsageDto usage = byLipokId.computeIfAbsent(lipok.getId(), id -> {
                BusinessPartnerDtos.LipokUsageDto u = new BusinessPartnerDtos.LipokUsageDto();
                u.lipokId = lipok.getId();
                u.lipokName = lipok.getName();
                return u;
            });
            usage.outputs = lipok.getOutputs().stream()
                    .filter(lo -> lo.getCustomerLinks().stream().anyMatch(link -> link.getCustomer().getId().equals(partnerId)))
                    .map(lo -> {
                        BusinessPartnerDtos.LinkedInputDto o = new BusinessPartnerDtos.LinkedInputDto();
                        o.id = lo.getOutput().getId();
                        o.name = lo.getOutput().getName();
                        return o;
                    })
                    .collect(Collectors.toList());
        }

        return new ArrayList<>(byLipokId.values());
    }

    @Transactional
    public BusinessPartnerDtos.BusinessPartnerDto updatePatch(String id, BusinessPartnerDtos.BusinessPartnerUpdateDto dto) {
        BusinessPartner entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Business partner not found"));
        if (dto.name != null) entity.setName(dto.name);
        if (dto.description != null) entity.setDescription(dto.description);
        BusinessPartner saved = repository.save(entity);
        return BusinessPartnerMapper.toDetail(saved);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Transactional
    public BusinessPartnerDtos.BusinessPartnerDto addInput(String partnerId, String inputId) {
        BusinessPartner partner = repository.findById(partnerId).orElseThrow(() -> new RuntimeException("Business partner not found"));
        Input input = inputRepository.findById(inputId).orElseThrow(() -> new RuntimeException("Input not found"));
        boolean alreadyLinked = partner.getInputs().stream().anyMatch(bpi -> bpi.getInput().getId().equals(inputId));
        if (!alreadyLinked) {
            partner.getInputs().add(new BusinessPartnerInput(partner, input));
        }
        BusinessPartner saved = repository.save(partner);
        return BusinessPartnerMapper.toDetail(saved);
    }

    @Transactional
    public BusinessPartnerDtos.BusinessPartnerDto removeInput(String partnerId, String inputId) {
        BusinessPartner partner = repository.findById(partnerId).orElseThrow(() -> new RuntimeException("Business partner not found"));
        partner.getInputs().removeIf(bpi -> bpi.getInput().getId().equals(inputId));
        BusinessPartner saved = repository.save(partner);
        return BusinessPartnerMapper.toDetail(saved);
    }
}

