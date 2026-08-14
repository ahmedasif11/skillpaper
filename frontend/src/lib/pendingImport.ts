const PENDING_IMPORT_KEY = 'skillpaper_pending_uploaded_resume';

export interface PendingImport {
  id: string;
  label: string;
}

export function setPendingImport(pending: PendingImport) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_IMPORT_KEY, JSON.stringify(pending));
}

export function getPendingImport(): PendingImport | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_IMPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id) return parsed as PendingImport;
    return null;
  } catch {
    return null;
  }
}

export function clearPendingImport() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_IMPORT_KEY);
}
