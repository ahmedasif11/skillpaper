import type { LlmParseInput, LlmParseOutput } from './types';

export interface ILlmService {
  parseResume(input: LlmParseInput): Promise<LlmParseOutput>;
}
