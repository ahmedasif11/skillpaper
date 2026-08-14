import net from 'net';
import type { IScannerService } from '../../interfaces/IScannerService';
import type { ResumeMime, ScanResult } from '../../interfaces/types';

export interface ClamavScannerConfig {
  host: string;
  port: number;
  opencvBaseUrl?: string;
  timeoutMs?: number;
}

/**
 * ClamAV via clamd INSTREAM. OpenCV HTTP is Phase 2 — unused here.
 */
export class ClamavScannerAdapter implements IScannerService {
  constructor(private readonly config: ClamavScannerConfig) {}

  async scan(params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ScanResult> {
    const reply = await this.instream(params.buffer);
    const infected = /FOUND/i.test(reply) && !/OK$/i.test(reply.trim());
    if (infected) {
      return {
        safe: false,
        engine: 'clamav',
        findings: [
          {
            code: 'CLAMAV',
            message: 'Malware signature detected',
            severity: 'high',
          },
        ],
      };
    }
    return { safe: true, engine: 'clamav', findings: [] };
  }

  private instream(buffer: Buffer): Promise<string> {
    const timeoutMs = this.config.timeoutMs ?? 15000;
    return new Promise((resolve, reject) => {
      const socket = net.connect(
        { host: this.config.host, port: this.config.port },
        () => {
          socket.write('zINSTREAM\0');
          const chunkSize = 2048;
          for (let offset = 0; offset < buffer.length; offset += chunkSize) {
            const chunk = buffer.subarray(offset, offset + chunkSize);
            const header = Buffer.alloc(4);
            header.writeUInt32BE(chunk.length, 0);
            socket.write(header);
            socket.write(chunk);
          }
          const end = Buffer.alloc(4);
          end.writeUInt32BE(0, 0);
          socket.write(end);
        }
      );

      const chunks: Buffer[] = [];
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error('ClamAV scan timed out'));
      }, timeoutMs);

      socket.on('data', (data) => chunks.push(Buffer.from(data)));
      socket.on('end', () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
