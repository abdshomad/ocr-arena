import { Pool } from "pg";

export async function seedSampleData(pool: Pool) {
  try {
    const countRes = await pool.query("SELECT COUNT(*) FROM documents");
    const count = parseInt(countRes.rows[0].count, 10);
    if (count > 0) {
      return;
    }

    console.log("Database is empty. Seeding sample scans into documents...");

    const sampleScans = [
      {
        filename: "vl1_6_1.png",
        size: 544549,
        engine: "paddle",
        upload_offset_days: 0, // Today
        vendor: "Global Tech Solutions Inc., Silicon Valley, CA",
        customer: "Acme Corporates Ltd, Manhattan, NY",
        items: [
          { kodeBarang: "81000001", namaBarang: "Laptop Pro 16-inch", banyak: "5 units", jumlah: "5" },
          { kodeBarang: "81000002", namaBarang: "Ergonomic Office Chair", banyak: "10 units", jumlah: "10" }
        ],
        ocrText: "INVOICE\nGlobal Tech Solutions Inc.\nBill To: Acme Corporates Ltd\nItems:\n1. 81000001 - Laptop Pro 16-inch - 5 units\n2. 81000002 - Ergonomic Office Chair - 10 units",
        latency_ms: 1250
      },
      {
        filename: "vl1_6_2.png",
        size: 402449,
        engine: "deepseek",
        upload_offset_days: 1, // Yesterday
        vendor: "Global Tech Solutions Inc., Silicon Valley, CA",
        customer: "Acme Corporates Ltd, Manhattan, NY",
        items: [
          { kodeBarang: "81000003", namaBarang: "Cloud Database Subscription", banyak: "1 month", jumlah: "1" }
        ],
        ocrText: "INVOICE\nGlobal Tech Solutions Inc.\nBill To: Acme Corporates Ltd\nItems:\n1. 81000003 - Cloud Database Subscription - 1 month",
        latency_ms: 1850
      },
      {
        filename: "vl1_6_3.png",
        size: 534749,
        engine: "glm",
        upload_offset_days: 4, // 4 days ago
        vendor: "Global Tech Solutions Inc., Silicon Valley, CA",
        customer: "Acme Corporates Ltd, Manhattan, NY",
        items: [
          { kodeBarang: "81000004", namaBarang: "Enterprise IDE License", banyak: "15 units", jumlah: "15" },
          { kodeBarang: "81000005", namaBarang: "Team Collaboration Tool", banyak: "25 units", jumlah: "25" }
        ],
        ocrText: "INVOICE\nGlobal Tech Solutions Inc.\nBill To: Acme Corporates Ltd\nItems:\n1. 81000004 - Enterprise IDE License - 15 units\n2. 81000005 - Team Collaboration Tool - 25 units",
        latency_ms: 1540
      }
    ];

    for (const scan of sampleScans) {
      const uploadTime = new Date();
      uploadTime.setDate(uploadTime.getDate() - scan.upload_offset_days);

      const metadata = {
        vendor: scan.vendor,
        customer: scan.customer,
        currency: "USD",
        items: scan.items
      };

      const layoutResult = {
        layoutParsingResults: [
          {
            markdown: {
              text: scan.ocrText
            }
          }
        ]
      };

      const docInsert = await pool.query(`
        INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        scan.filename,
        uploadTime,
        scan.size,
        true,
        JSON.stringify(metadata),
        JSON.stringify(layoutResult),
        false,
        scan.engine,
        new Date(uploadTime.getTime() - scan.latency_ms),
        uploadTime,
        scan.latency_ms
      ]);

      const docId = docInsert.rows[0].id;

      // No need to seed into ocr_items table

      // Seed an arena run entry so the latency query fetches the latency successfully
      await pool.query(`
        INSERT INTO arena_runs (image_path, engine, status, ocr_result, time_elapsed_ms, created_at, start_time, end_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        scan.filename,
        scan.engine,
        "done",
        scan.ocrText,
        scan.latency_ms,
        uploadTime,
        new Date(uploadTime.getTime() - scan.latency_ms),
        uploadTime
      ]);
    }

    console.log("Database seeded successfully with 3 non-poultry historical scans.");
  } catch (seedErr) {
    console.error("Failed to seed sample scan history:", seedErr);
  }
}
