import net from 'net';
import axios from 'axios';
import type { IScannerService } from '../../interfaces/IScannerService';
import type {
  ResumeMime,
  ScanFinding,
  ScanResult,
} from '../../interfaces/types';

export interface ClamavScannerConfig {
  host: string;
  port: number;
  opencvBaseUrl?: string;
  timeoutMs?: number;
}

const OPENCV_BLOCK_SCORE = 0.8;
const OPENCV_WARN_SCORE = 0.5;

interface OpenCvScanResponse {
  safe?: boolean;
  score?: number;
  findings?: string[];
}

export class ClamavScannerAdapter implements IScannerService {
  constructor(private readonly config: ClamavScannerConfig) {}

  async scan(params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ScanResult> {
    const clam = await this.scanClamav(params.buffer);
    if (!clam.safe) {
      return clam;
    }

    if (params.mimeType !== 'application/pdf') {
      return clam;
    }

    const opencv = await this.scanOpenCv(params.buffer, params.mimeType);
    if (!opencv) {
      return clam;
    }

    const findings: ScanFinding[] = [...clam.findings, ...opencv.findings];
    if (!opencv.safe) {
      return {
        safe: false,
        engine: 'composite',
        score: opencv.score,
        findings,
      };
    }

    return {
      safe: true,
      engine: 'composite',
      score: opencv.score,
      findings,
    };
  }

  private async scanClamav(buffer: Buffer): Promise<ScanResult> {
    const reply = await this.instream(buffer);
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

  private async scanOpenCv(
    buffer: Buffer,
    mimeType: ResumeMime
  ): Promise<ScanResult | null> {
    const baseUrl = this.config.opencvBaseUrl;
    if (!baseUrl) {
      return null;
    }

    try {
      const { data } = await axios.post<OpenCvScanResponse>(
        `${baseUrl.replace(/\/$/, '')}/scan-images`,
        {
          file_base64: buffer.toString('base64'),
          mime_type: mimeType,
        },
        { timeout: this.config.timeoutMs ?? 15000 }
      );

      const score = typeof data.score === 'number' ? data.score : 0;
      const rawFindings = Array.isArray(data.findings) ? data.findings : [];
      const findings: ScanFinding[] = rawFindings.map((message) => ({
        code: 'OPENCV',
        message,
        severity: score >= OPENCV_BLOCK_SCORE ? 'high' : 'medium',
      }));

      if (score >= OPENCV_BLOCK_SCORE) {
        console.warn('OpenCV high-risk finding', { score, findings: rawFindings });
        return { safe: false, engine: 'opencv', score, findings };
      }

      if (score >= OPENCV_WARN_SCORE || rawFindings.length > 0) {
        console.warn('OpenCV suspicious finding; continuing', {
          score,
          findings: rawFindings,
        });
      }

      return { safe: true, engine: 'opencv', score, findings };
    } catch (err) {
      console.warn(
        'OpenCV service unavailable; continuing without image scan',
        err
      );
      return null;
    }
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
