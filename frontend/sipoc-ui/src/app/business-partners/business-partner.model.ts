export interface AuditDto {
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LinkedInputDto {
  id: string;
  name: string;
}

export interface LinkedEntryDto {
  id: string;
  name: string;
}

export interface LipokUsageDto {
  lipokId: string;
  lipokName: string;
  /** Populated when this partner is attached as the supplier in this Lipok. */
  inputs?: LinkedEntryDto[];
  /** Populated when this partner is attached as the customer in this Lipok — can be non-empty at the same time as `inputs` if the partner plays both roles in this same Lipok. */
  outputs?: LinkedEntryDto[];
}

export interface BusinessPartnerListItem {
  id: string;
  name: string;
  updatedAt: string;
}

export interface BusinessPartner {
  id: string;
  name: string;
  description: string | null;
  audit: AuditDto | null;
  inputs?: LinkedInputDto[];
  lipokUsages?: LipokUsageDto[];
}

export interface BusinessPartnerCreate {
  name: string;
  description?: string | null;
}

export interface BusinessPartnerUpdate {
  name: string;
  description?: string | null;
}

/** Generic Spring Data page shape, re-exported from here and imported by the other feature models too. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
