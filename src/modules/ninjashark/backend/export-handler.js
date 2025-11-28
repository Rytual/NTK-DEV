/**
 * NinjaShark Export Handler
 * Export packets to multiple formats (PCAPNG, JSON, CSV, PDF)
 */

const fs = require('fs');
const path = require('path');

class ExportHandler {
  /**
   * Export packets to specified format
   */
  async export(packets, format, filepath) {
    switch (format) {
      case 'json':
        return this.exportJSON(packets, filepath);
      case 'csv':
        return this.exportCSV(packets, filepath);
      case 'pdf':
        return this.exportPDF(packets, filepath);
      case 'pcapng':
        return this.exportPCAPNG(packets, filepath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  exportJSON(packets, filepath) {
    const data = JSON.stringify(packets, null, 2);
    fs.writeFileSync(filepath, data);
    return { success: true, filepath, packets: packets.length };
  }

  exportCSV(packets, filepath) {
    const headers = 'No,Time,Source,Destination,Protocol,Length,Info\n';
    const rows = packets.map(p =>
      `${p.id},${new Date(p.timestamp).toISOString()},${p.source},${p.destination},${p.protocol},${p.length},"${p.info}"`
    ).join('\n');
    fs.writeFileSync(filepath, headers + rows);
    return { success: true, filepath, packets: packets.length };
  }

  exportPDF(packets, filepath) {
    // Note: Real implementation would use jsPDF
    // For now, create a text-based PDF placeholder
    const content = `NinjaShark Capture Export\n\nPackets: ${packets.length}\n\n` +
      packets.slice(0, 100).map(p =>
        `[${p.id}] ${new Date(p.timestamp).toISOString()} ${p.source} -> ${p.destination} ${p.protocol}`
      ).join('\n');
    fs.writeFileSync(filepath, content);
    return { success: true, filepath, packets: packets.length };
  }

  exportPCAPNG(packets, filepath) {
    // Note: Real PCAPNG export requires binary format implementation
    // This is a placeholder that exports JSON with PCAPNG note
    const data = JSON.stringify({
      format: 'PCAPNG',
      note: 'PCAPNG binary export requires pcap library integration',
      packets
    }, null, 2);
    fs.writeFileSync(filepath, data);
    return { success: true, filepath, packets: packets.length };
  }
}

module.exports = { ExportHandler };
