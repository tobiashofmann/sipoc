// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the reorder endpoints backing drag-and-drop reordering of Lipok tiles
 * (suppliers/inputs/outputs/customers) â€” there was previously no way to change the position
 * of an already-attached entity, only to append new ones.
 */
@SpringBootTest
@AutoConfigureMockMvc
class LipokReorderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void reorderSuppliers_movesTileToNewPosition() throws Exception {
        String lipokId = createLipok("Reorder Suppliers Lipok");
        String partnerA = createBusinessPartner("Partner A");
        String partnerB = createBusinessPartner("Partner B");
        attach(lipokId, "suppliers", partnerA);
        attach(lipokId, "suppliers", partnerB);

        assertOrder(getLipok(lipokId).get("suppliers"), partnerA, partnerB);

        reorder(lipokId, "suppliers", List.of(partnerB, partnerA)).andExpect(status().isOk());

        assertOrder(getLipok(lipokId).get("suppliers"), partnerB, partnerA);
    }

    @Test
    void reorderSuppliers_rejectsIdsNotMatchingCurrentAttachment() throws Exception {
        String lipokId = createLipok("Reorder Reject Lipok");
        String partnerA = createBusinessPartner("Partner A2");
        attach(lipokId, "suppliers", partnerA);

        reorder(lipokId, "suppliers", List.of("does-not-exist")).andExpect(status().isBadRequest());
        reorder(lipokId, "suppliers", List.of(partnerA, partnerA)).andExpect(status().isBadRequest());
    }

    @Test
    void reorderInputsOutputsCustomers_movesTilesToNewPosition() throws Exception {
        String lipokId = createLipok("Reorder Inputs Outputs Customers Lipok");
        String inputA = createInput("Input A");
        String inputB = createInput("Input B");
        String outputA = createOutput("Output A");
        String outputB = createOutput("Output B");
        String customerA = createBusinessPartner("Customer A");
        String customerB = createBusinessPartner("Customer B");

        attach(lipokId, "inputs", inputA);
        attach(lipokId, "inputs", inputB);
        attach(lipokId, "outputs", outputA);
        attach(lipokId, "outputs", outputB);
        attach(lipokId, "customers", customerA);
        attach(lipokId, "customers", customerB);

        reorder(lipokId, "inputs", List.of(inputB, inputA)).andExpect(status().isOk());
        reorder(lipokId, "outputs", List.of(outputB, outputA)).andExpect(status().isOk());
        reorder(lipokId, "customers", List.of(customerB, customerA)).andExpect(status().isOk());

        JsonNode lipok = getLipok(lipokId);
        assertOrder(lipok.get("inputs"), inputB, inputA);
        assertOrder(lipok.get("outputs"), outputB, outputA);
        assertOrder(lipok.get("customers"), customerB, customerA);
    }

    private void assertOrder(JsonNode array, String... expectedIds) {
        assertEquals(expectedIds.length, array.size());
        for (int i = 0; i < expectedIds.length; i++) {
            assertEquals(expectedIds[i], array.get(i).get("id").asText());
        }
    }

    private org.springframework.test.web.servlet.ResultActions reorder(String lipokId, String segment, List<String> orderedIds) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("orderedIds", orderedIds));
        return mockMvc.perform(patch("/api/lipoks/{lipokId}/{segment}/reorder", lipokId, segment)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String createLipok(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", name));
        String response = mockMvc.perform(post("/api/lipoks").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String createBusinessPartner(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", name));
        String response = mockMvc.perform(post("/api/business-partners").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String createInput(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", name, "type", "TEXT"));
        String response = mockMvc.perform(post("/api/inputs").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String createOutput(String name) throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", name, "type", "TEXT"));
        String response = mockMvc.perform(post("/api/outputs").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private void attach(String lipokId, String segment, String entityId) throws Exception {
        mockMvc.perform(post("/api/lipoks/{lipokId}/{segment}/{entityId}", lipokId, segment, entityId))
                .andExpect(status().isOk());
    }

    private JsonNode getLipok(String lipokId) throws Exception {
        String response = mockMvc.perform(get("/api/lipoks/{id}", lipokId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }
}

