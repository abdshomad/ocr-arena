import { ZipFile } from "./ocrConstants";

export function createZipBlob(files: ZipFile[]): Blob {
  const crcTable: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable.push(c);
  }

  function getCrc32(bytes: Uint8Array): number {
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const parts: Uint8Array[] = [];
  const cdHeaders: Uint8Array[] = [];
  let currentOffset = 0;
  
  const textEncoder = new TextEncoder();

  for (const file of files) {
    const filenameBytes = textEncoder.encode(file.name);
    const contentBytes = textEncoder.encode(file.content);
    const crc = getCrc32(contentBytes);
    
    const lfh = new Uint8Array(30 + filenameBytes.length);
    const lfhView = new DataView(lfh.buffer);
    
    lfhView.setUint32(0, 0x04034b50, true);
    lfhView.setUint16(4, 10, true);
    lfhView.setUint16(6, 0, true);
    lfhView.setUint16(8, 0, true);
    lfhView.setUint16(10, 0, true);
    lfhView.setUint16(12, 0, true);
    lfhView.setUint32(14, crc, true);
    lfhView.setUint32(18, contentBytes.length, true);
    lfhView.setUint32(22, contentBytes.length, true);
    lfhView.setUint16(26, filenameBytes.length, true);
    lfhView.setUint16(28, 0, true);
    lfh.set(filenameBytes, 30);
    
    parts.push(lfh);
    parts.push(contentBytes);
    
    const cdh = new Uint8Array(46 + filenameBytes.length);
    const cdhView = new DataView(cdh.buffer);
    
    cdhView.setUint32(0, 0x02014b50, true);
    cdhView.setUint16(4, 10, true);
    cdhView.setUint16(6, 10, true);
    cdhView.setUint16(8, 0, true);
    cdhView.setUint16(10, 0, true);
    cdhView.setUint16(12, 0, true);
    cdhView.setUint16(14, 0, true);
    cdhView.setUint32(16, crc, true);
    cdhView.setUint32(20, contentBytes.length, true);
    cdhView.setUint32(24, contentBytes.length, true);
    cdhView.setUint16(28, filenameBytes.length, true);
    cdhView.setUint16(30, 0, true);
    cdhView.setUint16(32, 0, true);
    cdhView.setUint16(34, 0, true);
    cdhView.setUint16(36, 0, true);
    cdhView.setUint32(38, 0, true);
    cdhView.setUint32(42, currentOffset, true);
    cdh.set(filenameBytes, 46);
    
    cdHeaders.push(cdh);
    
    currentOffset += lfh.length + contentBytes.length;
  }
  
  const cdOffset = currentOffset;
  let cdSize = 0;
  for (const cdh of cdHeaders) {
    cdSize += cdh.length;
    parts.push(cdh);
  }
  
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);
  
  parts.push(eocd);
  
  return new Blob(parts as any[], { type: "application/zip" });
}
