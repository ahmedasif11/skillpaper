export type ExtractErrorCode =
  | 'encrypted_pdf'
  | 'unreadable_pdf'
  | 'no_extractable_text';

export class ExtractError extends Error {
  readonly code: ExtractErrorCode;

  constructor(code: ExtractErrorCode, message: string) {
    super(message);
    this.name = 'ExtractError';
    this.code = code;
  }
}

export function isExtractError(err: unknown): err is ExtractError {
  return err instanceof ExtractError;
}
