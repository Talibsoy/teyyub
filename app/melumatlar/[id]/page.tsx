import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

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
  if (!data) return { title: "Məlumat tapılmadı" };

  return {
    title: `${data.title} | Natoure`,
    description: data.content.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.content.slice(0, 160),
      images: data.image_url ? [{ url: data.image_url }] : [],
      type: "article",
      locale: "az_AZ",
    },
    keywords: `${data.country} turu, ${data.country} turizm, Bakıdan ${data.country}, Natoure`,
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

  const waMsg = encodeURIComponent(`Salam, ${post.country} turu haqqında məlumat almaq istəyirəm`);

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
          ← Bütün məlumatlar
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{post.emoji}</div>
          <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            {post.country}
          </span>
          <h1 style={{  fontSize: 26, fontWeight: 800, margin: "10px 0 8px", lineHeight: 1.35 }}>
            {post.title}
          </h1>
          <p style={{ color: "#444", fontSize: 12 }}>
            {new Date(post.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}
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
          <p style={{  fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {post.country} turuna çıxmaq istəyirsiniz?
          </p>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
            Natoure komandası sizin üçün ən yaxşı paketi hazırlayır
          </p>
          <a
            href={`https://wa.me/994517769632?text=${waMsg}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#25D366", borderRadius: 10,
              padding: "13px 28px", fontWeight: 700, fontSize: 14,
              textDecoration: "none",
            }}
          >
            💬 Təklif Al
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
