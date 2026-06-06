export interface Item {
  kodeBarang: string;
  namaBarang: string;
  banyak: string;
  jumlah: string;
}

export function parseTableItems(markdown: string): Item[] {
  const items: Item[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
  let match;
  while ((match = tableRegex.exec(markdown)) !== null) {
    const tableHtml = match[1];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let trMatch;
    let rowIndex = 0;
    let kIdx = 0;
    let nIdx = 1;
    let bIdx = 2;
    let jIdx = 3;
    let isItemsTable = false;

    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const rowHtml = trMatch[1];
      if (rowIndex === 0) {
        // Parse header row
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        let tdMatch;
        const headerCells: string[] = [];
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
          headerCells.push(tdMatch[1].replace(/<[^>]*>/g, "").trim().toLowerCase());
        }

        const foundKode = headerCells.findIndex(h => h.includes("kode") || h.includes("item code"));
        const foundNama = headerCells.findIndex(h => h.includes("nama") || h.includes("item name") || h.includes("description"));
        const foundBanyak = headerCells.findIndex(h => h.includes("banyak") || h.includes("qty") || h.includes("quantity"));
        const foundJumlah = headerCells.findIndex(h => h.includes("jumlah") || h.includes("total"));

        if (foundKode !== -1 || foundNama !== -1) {
          isItemsTable = true;
          kIdx = foundKode !== -1 ? foundKode : 0;
          nIdx = foundNama !== -1 ? foundNama : 1;
          bIdx = foundBanyak !== -1 ? foundBanyak : 2;
          jIdx = foundJumlah !== -1 ? foundJumlah : 3;
        }
      } else {
        if (isItemsTable) {
          const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
          let tdMatch;
          const cells: string[] = [];
          while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
            // Normalize literal \n text if returned as literal string "\n"
            const cellText = tdMatch[1].replace(/<[^>]*>/g, "").trim().replace(/\\n/g, "\n");
            cells.push(cellText);
          }
          if (cells.length >= 3) {
            const kodeCell = cells[kIdx] || "";
            const namaCell = cells[nIdx] || "";
            let banyakCell = "";
            let jumlahCell = "";

            // Check if there is an extra column before banyak that we should merge with banyak
            if (bIdx > 2 && bIdx - 1 !== nIdx && bIdx - 1 !== kIdx) {
              const qtyCell = cells[bIdx - 1] || "";
              const unitCell = cells[bIdx] || "";

              const qtyLines = qtyCell.split("\n").map(l => l.trim());
              const unitLines = unitCell.split("\n").map(l => l.trim());
              const combinedLines: string[] = [];
              const maxQLen = Math.max(qtyLines.length, unitLines.length);
              for (let idx = 0; idx < maxQLen; idx++) {
                const q = qtyLines[idx] || "";
                const u = unitLines[idx] || "";
                combinedLines.push(`${q} ${u}`.trim());
              }
              banyakCell = combinedLines.join("\n");
            } else {
              banyakCell = cells[bIdx] || "";
            }

            if (jIdx !== -1) {
              jumlahCell = cells[jIdx] || "";
            } else {
              if (cells.length === 5 && bIdx === 3) {
                jumlahCell = cells[4] || "";
              } else {
                jumlahCell = cells[3] || "";
              }
            }

            // Split cell contents by newlines to support combined rows
            const kodeParts = kodeCell.split("\n").map(p => p.trim()).filter(Boolean);
            const namaParts = namaCell.split("\n").map(p => p.trim()).filter(Boolean);
            const banyakParts = banyakCell.split("\n").map(p => p.trim()).filter(Boolean);
            const jumlahParts = jumlahCell.split("\n").map(p => p.trim()).filter(Boolean);

            const isWatermark = (s: string) => {
              const sl = s.toLowerCase();
              return (
                sl === "asli" ||
                sl === "copy" ||
                sl === "nama barang" ||
                sl === "tanda tangan supir" ||
                sl === "penerima barang" ||
                sl === "barang dikirim dalam keadaan baik" ||
                sl === "jumlah"
              );
            };

            // Filter watermark keywords from each parts array
            const cleanKodes = kodeParts.filter(p => !isWatermark(p));
            const cleanNamas = namaParts.filter(p => !isWatermark(p));
            let cleanBanyaks = banyakParts.filter(p => !isWatermark(p));
            const cleanJumlahs = jumlahParts.filter(p => !isWatermark(p));

            if (cleanBanyaks.length === 2 * cleanKodes.length) {
              const halved: string[] = [];
              const half = cleanKodes.length;
              for (let i = 0; i < half; i++) {
                const qty = cleanBanyaks[i] || "";
                const unit = cleanBanyaks[i + half] || "";
                halved.push(`${qty} ${unit}`.trim());
              }
              cleanBanyaks = halved;
            }

            const maxLen = Math.max(cleanKodes.length, cleanNamas.length, cleanBanyaks.length, cleanJumlahs.length);

            for (let i = 0; i < maxLen; i++) {
              const k = cleanKodes[i] || "";
              const n = cleanNamas[i] || "";
              let b = cleanBanyaks[i] || "";
              const j = cleanJumlahs[i] || "";

              if (isWatermark(k) || isWatermark(n)) {
                continue;
              }

              // Clean checkmarks and extra spaces from banyak
              b = b.replace(/[✓☑]/g, "").replace(/\s+/g, " ").trim();

              // Autocomplete packaging units if Banyak is purely numeric
              if (b && /^\d+$/.test(b)) {
                const code = k.trim();
                const name = n.toLowerCase();
                if (code === "11310024" || name.includes("griller")) {
                  b = `${b} KRG`;
                } else if (code === "11640053" || name.includes("bone in leg") || name.includes("pack")) {
                  b = `${b} BAG`;
                }
              }

              // Validate kodeBarang: must not be blank and must match exactly 8 digits
              const cleanKode = k.trim();
              if (cleanKode === "" || !/^\d{8}$/.test(cleanKode)) {
                continue;
              }

              items.push({
                kodeBarang: k,
                namaBarang: n,
                banyak: b,
                jumlah: j
              });
            }
          }
        }
      }
      rowIndex++;
    }
  }
  return items;
}
