import { createClient } from "@supabase/supabase-js";

type Message = { role: "user" | "assistant"; content: string };

interface Example {
  platform: string;
  conversation: Message[];
  destination: string | null;
  outcome: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Uğurlu söhbəti nümunə kimi saxla
export async function saveExample(
  platform: string,
  senderId: string,
  history: Message[],
  outcome: "booking" | "manual",
  destination?: string | null
) {
  try {
    const supabase = getSupabase();
    // Son 6 mesajı saxla (3 user + 3 assistant)
    const trimmed = history.slice(-6);
    if (trimmed.length < 2) return;

    await supabase.from("ai_examples").insert({
      platform,
      sender_id: senderId,
      conversation: trimmed,
      outcome,
      destination: destination || null,
    });
  } catch {
    // Xəta webhook-u dayandırmasın
  }
}

// Ən yaxşı 5 nümunəni çək
export async function getExamples(destination?: string | null): Promise<Example[]> {
  try {
    const supabase = getSupabase();
    let results: Example[] = [];

    // Əvvəlcə eyni destination-u axtar
    if (destination) {
      const { data } = await supabase
        .from("ai_examples")
        .select("platform, conversation, destination, outcome")
        .ilike("destination", `%${destination}%`)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) results = data as Example[];
    }

    // Qalan yeri ümumi nümunələrlə doldur
    if (results.length < 5) {
      const exclude = results.map((_, i) => i); // artıq alınmışları atla
      const { data } = await supabase
        .from("ai_examples")
        .select("platform, conversation, destination, outcome")
        .order("created_at", { ascending: false })
        .limit(5 - results.length + 2); // bir az artıq al, dublikat ola bilər
      if (data) {
        const extra = (data as Example[]).filter(
          (d) => !results.some((r) => JSON.stringify(r.conversation) === JSON.stringify(d.conversation))
        );
        results = [...results, ...extra].slice(0, 5);
      }
    }

    return results;
  } catch {
    return [];
  }
}

// Nümunələri sistem promptu üçün formatla
export function formatExamplesForPrompt(examples: Example[]): string {
  if (examples.length === 0) return "";

  const formatted = examples.map((ex, i) => {
    const msgs = ex.conversation
      .map((m) => `${m.role === "user" ? "Müştəri" : "Sən"}: ${m.content}`)
      .join("\n");
    return `Nümunə ${i + 1} (${ex.platform}${ex.destination ? ` — ${ex.destination}` : ""}):\n${msgs}`;
  });

  return `\n\n## Uğurlu Satış Nümunələri\nAşağıdakı real söhbətlər uğurla nəticələnib. Oxşar vəziyyətlərdə bu yanaşmadan ilham al:\n\n${formatted.join("\n\n---\n\n")}`;
}
