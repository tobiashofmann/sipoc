// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "node:fs";

/** Minimal RFC4180 CSV parser: handles quoted fields, embedded commas/quotes/newlines. */
export function parseCsv(filePath: string): Record<string, string>[] {
  const text = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  const [header, ...dataRows] = nonEmptyRows;
  return dataRows.map((r) => {
    const record: Record<string, string> = {};
    header.forEach((key, idx) => {
      record[key] = r[idx] ?? "";
    });
    return record;
  });
}
