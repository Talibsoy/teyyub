import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "linear-gradient(135deg, #0057A8 0%, #004a90 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 96, lineHeight: 1 }}>✈</div>
        <div
          style={{
            color: "#D4AF37",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          FlyNaToure
        </div>
      </div>
    ),
    { ...size }
  );
}
