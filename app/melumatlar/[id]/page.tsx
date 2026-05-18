import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

interface Post {
  id: string;
  country: string;
  emoji: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getSupabase().from("travel_posts").select("*").eq("id", id).single();
  if (!data) return { title: "Post not found" };

  return {
    title: `${data.title} | Natoure`,
    description: data.content.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.content.slice(0, 160),
      images: data.image_url ? [{ url: data.image_url }] : [],
      type: "article",
    },
    keywords: `${data.country} tour, ${data.country} tourism, Natoure`,
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: post } = await getSupabase()
    .from("travel_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) notFound();

  // Read language from cookie (set by LanguageContext on the client)
  const cookieStore = await cookies();
  const lang = (cookieStore.get("nf_locale")?.value ?? "az") as "az" | "tr" | "en";

  const backLabel = lang === "tr" ? "← Tüm yazılar" : lang === "en" ? "← All posts" : "← Bütün məlumatlar";
  const ctaTitle  = lang === "tr" ? `${post.country} turuna çıkmak ister misiniz?` : lang === "en" ? `Ready to visit ${post.country}?` : `${post.country} turuna çıxmaq istəyirsiniz?`;
  const ctaDesc   = lang === "tr" ? "Natoure ekibi sizin için en iyi paketi hazırlıyor" : lang === "en" ? "The Natoure team will prepare the best package for you" : "Natoure komandası sizin üçün ən yaxşı paketi hazırlayır";
  const ctaBtn    = lang === "tr" ? "💬 Teklif Al" : lang === "en" ? "💬 Get a Quote" : "💬 Təklif Al";
  const waMsg     = lang === "tr"
    ? `Merhaba, ${post.country} turu hakkında bilgi almak istiyorum`
    : lang === "en"
    ? `Hello, I would like to get information about ${post.country} tour`
    : `Salam, ${post.country} turu haqqında məlumat almaq istəyirəm`;

  const dateLocale = lang === "tr" ? "tr-TR" : lang === "en" ? "en-GB" : "az-AZ";

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Hero image */}
      {post.image_url && (
        <div style={{ width: "100%", height: 360, overflow: "hidden", position: "relative" }}>
          <img src={post.image_url} alt={post.country}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, #0b0b0b 100%)"
          }} />
        </div>
      )}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back */}
        <Link href="/melumatlar" style={{
          color: "#94a3b8", fontSize: 13, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
        }}>
          {backLabel}
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{post.emoji}</div>
          <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            {post.country}
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 8px", lineHeight: 1.35 }}>
            {post.title}
          </h1>
          <p style={{ color: "#444", fontSize: 12 }}>
            {new Date(post.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div style={{
          color: "#bbb", fontSize: 15, lineHeight: 1.9,
          whiteSpace: "pre-wrap", marginBottom: 40,
        }}>
          {post.content}
        </div>

        {/* CTA */}
        <div style={{
          background: "white", border: "1px solid #e2e8f0", borderRadius: 16,
          padding: "24px 28px", textAlign: "center",
        }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {ctaTitle}
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
            {ctaDesc}
          </p>
          <a
            href={`https://wa.me/994517769632?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#25D366", borderRadius: 10,
              padding: "13px 28px", fontWeight: 700, fontSize: 14,
              textDecoration: "none", color: "white",
            }}
          >
            {ctaBtn}
          </a>
        </div>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": post.title,
              "description": post.content.slice(0, 160),
              "image": post.image_url || "",
              "datePublished": post.created_at,
              "author": { "@type": "Organization", "name": "Natoure" },
              "publisher": {
                "@type": "Organization",
                "name": "Natoure",
                "url": "https://www.natourefly.com"
              }
            })
          }}
        />
      </div>
    </div>
  );
}
