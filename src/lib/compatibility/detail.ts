export interface CompatibilityProDetail {
  relationshipPattern: string;
  attractionPoint: string;
  conflictPattern: string;
  conversationGuide: string;
  timingAdvice: string;
  thirtyDayPlan: string;
  summary: string;
}

export interface CompatibilityDetailPayload {
  type: "compatibility_detail_v2";
  basic: string;
  pro?: CompatibilityProDetail;
}

export function parseCompatibilityDetail(
  raw: string,
): CompatibilityDetailPayload {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed?.type === "compatibility_detail_v2" &&
      typeof parsed.basic === "string"
    ) {
      return parsed as CompatibilityDetailPayload;
    }
  } catch {
    // Legacy plain-text detail.
  }
  return {
    type: "compatibility_detail_v2",
    basic: raw,
  };
}
