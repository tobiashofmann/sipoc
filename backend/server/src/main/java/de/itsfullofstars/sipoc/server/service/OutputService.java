package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.OutputDtos;
import de.itsfullofstars.sipoc.server.mapper.OutputMapper;
import de.itsfullofstars.sipoc.server.model.Output;
import de.itsfullofstars.sipoc.server.repository.OutputRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
/** Plain CRUD for {@link Output} master data. */
public class OutputService {

    @Autowired
    private OutputRepository repository;

    @Transactional(readOnly = true)
    public Page<OutputDtos.OutputListItemDto> list(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.ASC;
        String field = "name";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            direction = "desc".equalsIgnoreCase(parts[1]) ? Sort.Direction.DESC : Sort.Direction.ASC;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, field));
        Page<Output> entities = repository.findAll(pageable);
        return entities.map(OutputMapper::toListItem);
    }

    @Transactional
    public OutputDtos.OutputDto create(OutputDtos.OutputCreateDto dto) {
        Output entity = OutputMapper.toEntity(dto);
        Output saved = repository.save(entity);
        return OutputMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public Optional<OutputDtos.OutputDto> findById(String id) {
        return repository.findById(id).map(OutputMapper::toDetail);
    }

    @Transactional
    public OutputDtos.OutputDto updatePatch(String id, OutputDtos.OutputUpdateDto dto) {
        Output entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Output not found"));
        if (dto.name != null) entity.setName(dto.name);
        if (dto.description != null) entity.setDescription(dto.description);
        if (dto.type != null) entity.setType(de.itsfullofstars.sipoc.server.model.DocumentableType.valueOf(dto.type));
        if (dto.linkUrl != null) entity.setLinkUrl(dto.linkUrl);
        Output saved = repository.save(entity);
        return OutputMapper.toDetail(saved);
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}

