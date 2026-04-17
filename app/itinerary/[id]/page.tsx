import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { Activity, ItineraryDay } from "@/lib/itinerary-generator";

interface ItineraryRow {
  id: string;
  destination: string;
  title: string;
  summary: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  guests: number;
  budget_estimate: string;
  days: ItineraryDay[];
  travel_tips: string[];
  best_season: string;
  created_at: string;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getSupabaseAdmin()
    .from("itineraries")
    .select("title, summary, destination")
    .eq("id", id)
    .single();
  if (!data) return { title: "Proqram tapılmadı" };
  return {
    title: `${data.title} | Natoure`,
    description: data.summary?.slice(0, 160),
  };
}

const TYPE_CONFIG: Record<Activity["type"], { label: string; color: string; dot: string }> = {
  transport:     { label: "Nəqliyyat",  color: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-400" },
  accommodation: { label: "Otel",       color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  food:          { label: "Yemək",      color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  activity:      { label: "Aktivlik",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  free:          { label: "Sərbəst",    color: "bg-slate-50 text-slate-600 border-slate-200",  dot: "bg-slate-400" },
};

function ActivityCard({ act }: { act: Activity }) {
  const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.activity;
  return (
    <div className="flex gap-4 group">
      {/* time + dot */}
      <div className="flex flex-col items-center gap-1 min-w-[56px]">
        <span className="text-xs font-semibold text-slate-500 tabular-nums">{act.time}</span>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${cfg.dot} ring-2 ring-white`} />
      </div>

      {/* card */}
      <div className={`flex-1 rounded-xl border p-4 mb-3 transition-shadow hover:shadow-md ${cfg.color}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-sm leading-snug">{act.title}</h4>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/60 border border-current/20 whitespace-nowrap flex-shrink-0">
            {cfg.label}
          </span>
        </div>

        <p className="text-sm opacity-85 leading-relaxed mb-2">{act.description}</p>

        <div className="flex flex-wrap gap-3 text-xs opacity-70">
          {act.duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {act.duration}
            </span>
          )}
          {act.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {act.location}
            </span>
          )}
          {act.cost_estimate && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {act.cost_estimate}
            </span>
          )}
        </div>

        {act.tips && (
          <div className="mt-2 pt-2 border-t border-current/10 text-xs opacity-70 flex items-start gap-1">
            <span className="flex-shrink-0">💡</span>
            <span>{act.tips}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DaySection({ dayData, index }: { dayData: ItineraryDay; index: number }) {
  const dateObj = new Date(dayData.date);
  const weekday = dateObj.toLocaleDateString("az-AZ", { weekday: "long" });
  const dateStr = dateObj.toLocaleDateString("az-AZ", { day: "numeric", month: "long" });

  return (
    <section className="mb-10">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {dayData.day}
        </div>
        <div>
          <div className="font-semibold text-slate-800 leading-tight">{dayData.title}</div>
          <div className="text-xs text-slate-500 capitalize">{weekday}, {dateStr}</div>
        </div>
        {dayData.theme && (
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 hidden sm:block">
            {dayData.theme}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="pl-2 border-l-2 border-slate-100 ml-5">
        {dayData.activities.map((act, i) => (
          <ActivityCard key={i} act={act} />
        ))}
      </div>
    </section>
  );
}

export default async function ItineraryPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: itin } = await getSupabaseAdmin()
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single<ItineraryRow>();

  if (!itin) notFound();

  const startDate = new Date(itin.start_date).toLocaleDateString("az-AZ", {
    day: "numeric", month: "long", year: "numeric",
  });
  const endDate = new Date(itin.end_date).toLocaleDateString("az-AZ", {
    day: "numeric", month: "long", year: "numeric",
  });

  const waMsg = encodeURIComponent(
    `Salam! "${itin.title}" proqramı ilə maraqlananıram. Rezervasiya üçün kömək edə bilərsinizmi?`
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/turlar" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Turlara qayıt
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{itin.title}</h1>
          <p className="text-slate-600 leading-relaxed mb-5">{itin.summary}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <Pill icon="📅" label={`${startDate} — ${endDate}`} />
            <Pill icon="🗓️" label={`${itin.duration_days} gün`} />
            <Pill icon="👥" label={`${itin.guests} nəfər`} />
            <Pill icon="💰" label={itin.budget_estimate} />
            {itin.best_season && <Pill icon="🌤️" label={itin.best_season} />}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_260px] gap-8 items-start">

          {/* Timeline */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-sky-500 rounded-full inline-block"/>
              Günlük Proqram
            </h2>
            {itin.days.map((day, i) => (
              <DaySection key={i} dayData={day} index={i} />
            ))}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            {/* CTA card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-1">Bu proqramı bəyəndiniz?</h3>
              <p className="text-sm text-slate-500 mb-4">Rezervasiya üçün bizə yazın — hər şeyi biz həll edirik.</p>
              <a
                href={`https://wa.me/994517769632?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/>
                </svg>
                WhatsApp-da Yaz
              </a>
              <Link
                href="/turlar"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm mt-2 transition-colors"
              >
                Bütün turları gör
              </Link>
            </div>

            {/* Travel tips */}
            {itin.travel_tips?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                  <span>💡</span> Faydalı məsləhətlər
                </h3>
                <ul className="space-y-2">
                  {itin.travel_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0 text-amber-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generate new */}
            <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5 text-center">
              <p className="text-sm text-sky-700 mb-3">Fərqli bir proqram istəyirsiniz?</p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Yeni proqram yarat →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
