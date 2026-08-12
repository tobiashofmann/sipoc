package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.ProcessStepDtos;
import de.itsfullofstars.sipoc.server.mapper.ProcessStepMapper;
import de.itsfullofstars.sipoc.server.model.ProcessStep;
import de.itsfullofstars.sipoc.server.repository.ProcessStepRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
/** Plain CRUD for {@link ProcessStep} master data. */
public class ProcessStepService {

    @Autowired
    private ProcessStepRepository repository;

    @Transactional(readOnly = true)
    public Page<ProcessStepDtos.ProcessStepListItemDto> list(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.ASC;
        String field = "name";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            direction = "desc".equalsIgnoreCase(parts[1]) ? Sort.Direction.DESC : Sort.Direction.ASC;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, field));
        Page<ProcessStep> entities = repository.findAll(pageable);
        return entities.map(ProcessStepMapper::toListItem);
    }

    @Transactional
    public ProcessStepDtos.ProcessStepDto create(ProcessStepDtos.ProcessStepCreateDto dto) {
        ProcessStep entity = ProcessStepMapper.toEntity(dto);
        ProcessStep saved = repository.save(entity);
        return ProcessStepMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public Optional<ProcessStepDtos.ProcessStepDto> findById(String id) {
        return repository.findById(id).map(ProcessStepMapper::toDetail);
    }

    @Transactional
    public ProcessStepDtos.ProcessStepDto updatePatch(String id, ProcessStepDtos.ProcessStepUpdateDto dto) {
        ProcessStep entity = repository.findById(id).orElseThrow(() -> new RuntimeException("ProcessStep not found"));
        if (dto.name != null) entity.setName(dto.name);
        if (dto.description != null) entity.setDescription(dto.description);
        ProcessStep saved = repository.save(entity);
        return ProcessStepMapper.toDetail(saved);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}

