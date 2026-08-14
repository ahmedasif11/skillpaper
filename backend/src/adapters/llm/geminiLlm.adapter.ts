import type { ILlmService } from '../../interfaces/ILlmService';
import type { LlmParseInput, LlmParseOutput } from '../../interfaces/types';

/** Placeholder until Phase 2 — do not import the Gemini SDK here. */
export class GeminiLlmAdapter implements ILlmService {
  constructor(_config?: { apiKey?: string; model?: string }) {}

  async parseResume(_input: LlmParseInput): Promise<LlmParseOutput> {
    throw new Error(
      'Gemini LLM adapter is not implemented until Phase 2. Set LLM_PROVIDER=mock.'
    );
  }
}
