export const DRAFT_APPROVAL = { published: false, reviewed_at: null };

export function publishUpdate() {
  return { $set: { "approval.published": true, "approval.reviewed_at": new Date() } };
}
