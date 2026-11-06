// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.service;

import de.itsfullofstars.sipoc.server.model.Go;
import de.itsfullofstars.sipoc.server.model.Lipok;
import de.itsfullofstars.sipoc.server.model.LipokGo;
import de.itsfullofstars.sipoc.server.repository.LipokRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

/** Renders one or all {@link Lipok}s as Markdown for the {@code /api/lipoks/export} endpoints. */
@Service
public class LipokExportService {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm:ss").withZone(ZoneId.systemDefault());

    @Autowired
    private LipokRepository lipokRepository;

    @Transactional(readOnly = true)
    public Optional<Lipok> findById(String id) {
        return lipokRepository.findById(id);
    }

    /**
     * Builds every Lipok's Markdown export within a single transaction, keyed by filename.
     * Loading the list and walking each Lipok's lazy collections (gos, suppliers, inputs,
     * process steps, outputs, customers) must happen in the same Hibernate session â€” doing
     * it across two separate {@code @Transactional} calls (e.g. findAll() then buildMarkdown()
     * per entity from the caller) leaves the entities detached by the time buildMarkdown runs,
     * causing a LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public Map<String, String> exportAllMarkdown() {
        Map<String, String> filenameToContent = new LinkedHashMap<>();
        for (Lipok lipok : lipokRepository.findAll()) {
            filenameToContent.put(buildFileName(lipok), buildMarkdown(lipok));
        }
        return filenameToContent;
    }

    public String buildFileName(Lipok lipok) {
        String safeName = lipok.getName() == null ? "" : lipok.getName()
                .replaceAll("[\\\\/:*?\"<>|]", "_")
                .replaceAll("\\s+", "_");
        return lipok.getId() + "_" + safeName + ".md";
    }

    @Transactional(readOnly = true)
    public Optional<String> generateMarkdownExport(String id) {
        return lipokRepository.findById(id)
                .map(lipok -> buildMarkdown(lipok)); // Lazy Loading von gos, customers etc. funktioniert hier jetzt blind!
    }
    
    @Transactional(readOnly = true)
    public String buildMarkdown(Lipok lipok) {
        StringBuilder sb = new StringBuilder();

        sb.append("# ").append(nullToEmpty(lipok.getName())).append("\n\n");
        sb.append(lipok.getId()).append(" ").append(nullToEmpty(lipok.getName())).append("\n\n");
        sb.append(nullToEmpty(lipok.getDescription())).append("\n\n");

        sb.append("## Metadaten\n\n");
        sb.append("| ersteller | datum | uhrzeit |\n");
        sb.append("| --- | --- | --- |\n");
        sb.append("| ").append(nullToEmpty(lipok.getCreatedBy())).append(" | ")
                .append(formatDate(lipok.getCreatedAt())).append(" | ")
                .append(formatTime(lipok.getCreatedAt())).append(" |\n\n");

        sb.append("| Ã¤nderer | datum | uhrzeit |\n");
        sb.append("| --- | --- | --- |\n");
        sb.append("| ").append(nullToEmpty(lipok.getUpdatedBy())).append(" | ")
                .append(formatDate(lipok.getUpdatedAt())).append(" | ")
                .append(formatTime(lipok.getUpdatedAt())).append(" |\n\n");

        sb.append("## GeschÃ¤ftsobjekt\n\n");
        sb.append("| GeschÃ¤ftsobjekt | Beschreibung |\n");
        sb.append("| --- | --- |\n");
        if (lipok.getGos().isEmpty()) {
            sb.append("| - | - |\n");
        } else {
            for (LipokGo lg : lipok.getGos()) {
                Go go = lg.getGo();
                sb.append("| ").append(nullToEmpty(go.getName())).append(" | ")
                        .append(nullToEmpty(go.getDescription())).append(" |\n");
            }
        }
        sb.append("\n");

        sb.append("## LIPOK\n\n");
        sb.append("| Lieferant | Input | Prozess | Output | Kunde |\n");
        sb.append("| --- | --- | --- | --- | --- |\n");

        List<String> suppliers = names(lipok.getSuppliers(), ls -> ls.getSupplier().getName());
        List<String> inputs = names(lipok.getInputs(), li -> li.getInput().getName());
        List<String> processSteps = names(lipok.getProcessSteps(), lp -> lp.getProcessStep().getName());
        List<String> outputs = names(lipok.getOutputs(), lo -> lo.getOutput().getName());
        List<String> customers = names(lipok.getCustomers(), lc -> lc.getCustomer().getName());

        int maxRows = Math.max(suppliers.size(), Math.max(inputs.size(),
                Math.max(processSteps.size(), Math.max(outputs.size(), customers.size()))));

        for (int i = 0; i < maxRows; i++) {
            sb.append("| ").append(get(suppliers, i)).append(" | ")
                    .append(get(inputs, i)).append(" | ")
                    .append(get(processSteps, i)).append(" | ")
                    .append(get(outputs, i)).append(" | ")
                    .append(get(customers, i)).append(" |\n");
        }

        return sb.toString();
    }

    private <T> List<String> names(List<T> list, Function<T, String> nameFn) {
        List<String> result = new ArrayList<>();
        for (T item : list) result.add(nameFn.apply(item));
        return result;
    }

    private String get(List<String> list, int index) {
        return index < list.size() ? nullToEmpty(list.get(index)) : "";
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private String formatDate(Instant instant) {
        return instant == null ? "" : DATE_FORMATTER.format(instant);
    }

    private String formatTime(Instant instant) {
        return instant == null ? "" : TIME_FORMATTER.format(instant);
    }
}
