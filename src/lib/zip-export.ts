/**
 * Minimal ZIP file creator for browser-side project downloads.
 * Implements the ZIP local file header format without external dependencies.
 *
 * ZIP format reference: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 * We use Store method (no compression) which is sufficient for text-based project files.
 */

export interface ZipFile {
  path: string;
  content: string;
}

/** CRC-32 lookup table */
const crcTable: number[] = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function writeUint16LE(value: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  return buf;
}

function writeUint32LE(value: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = value & 0xff;
  buf[1] = (value >> 8) & 0xff;
  buf[2] = (value >> 16) & 0xff;
  buf[3] = (value >> 24) & 0xff;
  return buf;
}

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

/**
 * Create a ZIP file as a Blob from an array of files.
 * Uses Store method (no compression) for simplicity and reliability.
 */
export function createZipBlob(files: ZipFile[], projectName: string): Blob {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  // DOS date/time for "now"
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const file of files) {
    // Prefix all paths with projectName/
    const filePath = `${projectName}/${file.path}`;
    const pathBytes = stringToBytes(filePath);
    const contentBytes = stringToBytes(file.content);
    const crc = crc32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 bytes + filename + file data)
    const localHeader = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // Local file header signature
      writeUint16LE(20),                          // Version needed to extract (2.0)
      writeUint16LE(0),                           // General purpose bit flag
      writeUint16LE(0),                           // Compression method (Store)
      writeUint16LE(dosTime),                     // Last mod file time
      writeUint16LE(dosDate),                     // Last mod file date
      writeUint32LE(crc),                         // CRC-32
      writeUint32LE(size),                        // Compressed size
      writeUint32LE(size),                        // Uncompressed size
      writeUint16LE(pathBytes.length),            // File name length
      writeUint16LE(0),                           // Extra field length
      pathBytes,                                  // File name
      contentBytes,                               // File data
    ]);

    localHeaders.push(localHeader);

    // Central directory file header (46 bytes + filename)
    const centralHeader = concatBuffers([
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // Central directory signature
      writeUint16LE(20),                          // Version made by
      writeUint16LE(20),                          // Version needed to extract
      writeUint16LE(0),                           // General purpose bit flag
      writeUint16LE(0),                           // Compression method (Store)
      writeUint16LE(dosTime),                     // Last mod file time
      writeUint16LE(dosDate),                     // Last mod file date
      writeUint32LE(crc),                         // CRC-32
      writeUint32LE(size),                        // Compressed size
      writeUint32LE(size),                        // Uncompressed size
      writeUint16LE(pathBytes.length),            // File name length
      writeUint16LE(0),                           // Extra field length
      writeUint16LE(0),                           // File comment length
      writeUint16LE(0),                           // Disk number start
      writeUint16LE(0),                           // Internal file attributes
      writeUint32LE(0),                           // External file attributes
      writeUint32LE(offset),                      // Relative offset of local header
      pathBytes,                                  // File name
    ]);

    centralHeaders.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of central directory record (22 bytes)
  const endRecord = concatBuffers([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // End of central directory signature
    writeUint16LE(0),                           // Number of this disk
    writeUint16LE(0),                           // Disk where central directory starts
    writeUint16LE(files.length),                // Number of central directory records on this disk
    writeUint16LE(files.length),                // Total number of central directory records
    writeUint32LE(centralDirSize),              // Size of central directory
    writeUint32LE(centralDirOffset),            // Offset of start of central directory
    writeUint16LE(0),                           // Comment length
  ]);

  const zipData = concatBuffers([
    ...localHeaders,
    ...centralHeaders,
    endRecord,
  ]);

  return new Blob([zipData.buffer as ArrayBuffer], { type: "application/zip" });
}

/**
 * Download a project as a ZIP file.
 */
export function downloadZip(files: ZipFile[], projectName: string): void {
  const blob = createZipBlob(files, projectName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Fallback: download project as a single bundled text file.
 * Each file is separated by a clear header showing the file path.
 */
export function downloadProjectAsBundle(
  files: { path: string; content: string }[],
  projectName: string
): void {
  const separator = "=".repeat(60);
  const bundle = files
    .map(
      (f) =>
        `${separator}\n// FILE: ${f.path}\n${separator}\n\n${f.content}\n`
    )
    .join("\n");

  const blob = new Blob([bundle], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName}-bundle.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
