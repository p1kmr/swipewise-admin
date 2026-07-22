// A newly imported question is always an unpublished Draft (nothing auto-publishes).
export const DRAFT_APPROVAL = { published: false, reviewed_at: null };

// Publishing a question means Status = Active and approval.published = true.
export function publishUpdate() {
  return {
    $set: {
      status: "Active",
      "approval.published": true,
      "approval.reviewed_at": new Date(),
      updatedAt: new Date(),
    },
  };
}

// Any non-Active status transition (Draft / Inactive / Archived) — never serves to end users.
export function statusUpdate(status) {
  return {
    $set: {
      status,
      "approval.published": status === "Active",
      "approval.reviewed_at": new Date(),
      updatedAt: new Date(),
    },
  };
}
