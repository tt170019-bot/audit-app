# Keep TOPS Excel export result-only, no Maturity Assessment columns

`exportTopsChecklistExcel` produces a file meant to be re-uploaded into the external TOPS system's bulk-registration import, which expects exactly the 12 columns in `getTopsChecklistHeaders()` (ITEM through Comments) — extra or reordered columns fail that import. `exportExcel`'s 점검결과 sheet and the Word/PDF Type-2 report both render 0–N Maturity Scale columns/tables per item, and it was tempting to give TOPS Excel the same treatment. That's not viable here: the sheet TOPS accepts can't carry the extra columns, and a second, unimported reference sheet in the same workbook would just duplicate what `exportExcel` and Word/PDF Type-2 already show, under a filename that implies it's TOPS-importable.

TOPS Excel stays permanently result-only (S/U-S/N-A/N-O/OBS + Comments). Maturity Assessment results are only ever exported via `exportExcel` and the Word/PDF Type-2 report.

## Status

Accepted
