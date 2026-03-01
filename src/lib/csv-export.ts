export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

/**
 * Gera e baixa um arquivo CSV com BOM UTF-8 e separador `;` (Excel pt-BR).
 */
export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  data: T[]
): void {
  const escape = (val: string): string => {
    if (val.includes('"') || val.includes(";") || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const header = columns.map((c) => escape(c.header)).join(";");
  const rows = data.map((row) =>
    columns.map((c) => escape(String(c.accessor(row)))).join(";")
  );
  const csv = [header, ...rows].join("\n");

  // BOM UTF-8 for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
