/**
 * The motoo logomark — replaces the earlier "mochi blob" as the brand's icon
 * (that shape lives on as `Mochi`, which still stands for the currency itself
 * everywhere it's shown in-product). Traced from the source vector at
 * `Adobe Assets/SVG/Asset 2.svg`; the two fills are kept as separate paths so
 * either color can be retargeted without touching the geometry.
 */
export function BrandMark({
  width = 23,
  height = 26,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 270.24 309.8"
      width={width}
      height={height}
      className={className}
      style={{ flex: "none" }}
    >
      <path
        fill="#bcbec0"
        d="M5.2,145.4c-5.41-16.12,6.03-34.5,25.55-41.05l189.14-63.47c19.52-6.55,39.73,1.21,45.14,17.33s-6.03,34.5-25.55,41.05l-189.14,63.47c-19.52,6.55-39.73-1.21-45.14-17.33Z"
      />
      <path
        fill="#bcbec0"
        d="M5.2,251.29c-5.41-16.12,6.03-34.5,25.55-41.05l189.14-63.47c19.52-6.55,39.73,1.21,45.14,17.33s-6.03,34.5-25.55,41.05l-189.14,63.47c-19.52,6.55-39.73-1.21-45.14-17.33Z"
      />
      <path
        fill="#f15a29"
        d="M269.8,74.81c3.14-16.71-10.71-33.35-30.95-37.15L42.78.78C22.54-3.02,3.59,7.44.44,24.15c-3.14,16.71,10.71,33.35,30.95,37.15l196.07,36.88c20.24,3.81,39.19-6.66,42.33-23.37Z"
      />
      <path
        fill="#f15a29"
        d="M269.8,180.23c3.14-16.71-10.71-33.35-30.95-37.15L42.78,106.2c-20.24-3.81-39.19,6.66-42.33,23.37-3.14,16.71,10.71,33.35,30.95,37.15l196.07,36.88c20.24,3.81,39.19-6.66,42.33-23.37Z"
      />
      <path
        fill="#f15a29"
        d="M269.8,285.64c3.14-16.71-10.71-33.35-30.95-37.15l-196.07-36.88c-20.24-3.81-39.19,6.66-42.33,23.37-3.14,16.71,10.71,33.35,30.95,37.15l196.07,36.88c20.24,3.81,39.19-6.66,42.33-23.37Z"
      />
    </svg>
  );
}
