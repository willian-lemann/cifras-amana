import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/config";

export const runtime = "nodejs";

const BRAND = "#7f22fe";

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal";
};

// Fetch the brand font once per server instance. If the fetch fails for any
// reason we fall back to the built-in font so the route never errors out.
let fontCache: LoadedFont[] | null = null;

async function loadFonts(): Promise<LoadedFont[]> {
  if (fontCache) return fontCache;

  try {
    const weights: (400 | 600 | 700)[] = [400, 600, 700];
    const fonts = await Promise.all(
      weights.map(async (weight): Promise<LoadedFont> => {
        const css = await (
          await fetch(
            `https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`,
          )
        ).text();
        const url = css.match(
          /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
        )?.[1];
        if (!url) throw new Error("font url not found");
        const data = await (await fetch(url)).arrayBuffer();
        return { name: "Geist", data, weight, style: "normal" };
      }),
    );
    fontCache = fonts;
    return fonts;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || APP_NAME;
  const subtitle = searchParams.get("subtitle") || "";
  const format = searchParams.get("format") === "story" ? "story" : "square";

  // 1080x1080 for feed/link previews, 1080x1920 for stories.
  const width = 1080;
  const height = format === "story" ? 1920 : 1080;

  const fonts = await loadFonts();
  const fontFamily = fonts.length ? "Geist" : undefined;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        color: "#ffffff",
        fontFamily,
        backgroundColor: "#09090b",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(127,34,254,0.25), transparent 55%), radial-gradient(circle at 85% 90%, rgba(127,34,254,0.18), transparent 55%)",
        padding: 88,
      }}
    >
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: "#ffffff",
            color: BRAND,
            fontSize: 38,
            fontWeight: 700,
          }}
        >
          {APP_NAME.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
          {APP_NAME}
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.05 }}>
          {title.length > 70 ? `${title.slice(0, 70)}…` : title}
        </span>
        {subtitle ? (
          <span
            style={{
              fontSize: 38,
              fontWeight: 400,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>,
    {
      width,
      height,
      fonts: fonts.length ? fonts : undefined,
    },
  );
}
