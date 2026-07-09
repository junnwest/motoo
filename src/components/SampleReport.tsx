import { Avatar } from "./ui/Placeholder";
import { GradeBadge } from "./GradeBadge";

/**
 * Marketing sample of the Trust Report, ported from the design handoff.
 * Static illustrative numbers (this is the landing showcase, not live data).
 * The real, data-driven report renders elsewhere from TrustReport records.
 */

export function SampleReportCard() {
  return (
    <div className="rounded-[24px] border border-line-2 bg-white p-6 shadow-float">
      <div className="mb-[18px] flex items-center gap-3">
        <Avatar name="크리에이터A" size={46} />
        <div className="flex-1">
          <div className="text-[17px] font-extrabold">@크리에이터A</div>
          <div className="font-mono text-[11px] text-muted">
            TRUST REPORT · 2026.06
          </div>
        </div>
        <GradeBadge grade="Strong" size="sm" showDot={false} />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-[10px]">
        {[
          { v: "312", l: "총 백커" },
          { v: "41%", l: "재후원율" },
          { v: "94%", l: "퍼크 이행" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-[14px] border border-line-2 bg-panel p-[13px]"
          >
            <div className="text-[24px] font-extrabold tracking-[-0.02em]">
              {s.v}
            </div>
            <div className="text-[12px] text-muted">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-line-2 bg-panel px-[14px] pb-2 pt-[14px]">
        <div className="mb-[6px] flex justify-between text-[12px] text-muted">
          <span>응원·성장 추이</span>
          <span className="font-bold text-coral-deep">+18%</span>
        </div>
        <svg viewBox="0 0 260 70" className="block h-[60px] w-full">
          <defs>
            <linearGradient id="sampleG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F2B5A0" stopOpacity=".5" />
              <stop offset="1" stopColor="#F2B5A0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,56 L33,52 L66,54 L99,42 L132,38 L165,26 L198,20 L231,12 L260,8 L260,70 L0,70 Z"
            fill="url(#sampleG)"
          />
          <polyline
            points="0,56 33,52 66,54 99,42 132,38 165,26 198,20 231,12 260,8"
            fill="none"
            stroke="#E08A6F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function SampleReportBrowser() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line-3 bg-white shadow-float">
      {/* browser chrome */}
      <div className="flex items-center gap-[10px] border-b border-line-2 bg-cream px-[18px] py-[13px]">
        <span className="flex gap-[7px]">
          <span className="h-[11px] w-[11px] rounded-full bg-line-3" />
          <span className="h-[11px] w-[11px] rounded-full bg-line-3" />
          <span className="h-[11px] w-[11px] rounded-full bg-line-3" />
        </span>
        <span className="flex-1 text-center font-mono text-[11.5px] text-muted">
          motoo.gg/r/creatorA · 공유용
        </span>
      </div>
      <div className="p-6">
        <div className="mb-5 flex items-center gap-[13px]">
          <Avatar name="크리에이터A" size={50} />
          <div className="flex-1">
            <div className="text-[19px] font-extrabold">@크리에이터A</div>
            <div className="font-mono text-[11.5px] text-muted">
              TRUST REPORT · 2026년 6월
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 font-mono text-[10.5px] text-muted">
              SPONSOR READINESS
            </div>
            <GradeBadge grade="Strong" />
          </div>
        </div>
        {/* readiness band */}
        <div className="mb-[22px] flex gap-[6px]">
          <div className="h-2 flex-1 rounded-[6px] bg-line-4" />
          <div className="h-2 flex-1 rounded-[6px] bg-coral" />
          <div className="h-2 flex-1 rounded-[6px] bg-line-4" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricMini label="FAN SUPPORT" value="312" note="백커 · 평균 ₩6.4k">
            <div className="mt-[10px] flex h-[30px] items-end gap-1">
              {[40, 55, 48, 70, 85, 100].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-[3px]"
                  style={{
                    height: `${h}%`,
                    background: h >= 85 ? "#E08A6F" : h >= 70 ? "#EFC3AE" : "#E3D6C6",
                  }}
                />
              ))}
            </div>
          </MetricMini>
          <MetricMini label="FAN LOYALTY" value="41%" note="재후원 · 핵심 48명">
            <div className="mt-[10px] flex items-center gap-[10px]">
              <div className="h-[30px] w-[30px] rounded-full border-[5px] border-line-4 border-r-coral border-t-coral" />
              <span className="text-[12px] text-body">핵심 팬이 응원의 62%</span>
            </div>
          </MetricMini>
          <MetricMini label="EXECUTION" value="94%" note="퍼크 이행">
            <div className="mt-3 h-2 overflow-hidden rounded-[6px] bg-line-4">
              <div className="h-full bg-sage" style={{ width: "94%" }} />
            </div>
          </MetricMini>
          <MetricMini label="GROWTH" value="+18%" note="팔로워 · +11% 시청자">
            <svg viewBox="0 0 150 32" className="mt-2 h-[30px] w-full">
              <polyline
                points="0,28 25,24 50,25 75,17 100,13 125,7 150,3"
                fill="none"
                stroke="#E08A6F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </MetricMini>
        </div>
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-line-2 bg-panel p-4">
      <div className="font-mono text-[10.5px] tracking-[0.05em] text-muted">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[28px] font-extrabold tracking-[-0.02em]">
          {value}
        </span>
        <span className="text-[13px] text-body">{note}</span>
      </div>
      {children}
    </div>
  );
}
