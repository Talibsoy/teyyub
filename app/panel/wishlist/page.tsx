"use client";
import { useState } from "react";
import Link from "next/link";
import { usePanelContext } from "@/lib/panel-context";
import { getSupabase } from "@/lib/supabase";

function AddWishlistModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { user, darkMode } = usePanelContext();
  const [destination, setDestination] = useState("");
  const [tourName, setTourName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const d = darkMode;

  const submit = async () => {
    if (!destination.trim() || !tourName.trim() || !user) return;
    setLoading(true);
    const supabase = getSupabase();
    await supabase.from("wishlists").insert({
      user_id: user.id,
      destination,
      tour_name: tourName,
      notes: notes || null,
    });
    setLoading(false);
    onAdded();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: d ? "#0f172a" : "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>Arzu Siyahısına Əlavə Et</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}>×</button>
        </div>
        {[
          { label: "Məkan *", value: destination, set: setDestination, placeholder: "Məs: Antalya, Türkiyə" },
          { label: "Tur adı *", value: tourName, set: setTourName, placeholder: "Məs: Rixos Premium Belek 7 gecə" },
          { label: "Qeyd (istəyə bağlı)", value: notes, set: setNotes, placeholder: "Xüsusi istəklər..." },
        ].map((field) => (
          <div key={field.label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: d ? "#94a3b8" : "#475569", marginBottom: 5 }}>{field.label}</label>
            <input
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, background: d ? "#1e293b" : "#f8fafc", color: d ? "#e2e8f0" : "#0f172a", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        ))}
        <button
          onClick={submit}
          disabled={loading || !destination.trim() || !tourName.trim()}
          style={{ width: "100%", padding: "12px", borderRadius: 12, background: loading || !destination.trim() ? "#94a3b8" : "linear-gradient(135deg, #e11d48, #f97316)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, marginTop: 6 }}
        >
          {loading ? "Əlavə olunur..." : "❤️ Əlavə Et"}
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlist, user, darkMode, refreshWishlist } = usePanelContext();
  const [addOpen, setAddOpen] = useState(false);
  const d = darkMode;

  const removeItem = async (id: string) => {
    if (!user) return;
    const supabase = getSupabase();
    await supabase.from("wishlists").delete().eq("id", id).eq("user_id", user.id);
    await refreshWishlist();
  };

  const DESTINATIONS = [
    { name: "Antalya", flag: "🇹🇷", image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&q=80" },
    { name: "Dubai", flag: "🇦🇪", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
    { name: "Bali", flag: "🇮🇩", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80" },
    { name: "Paris", flag: "🇫🇷", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80" },
    { name: "Tokyo", flag: "🇯🇵", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80" },
    { name: "Maldiv", flag: "🇲🇻", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80" },
  ];

  const getDestImage = (dest: string) => {
    const match = DESTINATIONS.find((d) => dest.toLowerCase().includes(d.name.toLowerCase()));
    return match?.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80";
  };

  return (
    <div>
      {addOpen && <AddWishlistModal onClose={() => setAddOpen(false)} onAdded={refreshWishlist} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: d ? "#e2e8f0" : "#0f172a" }}>Arzu Siyahısı</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: d ? "#64748b" : "#94a3b8" }}>
            {wishlist.length > 0 ? `${wishlist.length} saxlanılmış tur` : "Gedmək istədiyiniz yerləri yadda saxlayın"}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          style={{
            padding: "10px 18px", borderRadius: 12, fontWeight: 700, fontSize: 13,
            background: "linear-gradient(135deg, #e11d48, #f97316)",
            color: "white", border: "none", cursor: "pointer",
          }}
        >
          + Əlavə Et
        </button>
      </div>

      {/* Wishlist Grid */}
      {wishlist.length === 0 ? (
        <div style={{ borderRadius: 20, border: `2px dashed ${d ? "#1e293b" : "#e2e8f0"}`, padding: "60px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>❤️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 8px" }}>
            Arzu siyahınız boşdur
          </h3>
          <p style={{ fontSize: 14, color: d ? "#64748b" : "#94a3b8", margin: "0 0 20px" }}>
            Gedmək istədiyiniz yerləri burada yadda saxlayın. Qiymət endirimlərindən xəbərdar olacaqsınız.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              padding: "12px 28px", borderRadius: 14, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(135deg, #e11d48, #f97316)",
              color: "white", border: "none", cursor: "pointer",
            }}
          >
            İlk Turunuzu Əlavə Edin
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {wishlist.map((item) => (
            <div key={item.id} style={{
              borderRadius: 18, overflow: "hidden",
              background: d ? "#0f172a" : "#ffffff",
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              position: "relative",
            }}>
              {/* Image */}
              <div style={{
                height: 150,
                backgroundImage: `url(${item.image_url || getDestImage(item.destination)})`,
                backgroundSize: "cover", backgroundPosition: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)",
                }} />
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)", border: "none",
                    cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#e11d48",
                  }}
                  title="Siyahıdan çıxar"
                >
                  ×
                </button>
                <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                    {item.destination}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: d ? "#e2e8f0" : "#0f172a", marginBottom: 4 }}>
                  {item.tour_name}
                </div>
                {item.notes && (
                  <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginBottom: 8 }}>📝 {item.notes}</div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>
                    {new Date(item.added_at).toLocaleDateString("az-AZ")} tarixi əlavə edildi
                  </div>
                  <div style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 10,
                    background: d ? "#1e293b" : "#fef9c3",
                    color: "#d97706", fontWeight: 600,
                  }}>
                    🔔 Xəbər var
                  </div>
                </div>

                <Link
                  href={`https://wa.me/994XXXXXXXX?text=Salam%2C%20${encodeURIComponent(item.tour_name)}%20tur%20haqq%C4%B1nda%20m%C9%99lumat%20almaq%20istirdim`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", marginTop: 12, padding: "9px 14px",
                    borderRadius: 10, textAlign: "center",
                    background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                    color: "white", textDecoration: "none",
                    fontSize: 12, fontWeight: 700,
                  }}
                >
                  Qiymət al → WhatsApp
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popular Destinations Inspiration */}
      {wishlist.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
            🌍 Populyar Məkanlar
          </h2>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {DESTINATIONS.map((dest) => (
              <button
                key={dest.name}
                onClick={() => {
                  setAddOpen(true);
                }}
                style={{
                  flexShrink: 0, borderRadius: 50, padding: "8px 16px",
                  background: d ? "#1e293b" : "#f1f5f9",
                  border: `1px solid ${d ? "#334155" : "#e2e8f0"}`,
                  color: d ? "#e2e8f0" : "#475569",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {dest.flag} {dest.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
