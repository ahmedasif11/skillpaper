// Use the CJS browser build — the package root entry uses require.extensions (unsupported by webpack).
import Handlebars from 'handlebars/dist/cjs/handlebars.js';

/**
 * Compile Handlebars resume HTML with flat template data (same approach as backend PDF).
 */
export function compileTemplateHtml(
  html: string,
  data: Record<string, unknown>
): string {
  return Handlebars.compile(html)(data);
}
