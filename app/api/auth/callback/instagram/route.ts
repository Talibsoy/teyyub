import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("[Instagram Auth] Login xətası:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "https://natourefly.com"}/?error=instagram_auth_failed`);
  }

  if (code) {
    console.log("[Instagram Auth] Avtorizasiya kodu alındı:", code);
    // TODO: Kodu Instagram Graph API vasitəsilə Access Token-ə dəyişin
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || "https://natourefly.com"}/?status=instagram_connected`);
  }

  return new NextResponse("Kod tapılmadı", { status: 400 });
}
