// lib/quiz-processor.ts
// NatoureFly Personalization Engine — Quiz Processing Logic

export type Archetype =
  | "efficiency_seeker"
  | "deep_relaxer"
  | "silent_explorer"
  | "budget_optimizer"
  | "luxury_curator"
  | "undetermined";

export type CompanionType = "solo" | "couple" | "family" | "group" | "undetermined";

export interface ScoreImpact {
  pref_budget_sensitivity?: number;
  pref_comfort_priority?: number;
  pref_adventure_level?: number;
  pref_hassle_free?: number;
  pref_social_atmosphere?: number;
  pref_cultural_depth?: number;
  pref_nature_affinity?: number;
  pref_nightlife?: number;
  pref_family_friendly?: number;
  pref_food_importance?: number;
  pref_planning_preference?: number;
}

export interface QuizAnswer {
  question_id: string;
  answer_id: string;
  score_impact: ScoreImpact;
}

export interface UserProfileScores {
  archetype: Archetype;
  archetype_confidence: number;
  pref_budget_sensitivity: number;
  pref_comfort_priority: number;
  pref_adventure_level: number;
  pref_hassle_free: number;
  pref_social_atmosphere: number;
  pref_cultural_depth: number;
  pref_nature_affinity: number;
  pref_nightlife: number;
  pref_family_friendly: number;
  pref_food_importance: number;
  pref_planning_preference: number;
  pref_companion_type: CompanionType;
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

export const QUIZ_QUESTIONS = [
  {
    question_id: "Q1_PACE",
    display_type: "image_choice",
    prompt_text: "Hansı enerji sənə daha yaxındır?",
    options: [
      {
        id: "Q1_A",
        label: "Sakit & Dinc",
        emoji: "🌊",
        score_impact: {
          pref_comfort_priority: 0.3,
          pref_adventure_level: -0.2,
          pref_hassle_free: 0.2,
        },
      },
      {
        id: "Q1_B",
        label: "Aktiv & Maraqlı",
        emoji: "🎒",
        score_impact: {
          pref_adventure_level: 0.3,
          pref_cultural_depth: 0.2,
          pref_comfort_priority: -0.1,
        },
      },
    ],
  },
  {
    question_id: "Q2_PRIORITY",
    display_type: "icon_choice",
    prompt_text: "Səyahətdə ən vacib nədir?",
    options: [
      {
        id: "Q2_A",
        label: "Vaxtıma Qənaət",
        emoji: "⏱️",
        score_impact: {
          pref_hassle_free: 0.4,
          pref_budget_sensitivity: -0.1,
        },
      },
      {
        id: "Q2_B",
        label: "Unikal Təcrübə",
        emoji: "✨",
        score_impact: {
          pref_cultural_depth: 0.3,
          pref_adventure_level: 0.2,
        },
      },
      {
        id: "Q2_C",
        label: "Ən Yaxşı Qiymət",
        emoji: "💰",
        score_impact: {
          pref_budget_sensitivity: 0.4,
          pref_comfort_priority: -0.1,
        },
      },
    ],
  },
  {
    question_id: "Q3_ACCOMMODATION",
    display_type: "image_choice",
    prompt_text: "Harada oyanmağı üstün tutardın?",
    options: [
      {
        id: "Q3_A",
        label: "Butik & Unikal",
        emoji: "🏡",
        score_impact: {
          pref_cultural_depth: 0.2,
          pref_social_atmosphere: -0.2,
          pref_comfort_priority: 0.1,
        },
      },
      {
        id: "Q3_B",
        label: "Resort & Tam Xidmət",
        emoji: "🏖️",
        score_impact: {
          pref_comfort_priority: 0.3,
          pref_hassle_free: 0.2,
          pref_social_atmosphere: 0.2,
        },
      },
    ],
  },
  {
    question_id: "Q4_SOCIAL",
    display_type: "image_choice",
    prompt_text: "İdeal axşamın?",
    options: [
      {
        id: "Q4_A",
        label: "Sakit yemək, yerli ab-hava",
        emoji: "🍷",
        score_impact: {
          pref_social_atmosphere: -0.3,
          pref_food_importance: 0.2,
          pref_nightlife: -0.2,
        },
      },
      {
        id: "Q4_B",
        label: "Canlı küçə, yeni insanlar",
        emoji: "🎉",
        score_impact: {
          pref_social_atmosphere: 0.3,
          pref_nightlife: 0.2,
          pref_adventure_level: 0.1,
        },
      },
    ],
  },
  {
    question_id: "Q5_BUDGET",
    display_type: "slider_choice",
    prompt_text: "Nəfər başına səyahət büdcən (7 gecə)?",
    options: [
      {
        id: "Q5_A",
        label: "500 AZN-dən az",
        emoji: "💵",
        score_impact: { pref_budget_sensitivity: 0.4 },
      },
      {
        id: "Q5_B",
        label: "500 – 1500 AZN",
        emoji: "💵💵",
        score_impact: { pref_budget_sensitivity: 0.1 },
      },
      {
        id: "Q5_C",
        label: "1500 – 3000 AZN",
        emoji: "💎",
        score_impact: { pref_budget_sensitivity: -0.1 },
      },
      {
        id: "Q5_D",
        label: "3000 AZN+",
        emoji: "💎💎",
        score_impact: {
          pref_budget_sensitivity: -0.3,
          pref_comfort_priority: 0.2,
        },
      },
    ],
  },
  // ─── OCEAN v2 Sualları ────────────────────────────────────────────────────
  {
    question_id: "Q6_PLANNING",
    display_type: "icon_choice",
    prompt_text: "Səyahəti necə planlaşdırırsan?",
    options: [
      {
        id: "Q6_A",
        label: "Hər şeyi öncədən rezervasiya",
        emoji: "📅",
        score_impact: {
          pref_hassle_free: 0.3,
          pref_planning_preference: 0.4,
        },
      },
      {
        id: "Q6_B",
        label: "Əsas plan, qalanı spontan",
        emoji: "🗺️",
        score_impact: {
          pref_adventure_level: 0.1,
        },
      },
      {
        id: "Q6_C",
        label: "Tamam spontan — gedirəm, görürəm",
        emoji: "⚡",
        score_impact: {
          pref_adventure_level: 0.3,
          pref_planning_preference: -0.3,
        },
      },
    ],
  },
  {
    question_id: "Q7_SOCIAL",
    display_type: "icon_choice",
    prompt_text: "Yerli insanlarla ünsiyyət?",
    options: [
      {
        id: "Q7_A",
        label: "Sevirəm — tanışlıq əsasdır",
        emoji: "🤝",
        score_impact: {
          pref_social_atmosphere: 0.3,
          pref_cultural_depth: 0.2,
        },
      },
      {
        id: "Q7_B",
        label: "Öz həzzimə baxıram",
        emoji: "🎧",
        score_impact: {
          pref_social_atmosphere: -0.3,
          pref_comfort_priority: 0.1,
        },
      },
    ],
  },
  {
    question_id: "Q8_NOVELTY",
    display_type: "icon_choice",
    prompt_text: "Tanımadığın yerli yeməyi sınayarsan?",
    options: [
      {
        id: "Q8_A",
        label: "Mütləq — buna görə gəlmişəm",
        emoji: "🍜",
        score_impact: {
          pref_adventure_level: 0.2,
          pref_food_importance: 0.3,
          pref_cultural_depth: 0.2,
        },
      },
      {
        id: "Q8_B",
        label: "Bildiyimi üstün tuturam",
        emoji: "🍔",
        score_impact: {
          pref_comfort_priority: 0.2,
          pref_adventure_level: -0.2,
        },
      },
    ],
  },
  {
    question_id: "Q9_COMPANION",
    display_type: "icon_choice",
    prompt_text: "Adətən kiminlə səyahət edirsən?",
    options: [
      {
        id: "Q9_A",
        label: "Tək",
        emoji: "🧍",
        score_impact: {
          pref_social_atmosphere: -0.2,
          pref_cultural_depth: 0.1,
        },
      },
      {
        id: "Q9_B",
        label: "Cütlük / romantik",
        emoji: "❤️",
        score_impact: {
          pref_comfort_priority: 0.15,
        },
      },
      {
        id: "Q9_C",
        label: "Ailə (uşaqlarla)",
        emoji: "👨‍👩‍👧",
        score_impact: {
          pref_family_friendly: 0.4,
          pref_adventure_level: -0.1,
        },
      },
      {
        id: "Q9_D",
        label: "Dost qrupu",
        emoji: "👥",
        score_impact: {
          pref_social_atmosphere: 0.3,
          pref_nightlife: 0.1,
        },
      },
    ],
  },
  {
    question_id: "Q10_HIGHLIGHT",
    display_type: "icon_choice",
    prompt_text: "Səyahətdə ən çox sevdiyin an?",
    options: [
      {
        id: "Q10_A",
        label: "Məşhur yerlər",
        emoji: "📸",
        score_impact: {
          pref_hassle_free: 0.1,
        },
      },
      {
        id: "Q10_B",
        label: "Gizli məkanlar — turistsiz künclər",
        emoji: "🔭",
        score_impact: {
          pref_cultural_depth: 0.3,
          pref_adventure_level: 0.2,
        },
      },
      {
        id: "Q10_C",
        label: "Otel / kurort — tam istirahət",
        emoji: "🏖️",
        score_impact: {
          pref_comfort_priority: 0.3,
          pref_adventure_level: -0.2,
        },
      },
    ],
  },
];

// ─── Archetype Labels (AZ) ────────────────────────────────────────────────────

export const ARCHETYPE_LABELS: Record<Archetype, { name: string; desc: string; emoji: string }> = {
  efficiency_seeker: {
    name: "Sürətli Səyahətçi",
    desc: "Vaxtın qiymətini bilirsən. Birbaşa uçuş, asan check-in, sıfır əziyyət.",
    emoji: "⚡",
  },
  deep_relaxer: {
    name: "İstirahət Sevən",
    desc: "Rahatlıq hər şeydən üstündür. Premium otel, yaxşı yemək, heç bir stress.",
    emoji: "🌴",
  },
  silent_explorer: {
    name: "Macəra Axtaran",
    desc: "Unikal təcrübə axtarırsan. Yerli mədəniyyət, autentik məkanlar, kütlədən uzaq.",
    emoji: "🗺️",
  },
  budget_optimizer: {
    name: "Ağıllı Qənaətçi",
    desc: "Maksimum dəyər istəyirsən. Ən yaxşı qiymət/keyfiyyət nisbəti, ağıllı qənaət.",
    emoji: "🎯",
  },
  luxury_curator: {
    name: "Lüks Həvəskarı",
    desc: "Yalnız ən yaxşısı. 5 ulduz, biznes klas, eksklüziv təcrübələr.",
    emoji: "👑",
  },
  undetermined: {
    name: "Səyahətçi",
    desc: "Hər növ səyahətə açıqsınız.",
    emoji: "✈️",
  },
};

// ─── DNA Text Builder (embedding üçün) ───────────────────────────────────────

export function buildDNAText(scores: UserProfileScores): string {
  const parts: string[] = [];

  if (scores.pref_budget_sensitivity > 0.65)
    parts.push("budget-conscious traveler seeking best value");
  else if (scores.pref_budget_sensitivity < 0.35)
    parts.push("luxury traveler with premium preferences");

  if (scores.pref_comfort_priority > 0.65)
    parts.push("high comfort priority, premium accommodation");

  if (scores.pref_adventure_level > 0.65)
    parts.push("adventurous, seeks new experiences");
  else if (scores.pref_adventure_level < 0.35)
    parts.push("prefers familiar comfortable environments");

  if (scores.pref_hassle_free > 0.65)
    parts.push("efficiency-focused, direct flights, minimal transfers");

  if (scores.pref_cultural_depth > 0.65)
    parts.push("culture enthusiast, local experiences, authentic places");

  if (scores.pref_social_atmosphere > 0.65)
    parts.push("social traveler enjoys meeting people");
  else if (scores.pref_social_atmosphere < 0.35)
    parts.push("prefers quiet private experiences");

  if (scores.pref_family_friendly > 0.65)
    parts.push("family travel with children, child-friendly activities");

  if (scores.pref_nightlife > 0.55)
    parts.push("enjoys nightlife and evening entertainment");

  if (scores.pref_food_importance > 0.65)
    parts.push("food lover, culinary experiences are important");

  if (scores.pref_nature_affinity > 0.65)
    parts.push("nature lover, outdoor activities");

  if (scores.pref_planning_preference > 0.65)
    parts.push("pre-planned itinerary, organized structured travel");
  else if (scores.pref_planning_preference < 0.35)
    parts.push("spontaneous travel style, minimal planning");

  const companionMap: Record<CompanionType, string> = {
    solo:          "solo traveler",
    couple:        "traveling as a romantic couple",
    family:        "family group with children",
    group:         "group of friends",
    undetermined:  "",
  };
  if (scores.pref_companion_type !== "undetermined")
    parts.push(companionMap[scores.pref_companion_type]);

  parts.push(`travel archetype: ${scores.archetype.replace(/_/g, " ")}`);

  return parts.filter(Boolean).join(". ");
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

export function processQuizResults(answers: QuizAnswer[]): UserProfileScores {
  const scores: Record<string, number> = {
    pref_budget_sensitivity:  0.5,
    pref_comfort_priority:    0.5,
    pref_adventure_level:     0.5,
    pref_hassle_free:         0.5,
    pref_social_atmosphere:   0.5,
    pref_cultural_depth:      0.5,
    pref_nature_affinity:     0.5,
    pref_nightlife:           0.3,
    pref_family_friendly:     0.5,
    pref_food_importance:     0.5,
    pref_planning_preference: 0.5,
  };

  for (const answer of answers) {
    for (const [key, delta] of Object.entries(answer.score_impact)) {
      if (key in scores) {
        scores[key] = Math.max(0, Math.min(1, scores[key] + (delta as number)));
      }
    }
  }

  const archetype = determineArchetype(scores);
  const confidence = calcArchetypeConfidence(scores, archetype);
  const companion  = determineCompanion(answers);

  return {
    archetype,
    archetype_confidence:     confidence,
    pref_budget_sensitivity:  scores.pref_budget_sensitivity,
    pref_comfort_priority:    scores.pref_comfort_priority,
    pref_adventure_level:     scores.pref_adventure_level,
    pref_hassle_free:         scores.pref_hassle_free,
    pref_social_atmosphere:   scores.pref_social_atmosphere,
    pref_cultural_depth:      scores.pref_cultural_depth,
    pref_nature_affinity:     scores.pref_nature_affinity,
    pref_nightlife:           scores.pref_nightlife,
    pref_family_friendly:     scores.pref_family_friendly,
    pref_food_importance:     scores.pref_food_importance,
    pref_planning_preference: scores.pref_planning_preference,
    pref_companion_type:      companion,
  };
}

function determineCompanion(answers: QuizAnswer[]): CompanionType {
  const q9 = answers.find(a => a.question_id === "Q9_COMPANION");
  if (!q9) return "undetermined";
  const map: Record<string, CompanionType> = {
    Q9_A: "solo",
    Q9_B: "couple",
    Q9_C: "family",
    Q9_D: "group",
  };
  return map[q9.answer_id] ?? "undetermined";
}

function determineArchetype(scores: Record<string, number>): Archetype {
  const rules: { name: Archetype; condition: boolean }[] = [
    {
      name: "luxury_curator",
      condition: scores.pref_comfort_priority > 0.7 && scores.pref_budget_sensitivity < 0.3,
    },
    {
      name: "efficiency_seeker",
      condition: scores.pref_hassle_free > 0.7 && scores.pref_budget_sensitivity < 0.6,
    },
    {
      name: "deep_relaxer",
      condition: scores.pref_comfort_priority > 0.65 && scores.pref_adventure_level < 0.45,
    },
    {
      name: "silent_explorer",
      condition: scores.pref_cultural_depth > 0.65 && scores.pref_social_atmosphere < 0.45,
    },
    {
      name: "budget_optimizer",
      condition: scores.pref_budget_sensitivity > 0.65,
    },
  ];

  const match = rules.find(r => r.condition);
  return match ? match.name : "deep_relaxer";
}

function calcArchetypeConfidence(scores: Record<string, number>, archetype: Archetype): number {
  const thresholds: Record<Archetype, Array<[string, number, "above" | "below"]>> = {
    luxury_curator:   [["pref_comfort_priority", 0.7, "above"], ["pref_budget_sensitivity", 0.3, "below"]],
    efficiency_seeker:[["pref_hassle_free", 0.7, "above"], ["pref_budget_sensitivity", 0.6, "below"]],
    deep_relaxer:     [["pref_comfort_priority", 0.65, "above"], ["pref_adventure_level", 0.45, "below"]],
    silent_explorer:  [["pref_cultural_depth", 0.65, "above"], ["pref_social_atmosphere", 0.45, "below"]],
    budget_optimizer: [["pref_budget_sensitivity", 0.65, "above"]],
    undetermined:     [],
  };

  const rules = thresholds[archetype];
  if (!rules || rules.length === 0) return 0.5;

  let totalMargin = 0;
  for (const [dim, threshold, direction] of rules) {
    const score = scores[dim] ?? 0.5;
    totalMargin += direction === "above"
      ? Math.max(0, score - threshold)
      : Math.max(0, threshold - score);
  }

  const avgMargin = totalMargin / rules.length;
  return Math.min(0.95, Math.round((0.55 + avgMargin * 1.2) * 100) / 100);
}
