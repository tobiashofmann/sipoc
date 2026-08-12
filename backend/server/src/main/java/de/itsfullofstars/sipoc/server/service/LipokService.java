package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.dto.LipokDtos;
import de.itsfullofstars.sipoc.server.mapper.LipokMapper;
import de.itsfullofstars.sipoc.server.model.*;
import de.itsfullofstars.sipoc.server.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.ObjIntConsumer;

/**
 * Owns all mutations on the {@link Lipok} aggregate: the five ordered SIPOC columns, Go tagging,
 * the optional fine-grained links (input/output â†” supplier/process step, output â†” customer,
 * process-step predecessor chain), and comments. This is also where the cross-entity constraints
 * from SCHEMA.md are enforced (a link may only reference an entity already attached to the same
 * Lipok) and where detaching an entity cascades to clear any links that referenced it, since none
 * of this is expressed at the DB level.
 */
@Service
public class LipokService {

    @Autowired
    private LipokRepository lipokRepository;

    @Autowired
    private BusinessPartnerRepository businessPartnerRepository;

    @Autowired
    private InputRepository inputRepository;

    @Autowired
    private ProcessStepRepository processStepRepository;

    @Autowired
    private OutputRepository outputRepository;

    @Autowired
    private GoRepository goRepository;

    @Transactional(readOnly = true)
    public Page<LipokDtos.LipokListItemDto> list(int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.ASC;
        String field = "name";
        if (sort != null && sort.contains(",")) {
            String[] parts = sort.split(",");
            field = parts[0];
            direction = "desc".equalsIgnoreCase(parts[1]) ? Sort.Direction.DESC : Sort.Direction.ASC;
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, field));
        Page<Lipok> entities = lipokRepository.findAll(pageable);
        return entities.map(LipokMapper::toListItem);
    }

    @Transactional
    public LipokDtos.LipokDto create(LipokDtos.LipokCreateDto dto) {
        Lipok entity = LipokMapper.toEntity(dto);
        Lipok saved = lipokRepository.save(entity);
        return LipokMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public Optional<LipokDtos.LipokDto> findById(String id) {
        return lipokRepository.findById(id).map(LipokMapper::toDetail);
    }

    @Transactional
    public LipokDtos.LipokDto updatePatch(String id, LipokDtos.LipokUpdateDto dto) {
        Lipok entity = lipokRepository.findById(id).orElseThrow(() -> new RuntimeException("Lipok not found"));
        if (dto.name != null) entity.setName(dto.name);
        if (dto.description != null) entity.setDescription(dto.description);
        Lipok saved = lipokRepository.save(entity);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public void delete(String id) {
        lipokRepository.deleteById(id);
    }

    @Transactional
    public LipokDtos.LipokDto addSupplier(String lipokId, String supplierId, Integer position) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        BusinessPartner supplier = businessPartnerRepository.findById(supplierId).orElseThrow(() -> new RuntimeException("Supplier not found"));
        LipokSupplier ls = new LipokSupplier(lipok, supplier, position != null ? position : lipok.getSuppliers().size());
        lipok.getSuppliers().add(ls);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addInput(String lipokId, String inputId, Integer position) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        Input input = inputRepository.findById(inputId).orElseThrow(() -> new RuntimeException("Input not found"));
        LipokInput li = new LipokInput(lipok, input, position != null ? position : lipok.getInputs().size());
        lipok.getInputs().add(li);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addProcessStep(String lipokId, String processStepId, Integer position) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        ProcessStep ps = processStepRepository.findById(processStepId).orElseThrow(() -> new RuntimeException("ProcessStep not found"));
        LipokProcessStep lps = new LipokProcessStep(lipok, ps, position != null ? position : lipok.getProcessSteps().size());
        lipok.getProcessSteps().add(lps);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addOutput(String lipokId, String outputId, Integer position) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        Output output = outputRepository.findById(outputId).orElseThrow(() -> new RuntimeException("Output not found"));
        LipokOutput lo = new LipokOutput(lipok, output, position != null ? position : lipok.getOutputs().size());
        lipok.getOutputs().add(lo);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addGo(String lipokId, String goId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        Go go = goRepository.findById(goId).orElseThrow(() -> new RuntimeException("Go not found"));
        boolean alreadyLinked = lipok.getGos().stream().anyMatch(lg -> lg.getGo().getId().equals(goId));
        if (!alreadyLinked) {
            lipok.getGos().add(new LipokGo(lipok, go));
        }
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto removeGo(String lipokId, String goId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getGos().removeIf(lg -> lg.getGo().getId().equals(goId));
        if (!removed) throw new RuntimeException("Go not part of this Lipok");
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addNewGo(String lipokId, de.itsfullofstars.sipoc.server.dto.GoDtos.GoCreateDto goCreateDto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        Go go = de.itsfullofstars.sipoc.server.mapper.GoMapper.toEntity(goCreateDto);
        if (goCreateDto.parentId != null) {
            goRepository.findById(goCreateDto.parentId).ifPresent(go::setParent);
        }
        Go savedGo = goRepository.save(go);
        lipok.getGos().add(new LipokGo(lipok, savedGo));
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto addCustomer(String lipokId, String customerId, Integer position) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        BusinessPartner customer = businessPartnerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        LipokCustomer lc = new LipokCustomer(lipok, customer, position != null ? position : lipok.getCustomers().size());
        lipok.getCustomers().add(lc);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto reorderSuppliers(String lipokId, List<String> orderedIds) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        applyOrder(lipok.getSuppliers(), orderedIds, ls -> ls.getSupplier().getId(), LipokSupplier::setPosition);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto reorderInputs(String lipokId, List<String> orderedIds) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        applyOrder(lipok.getInputs(), orderedIds, li -> li.getInput().getId(), LipokInput::setPosition);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto reorderOutputs(String lipokId, List<String> orderedIds) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        applyOrder(lipok.getOutputs(), orderedIds, lo -> lo.getOutput().getId(), LipokOutput::setPosition);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto reorderCustomers(String lipokId, List<String> orderedIds) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        applyOrder(lipok.getCustomers(), orderedIds, lc -> lc.getCustomer().getId(), LipokCustomer::setPosition);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /**
     * Re-numbers {@code items} (a Lipok's ordered join-row list) to match {@code orderedIds}, and
     * sorts the list in-memory to match. The in-memory sort matters because {@code @OrderBy} only
     * re-applies when the collection is freshly loaded from the DB, not after mutating fields on an
     * already-loaded collection.
     */
    private <T> void applyOrder(List<T> items, List<String> orderedIds, Function<T, String> idOf, ObjIntConsumer<T> setPosition) {
        if (orderedIds == null || orderedIds.size() != items.size()) {
            throw new RuntimeException("orderedIds must contain exactly the currently attached ids");
        }
        Set<String> givenIds = new HashSet<>(orderedIds);
        if (givenIds.size() != orderedIds.size()) {
            throw new RuntimeException("orderedIds must not contain duplicates");
        }
        Set<String> currentIds = new HashSet<>();
        for (T item : items) currentIds.add(idOf.apply(item));
        if (!currentIds.equals(givenIds)) {
            throw new RuntimeException("orderedIds must contain exactly the currently attached ids");
        }

        Map<String, Integer> indexById = new HashMap<>();
        for (int i = 0; i < orderedIds.size(); i++) indexById.put(orderedIds.get(i), i);
        for (T item : items) setPosition.accept(item, indexById.get(idOf.apply(item)));
        items.sort(Comparator.comparingInt(item -> indexById.get(idOf.apply(item))));
    }

    /**
     * Sets which supplier delivers, and/or which process step consumes, an already-attached
     * {@link LipokInput}. Both {@code supplierId} and {@code processStepId} must already be
     * attached to this same Lipok (as {@link LipokSupplier}/{@link LipokProcessStep}); a
     * {@code null} field clears that link.
     */
    @Transactional
    public LipokDtos.LipokDto linkInput(String lipokId, Long lipokInputId, LipokDtos.LipokInputLinkDto dto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokInput li = lipok.getInputs().stream()
                .filter(x -> x.getId().equals(lipokInputId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Input entry not found in this Lipok"));

        if (dto.supplierId != null) {
            boolean partOfLipok = lipok.getSuppliers().stream()
                    .anyMatch(ls -> ls.getSupplier().getId().equals(dto.supplierId));
            if (!partOfLipok) throw new RuntimeException("Supplier is not part of this Lipok");
            BusinessPartner supplier = businessPartnerRepository.findById(dto.supplierId)
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            li.setSupplier(supplier);
        } else {
            li.setSupplier(null);
        }

        if (dto.processStepId != null) {
            boolean partOfLipok = lipok.getProcessSteps().stream()
                    .anyMatch(lp -> lp.getProcessStep().getId().equals(dto.processStepId));
            if (!partOfLipok) throw new RuntimeException("ProcessStep is not part of this Lipok");
            ProcessStep processStep = processStepRepository.findById(dto.processStepId)
                    .orElseThrow(() -> new RuntimeException("ProcessStep not found"));
            li.setProcessStep(processStep);
        } else {
            li.setProcessStep(null);
        }

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /**
     * Sets which process step produced an already-attached {@link LipokOutput}. The process step
     * must already be attached to this same Lipok; {@code null} clears the link.
     */
    @Transactional
    public LipokDtos.LipokDto linkOutput(String lipokId, Long lipokOutputId, LipokDtos.LipokOutputLinkDto dto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokOutput lo = lipok.getOutputs().stream()
                .filter(x -> x.getId().equals(lipokOutputId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Output entry not found in this Lipok"));

        if (dto.processStepId != null) {
            boolean partOfLipok = lipok.getProcessSteps().stream()
                    .anyMatch(lp -> lp.getProcessStep().getId().equals(dto.processStepId));
            if (!partOfLipok) throw new RuntimeException("ProcessStep is not part of this Lipok");
            ProcessStep processStep = processStepRepository.findById(dto.processStepId)
                    .orElseThrow(() -> new RuntimeException("ProcessStep not found"));
            lo.setProcessStep(processStep);
        } else {
            lo.setProcessStep(null);
        }

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /**
     * Sets the predecessor of an already-attached {@link LipokProcessStep}, defining its place in
     * the process chain independently of {@code position}. Rejects self-reference and walks the
     * candidate predecessor's own predecessor chain to reject cycles; {@code null} marks the step
     * as a starting step.
     */
    @Transactional
    public LipokDtos.LipokDto linkProcessStep(String lipokId, Long lipokProcessStepId, LipokDtos.LipokProcessStepLinkDto dto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokProcessStep step = lipok.getProcessSteps().stream()
                .filter(x -> x.getId().equals(lipokProcessStepId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Process step entry not found in this Lipok"));

        if (dto.predecessorId != null) {
            if (dto.predecessorId.equals(lipokProcessStepId)) {
                throw new RuntimeException("A process step cannot be its own predecessor");
            }
            LipokProcessStep predecessor = lipok.getProcessSteps().stream()
                    .filter(x -> x.getId().equals(dto.predecessorId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Predecessor is not part of this Lipok"));

            for (LipokProcessStep cursor = predecessor; cursor != null; cursor = cursor.getPredecessor()) {
                if (cursor.getId().equals(lipokProcessStepId)) {
                    throw new RuntimeException("This predecessor would create a cycle");
                }
            }
            step.setPredecessor(predecessor);
        } else {
            step.setPredecessor(null);
        }

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /**
     * Links a {@link BusinessPartner} as a recipient of an already-attached {@link LipokOutput}.
     * The customer must already be attached to this same Lipok via {@link LipokCustomer}; linking
     * an already-linked customer is a no-op rather than a duplicate/error.
     */
    @Transactional
    public LipokDtos.LipokDto addOutputCustomer(String lipokId, Long lipokOutputId, String customerId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokOutput lo = lipok.getOutputs().stream()
                .filter(x -> x.getId().equals(lipokOutputId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Output entry not found in this Lipok"));
        boolean partOfLipok = lipok.getCustomers().stream()
                .anyMatch(lc -> lc.getCustomer().getId().equals(customerId));
        if (!partOfLipok) throw new RuntimeException("Customer is not part of this Lipok");

        boolean alreadyLinked = lo.getCustomerLinks().stream()
                .anyMatch(link -> link.getCustomer().getId().equals(customerId));
        if (!alreadyLinked) {
            BusinessPartner customer = businessPartnerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            lo.getCustomerLinks().add(new LipokOutputCustomer(lo, customer));
        }

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto removeOutputCustomer(String lipokId, Long lipokOutputId, String customerId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokOutput lo = lipok.getOutputs().stream()
                .filter(x -> x.getId().equals(lipokOutputId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Output entry not found in this Lipok"));
        lo.getCustomerLinks().removeIf(link -> link.getCustomer().getId().equals(customerId));

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /** Detaches a supplier and clears it from any {@link LipokInput} that referenced it as the delivering supplier. */
    @Transactional
    public LipokDtos.LipokDto removeSupplier(String lipokId, String supplierId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getSuppliers().removeIf(ls -> ls.getSupplier().getId().equals(supplierId));
        if (!removed) throw new RuntimeException("Supplier not part of this Lipok");

        // A removed supplier can no longer be referenced as the deliverer of this Lipok's inputs.
        lipok.getInputs().forEach(li -> {
            if (li.getSupplier() != null && li.getSupplier().getId().equals(supplierId)) {
                li.setSupplier(null);
            }
        });

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /** Detaches a customer and removes any {@link LipokOutputCustomer} links that referenced it. */
    @Transactional
    public LipokDtos.LipokDto removeCustomer(String lipokId, String customerId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getCustomers().removeIf(lc -> lc.getCustomer().getId().equals(customerId));
        if (!removed) throw new RuntimeException("Customer not part of this Lipok");

        // A removed customer can no longer receive any of this Lipok's outputs.
        lipok.getOutputs().forEach(lo -> lo.getCustomerLinks().removeIf(link -> link.getCustomer().getId().equals(customerId)));

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto removeInput(String lipokId, String inputId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getInputs().removeIf(li -> li.getInput().getId().equals(inputId));
        if (!removed) throw new RuntimeException("Input not part of this Lipok");

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto removeOutput(String lipokId, String outputId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getOutputs().removeIf(lo -> lo.getOutput().getId().equals(outputId));
        if (!removed) throw new RuntimeException("Output not part of this Lipok");

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /** Assigns the next sequential {@code number} for this Lipok ({@code max(existing) + 1}, starting at 1). */
    @Transactional
    public LipokDtos.LipokDto addComment(String lipokId, LipokDtos.LipokCommentCreateDto dto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        int nextNumber = lipok.getComments().stream().mapToInt(LipokComment::getNumber).max().orElse(0) + 1;
        LipokComment comment = new LipokComment(lipok, nextNumber, dto.content);
        lipok.getComments().add(comment);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto updateComment(String lipokId, Long commentId, LipokDtos.LipokCommentUpdateDto dto) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokComment comment = lipok.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not part of this Lipok"));
        comment.setContent(dto.content);
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    @Transactional
    public LipokDtos.LipokDto removeComment(String lipokId, Long commentId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        boolean removed = lipok.getComments().removeIf(c -> c.getId().equals(commentId));
        if (!removed) throw new RuntimeException("Comment not part of this Lipok");
        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }

    /**
     * Detaches a process step and cascades the cleanup: steps that had it as their predecessor
     * become start steps again, and any input/output that referenced it as the consuming/producing
     * step loses that link.
     */
    @Transactional
    public LipokDtos.LipokDto removeProcessStep(String lipokId, String processStepId) {
        Lipok lipok = lipokRepository.findById(lipokId).orElseThrow(() -> new RuntimeException("Lipok not found"));
        LipokProcessStep target = lipok.getProcessSteps().stream()
                .filter(lp -> lp.getProcessStep().getId().equals(processStepId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("ProcessStep not part of this Lipok"));
        Long targetJoinId = target.getId();

        lipok.getProcessSteps().remove(target);

        // Steps that had this one as their predecessor become start steps again.
        lipok.getProcessSteps().forEach(lp -> {
            if (lp.getPredecessor() != null && lp.getPredecessor().getId().equals(targetJoinId)) {
                lp.setPredecessor(null);
            }
        });
        // Inputs/outputs that referenced this step as their producing/consuming step lose that link.
        lipok.getInputs().forEach(li -> {
            if (li.getProcessStep() != null && li.getProcessStep().getId().equals(processStepId)) {
                li.setProcessStep(null);
            }
        });
        lipok.getOutputs().forEach(lo -> {
            if (lo.getProcessStep() != null && lo.getProcessStep().getId().equals(processStepId)) {
                lo.setProcessStep(null);
            }
        });

        Lipok saved = lipokRepository.save(lipok);
        return LipokMapper.toDetail(saved);
    }
}
