export function resumeOwnerId(userField: unknown): string {
  if (userField && typeof userField === 'object' && '_id' in userField) {
    return String((userField as { _id: unknown })._id);
  }
  return String(userField);
}

export function isResumeOwner(
  resume: { user: unknown },
  userId: string
): boolean {
  return resumeOwnerId(resume.user) === String(userId);
}
