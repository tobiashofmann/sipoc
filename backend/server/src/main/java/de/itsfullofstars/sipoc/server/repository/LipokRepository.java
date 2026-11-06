// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.Lipok;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LipokRepository extends JpaRepository<Lipok, String> {
    /** Every Lipok that has the given business partner attached as a supplier (used to build "where is this partner used" views). */
    List<Lipok> findDistinctBySuppliers_Supplier_Id(String supplierId);
    /** Every Lipok that has the given business partner attached as a customer. */
    List<Lipok> findDistinctByCustomers_Customer_Id(String customerId);
    /** Every Lipok tagged with the given Go. */
    List<Lipok> findDistinctByGos_Go_Id(String goId);
}

