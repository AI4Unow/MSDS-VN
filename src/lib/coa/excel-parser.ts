export async function parseExcelCoa(excelBuffer: Buffer): Promise<{
  parsedData: Record<string, unknown>;
  confidence: number;
}> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(excelBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const params = {
    purity: findParameter(data, ["purity", "assay", "content"]),
    heavyMetals: {
      lead: findParameter(data, ["lead", "pb"]),
      mercury: findParameter(data, ["mercury", "hg"]),
      arsenic: findParameter(data, ["arsenic", "as"]),
      cadmium: findParameter(data, ["cadmium", "cd"]),
    },
    microbial: {
      totalAerobicCount: findParameter(data, ["total aerobic", "tac", "total plate count"]),
      yeastMold: findParameter(data, ["yeast", "mold", "y&m"]),
    },
    residualSolvents: {
      ethanol: findParameter(data, ["ethanol", "alcohol"]),
    },
  };

  return { parsedData: params, confidence: 0.95 };
}

function findParameter(data: unknown[][], keywords: string[]): number | null {
  for (const row of data) {
    const rowStr = row.join(" ").toLowerCase();
    for (const keyword of keywords) {
      if (rowStr.includes(keyword)) {
        for (const cell of row) {
          if (typeof cell === "number") return cell;
          if (typeof cell === "string") {
            const match = cell.match(/[\d.]+/);
            if (match) return parseFloat(match[0]);
          }
        }
      }
    }
  }
  return null;
}
