# Beschaffungsprozess

f64e5850-91ac-48c5-beb6-a1c834cbeb5f Beschaffungsprozess

SIPOC für den Procure-to-Pay-Prozess

## Metadaten

| ersteller | datum | uhrzeit |
| --- | --- | --- |
| system | 02.08.2026 | 12:23:20 |

| änderer | datum | uhrzeit |
| --- | --- | --- |
| system | 02.08.2026 | 12:23:20 |

## Geschäftsobjekt

| Geschäftsobjekt | Beschreibung |
| --- | --- |
| Einkaufsvertrag | Vertrag für Einkauf |
| Bestellvertrag | Vertrag für Bestellungen |
| Materialbom | Materialbezogene BOM |

## LIPOK

| Lieferant | Input | Prozess | Output | Kunde |
| --- | --- | --- | --- | --- |
| Lieferant A | Bestellanforderung | Bedarf ermitteln | Bestellbestätigung | Kunde 1 |
| Lieferant B | Lieferschein | Bestellung erstellen | Wareneingangsbestätigung | Kunde 2 |
| Lieferant C | Rechnung | Wareneingang prüfen | Zahlungsavis | Abteilung Einkauf |
| Abteilung Einkauf |  | Rechnung prüfen |  |  |
|  |  | Zahlung freigeben |  |  |
