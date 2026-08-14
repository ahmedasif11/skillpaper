import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ILlmService } from '../../interfaces/ILlmService';
import type { LlmParseInput, LlmParseOutput } from '../../interfaces/types';
import { buildResumeParsePrompt } from '../../services/gemini.prompts';
import { RESUME_JSON_SCHEMA } from '../../services/gemini.schema';

const PRO_MODEL = 'gemini-3.5-flash';
const MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const rec = err as { status?: unknown; statusCode?: unknown };
  if (typeof rec.status === 'number') return rec.status;
  if (typeof rec.statusCode === 'number') return rec.statusCode;
  return undefined;
}

function isRetryable(err: unknown): boolean {
  const status = httpStatus(err);
  return status === 429 || status === 503;
}

function parseJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Empty Gemini response');
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('Invalid JSON from Gemini');
  }
}

export class GeminiLlmAdapter implements ILlmService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly defaultModel: string;

  constructor(config: { apiKey: string; model?: string }) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.model ?? 'gemini-3.5-flash';
  }

  async parseResume(input: LlmParseInput): Promise<LlmParseOutput> {
    const primary = input.preferHigherQuality
      ? PRO_MODEL
      : this.defaultModel;

    try {
      return await this.generateWithRetries(primary, input.rawText);
    } catch (err) {
      const invalid =
        err instanceof Error &&
        (err.message === 'Empty Gemini response' ||
          err.message === 'Invalid JSON from Gemini');
      if (primary !== PRO_MODEL && invalid) {
        return this.generateWithRetries(PRO_MODEL, input.rawText);
      }
      throw err;
    }
  }

  private async generateWithRetries(
    modelName: string,
    rawText: string
  ): Promise<LlmParseOutput> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await this.callModel(modelName, rawText);
      } catch (err) {
        lastError = err;
        if (
          err instanceof Error &&
          (err.message === 'Empty Gemini response' ||
            err.message === 'Invalid JSON from Gemini')
        ) {
          throw err;
        }
        if (!isRetryable(err) || attempt === MAX_ATTEMPTS) {
          throw err;
        }
        const status = httpStatus(err);
        const waitMs = status === 429 ? 5000 : 1000 * 2 ** (attempt - 1);
        await sleep(waitMs);
      }
    }
    throw lastError;
  }

  private async callModel(
    modelName: string,
    rawText: string
  ): Promise<LlmParseOutput> {
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESUME_JSON_SCHEMA,
      },
    });
    const result = await model.generateContent(
      buildResumeParsePrompt(rawText)
    );
    const jsonText = result.response.text();
    return {
      data: parseJsonPayload(jsonText),
      model: modelName,
      rawResponseText: jsonText,
    };
  }
}
