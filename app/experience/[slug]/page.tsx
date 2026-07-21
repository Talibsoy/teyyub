import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getExperienceBySlug,
  buildPlannerLink,
  type ExperiencePackage,
} from "@/lib/experience-packages";

// Faza 3 — Experience landing page (Flow 1: social ad → this page → booking).
// Marketing content is authored; the "from" price is explicitly a starting
// estimate. Real, bookable prices only ever come from the planner.

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getExperienceBySlug(slug);
  if (!pkg) return { title: "Experience not found | Natoure" };

  return {
    title: pkg.seo_title || `${pkg.title} | Natoure`,
    description: pkg.seo_description || pkg.summary || undefined,
    openGraph: {
      title: pkg.seo_title || pkg.title,
      description: pkg.seo_description || pkg.summary || undefined,
      images: pkg.hero_image_url ? [pkg.hero_image_url] : undefined,
    },
  };
}

export default async function ExperiencePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const pkg = await getExperienceBySlug(slug);
  if (!pkg) notFound();

  const plannerHref = buildPlannerLink(pkg);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <header className="relative">
        <div
          className="h-[52vh] min-h-[320px] w-full bg-slate-800 bg-cover bg-center"
          style={pkg.hero_image_url ? { backgroundImage: `url(${pkg.hero_image_url})` } : undefined}
        >
          <div className="h-full w-full bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/10">
            <div className="max-w-4xl mx-auto px-5 h-full flex flex-col justify-end pb-10">
              <p className="text-emerald-300 text-sm font-medium tracking-wide uppercase mb-2">
                {pkg.destination}
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight text-balance">
                {pkg.title}
              </h1>
              {pkg.subtitle && (
                <p className="text-slate-200 mt-3 text-lg max-w-2xl">{pkg.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Key facts */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Fact label={`${pkg.duration_days} days`} />
          {pkg.difficulty && <Fact label={capitalize(pkg.difficulty)} />}
          {pkg.best_season && <Fact label={pkg.best_season} />}
          {pkg.max_group_size && <Fact label={`Max ${pkg.max_group_size} people`} />}
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">
          <div>
            {pkg.summary && (
              <p className="text-lg text-slate-700 leading-relaxed mb-8">{pkg.summary}</p>
            )}

            {pkg.highlights.length > 0 && (
              <Section title="Trip highlights">
                <ul className="space-y-2">
                  {pkg.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 text-slate-700">
                      <span className="text-emerald-600 mt-0.5 flex-shrink-0">▲</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {pkg.description && (
              <Section title="About this experience">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{pkg.description}</p>
              </Section>
            )}

            {pkg.itinerary.length > 0 && (
              <Section title="Day by day">
                <ol className="space-y-4">
                  {pkg.itinerary.map((d) => (
                    <li key={d.day} className="flex gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                        {d.day}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900">{d.title}</h3>
                        {d.description && (
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{d.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {(pkg.included.length > 0 || pkg.excluded.length > 0) && (
              <Section title="What's included">
                <div className="grid sm:grid-cols-2 gap-6">
                  {pkg.included.length > 0 && (
                    <ul className="space-y-2">
                      {pkg.included.map((x, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-emerald-600 flex-shrink-0">✓</span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {pkg.excluded.length > 0 && (
                    <ul className="space-y-2">
                      {pkg.excluded.map((x, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-500">
                          <span className="text-slate-400 flex-shrink-0">✕</span>
                          <span>{x}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>
            )}

            {pkg.faq.length > 0 && (
              <Section title="Questions">
                <div className="space-y-4">
                  {pkg.faq.map((f, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-slate-900 text-sm">{f.question}</h3>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Booking CTA */}
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-2xl border border-slate-200 shadow-sm p-6 bg-white">
              {pkg.base_price_usd !== null && (
                <>
                  <p className="text-sm text-slate-500">From</p>
                  <p className="text-3xl font-bold text-slate-900 tabular-nums">
                    ${Math.round(pkg.base_price_usd)}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    per person — starting estimate, excluding flights
                  </p>
                </>
              )}

              <Link href={plannerHref} className="block w-full text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">
                Build my trip
              </Link>

              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                We&apos;ll search live flights and hotels for your dates. You approve every step —
                nothing is booked until you confirm.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-700">
      {label}
    </span>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}