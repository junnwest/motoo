/**
 * Trust grading. Grades are ALWAYS words — never a number, letter, or score/100
 * (spec §6). A numeric score invites gaming and implies precision the data lacks.
 *
 * The five graded areas map to the Trust Report sections (spec §6):
 *   fanSupport · fanLoyalty · execution · growth · sponsorReadiness (overall)
 */

export type Grade = "Emerging" | "Strong" | "Excellent";

export const GRADES: Grade[] = ["Emerging", "Strong", "Excellent"];

export interface TrustMetrics {
  fanSupport: {
    totalBackers: number;
    averageBackingKrw: number;
    recurringRate: number; // 0..1
  };
  fanLoyalty: {
    coreFanCount: number;
    publicBackerRatio: number; // 0..1
    messageRate: number; // 0..1
    updateResponseRate: number; // 0..1
  };
  execution: {
    // Derived from PerkDelivery rows, NOT Perk.status (invariant, §7).
    perkFulfillmentRate: number; // 0..1
    updateFrequencyPerMonth: number;
    overduePerkCount: number;
  };
  growth: {
    followerGrowth: number; // 0..1 (period-over-period)
    avgViewerGrowth: number; // 0..1
    communityGrowth: number; // 0..1
  };
}

export interface TrustGrades {
  fanSupport: Grade;
  fanLoyalty: Grade;
  execution: Grade;
  growth: Grade;
  sponsorReadiness: Grade;
}

/** Map a 0..1 (or count) signal to a grade via two thresholds. */
function gradeFromThresholds(
  value: number,
  strongAt: number,
  excellentAt: number,
): Grade {
  if (value >= excellentAt) return "Excellent";
  if (value >= strongAt) return "Strong";
  return "Emerging";
}

const GRADE_RANK: Record<Grade, number> = {
  Emerging: 0,
  Strong: 1,
  Excellent: 2,
};

export function gradeRank(g: Grade): number {
  return GRADE_RANK[g];
}

/**
 * Compute grades from metrics. Used at Trust Report generation and for the
 * readiness signal on Explore/profile. Thresholds are deliberate and coarse —
 * the point is a credible band, not a precise score.
 */
export function computeGrades(m: TrustMetrics): TrustGrades {
  const fanSupport = gradeFromThresholds(m.fanSupport.recurringRate, 0.25, 0.4);
  const fanLoyalty = gradeFromThresholds(m.fanLoyalty.publicBackerRatio, 0.5, 0.7);
  const execution = gradeFromThresholds(
    m.execution.overduePerkCount === 0
      ? m.execution.perkFulfillmentRate
      : m.execution.perkFulfillmentRate * 0.8,
    0.75,
    0.92,
  );
  const growth = gradeFromThresholds(m.growth.communityGrowth, 0.05, 0.15);

  // Sponsor readiness = the floor of the four areas nudged by their average,
  // so a single weak area holds a streamer back (sponsors care about the weakest link).
  const ranks = [fanSupport, fanLoyalty, execution, growth].map(gradeRank);
  const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
  const floor = Math.min(...ranks);
  const overallRank = Math.round((floor + avg) / 2);
  const sponsorReadiness = GRADES[Math.max(0, Math.min(2, overallRank))];

  return { fanSupport, fanLoyalty, execution, growth, sponsorReadiness };
}

/** Korean + English labels for a grade (i18n handled in messages; this is a fallback map). */
export const GRADE_KO: Record<Grade, string> = {
  Emerging: "성장 중",
  Strong: "탄탄함",
  Excellent: "뛰어남",
};
