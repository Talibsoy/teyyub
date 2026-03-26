import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeMedia(
  base64Data: string,
  mimeType: string,
  mediaType: "ses" | "video" | "fayl"
): Promise<string> {
  const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

  let prompt: string;
  if (mediaType === "ses") {
    prompt =
      "Bu audio mesajını tam transkript et. Yalnız deyilənləri yaz, heç bir əlavə şərh vermə. Azərbaycan dilindədirsə Azərbaycanca, başqa dildədirsə həmin dildə yaz.";
  } else if (mediaType === "video") {
    prompt =
      "Bu videonu qısa Azərbaycan dilində təsvir et. Tur, səyahət, destinasiya, otel ilə əlaqəli bir şey varmı? 2-3 cümlə maksimum.";
  } else {
    prompt = "Bu sənədi Azərbaycan dilində qısa təsvir et.";
  }

  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    prompt,
  ]);

  return result.response.text().trim();
}
