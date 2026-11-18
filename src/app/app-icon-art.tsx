// Shared artwork for generated app icons (icon.tsx, apple-icon.tsx).
// Content stays inside the central ~70% so maskable crops keep it intact.
// The spade is an SVG path: the ♠ character renders as a grey emoji in ImageResponse.
export function AppIconArt({ size }: { size: number }) {
  const glyph = Math.round(size * 0.34);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: Math.round(size * 0.02),
        background: "#10241c",
        color: "#ffffff",
        fontSize: glyph,
        fontWeight: 700,
      }}
    >
      <span>7</span>
      <svg width={glyph * 0.75} height={glyph * 0.75} viewBox="0 0 100 100">
        <path
          d="M50 5 C50 5 10 40 10 62 C10 78 28 86 42 74 C40 84 36 92 30 95 L70 95 C64 92 60 84 58 74 C72 86 90 78 90 62 C90 40 50 5 50 5 Z"
          fill="#34d399"
        />
      </svg>
      <span>2</span>
    </div>
  );
}
