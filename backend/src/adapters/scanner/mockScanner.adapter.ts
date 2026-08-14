import type { IScannerService } from '../../interfaces/IScannerService';
import type { ResumeMime, ScanResult } from '../../interfaces/types';

const EICAR_MARKER = 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE';

export class MockScannerAdapter implements IScannerService {
  async scan(params: {
    buffer: Buffer;
    mimeType: ResumeMime;
  }): Promise<ScanResult> {
    const text = params.buffer.toString('utf8');
    const infected = text.includes(EICAR_MARKER) || text.includes('EICAR');
    if (infected) {
      return {
        safe: false,
        engine: 'mock',
        findings: [
          {
            code: 'EICAR',
            message: 'EICAR test signature detected',
            severity: 'high',
          },
        ],
      };
    }
    return { safe: true, engine: 'mock', findings: [] };
  }
}
