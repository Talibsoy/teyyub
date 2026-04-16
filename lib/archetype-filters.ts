// lib/archetype-filters.ts
// NatoureFly Personalization Engine — Archetype-specific API filters & scoring weights

import type { Archetype } from "./quiz-processor";

export interface ScoringWeights {
  price_weight: number;
  comfort_weight: number;
  duration_weight: number;  // uçuş müddəti / yerə məsafə
  match_weight: number;     // profil uyğunluğu
}

export interface DuffelFilters {
  max_connections: number;
  sort?: "total_duration" | "total_amount";
  cabin_class?: string[];
}

export interface RateHawkFilters {
  stars: number[];
  meal?: string[];
  hotel_type?: string[];
}

export interface ArchetypeConfig {
  duffel: DuffelFilters;
  ratehawk: RateHawkFilters;
  scoring_weights: ScoringWeights;
  ui_sort: "match_score" | "price" | "comfort" | "duration";
  ui_view: "list" | "grid" | "map";
  filter_rules: {
    block_multistop?: boolean;   // 2+ dayanacaqlı uçuşları blokla
    min_stars?: number;
    max_transfer_minutes?: number;
    prefer_independent?: boolean; // chain olmayan otellər
    show_savings_badge?: boolean; // qiymət qənaət badge-i
  };
}

export const ARCHETYPE_CONFIGS: Record<Archetype, ArchetypeConfig> = {
  efficiency_seeker: {
    duffel: {
      max_connections: 1,
      sort: "total_duration",
    },
    ratehawk: {
      stars: [4, 5],
    },
    scoring_weights: {
      duration_weight: 0.4,
      price_weight: 0.2,
      comfort_weight: 0.2,
      match_weight: 0.2,
    },
    ui_sort: "duration",
    ui_view: "list",
    filter_rules: {
      block_multistop: true,
      max_transfer_minutes: 20,
      min_stars: 4,
    },
  },

  deep_relaxer: {
    duffel: {
      max_connections: 1,
      cabin_class: ["business", "premium_economy", "economy"],
    },
    ratehawk: {
      stars: [4, 5],
      meal: ["all", "ultra", "breakfast"],
    },
    scoring_weights: {
      duration_weight: 0.1,
      price_weight: 0.1,
      comfort_weight: 0.5,
      match_weight: 0.3,
    },
    ui_sort: "comfort",
    ui_view: "grid",
    filter_rules: {
      min_stars: 4,
    },
  },

  silent_explorer: {
    duffel: {
      max_connections: 2,
    },
    ratehawk: {
      stars: [3, 4, 5],
      hotel_type: ["boutique", "guesthouse", "apartment"],
    },
    scoring_weights: {
      duration_weight: 0.1,
      price_weight: 0.2,
      comfort_weight: 0.1,
      match_weight: 0.6,
    },
    ui_sort: "match_score",
    ui_view: "map",
    filter_rules: {
      prefer_independent: true,
    },
  },

  budget_optimizer: {
    duffel: {
      max_connections: 2,
      sort: "total_amount",
    },
    ratehawk: {
      stars: [3, 4],
    },
    scoring_weights: {
      duration_weight: 0.1,
      price_weight: 0.5,
      comfort_weight: 0.1,
      match_weight: 0.3,
    },
    ui_sort: "price",
    ui_view: "list",
    filter_rules: {
      show_savings_badge: true,
    },
  },

  luxury_curator: {
    duffel: {
      max_connections: 0,
      cabin_class: ["business", "first"],
    },
    ratehawk: {
      stars: [5],
      meal: ["all", "ultra"],
    },
    scoring_weights: {
      duration_weight: 0.2,
      price_weight: 0.0,
      comfort_weight: 0.4,
      match_weight: 0.4,
    },
    ui_sort: "match_score",
    ui_view: "grid",
    filter_rules: {
      min_stars: 5,
      block_multistop: true,
    },
  },

  undetermined: {
    duffel: { max_connections: 2 },
    ratehawk: { stars: [3, 4, 5] },
    scoring_weights: {
      duration_weight: 0.25,
      price_weight: 0.25,
      comfort_weight: 0.25,
      match_weight: 0.25,
    },
    ui_sort: "match_score",
    ui_view: "grid",
    filter_rules: {},
  },
};

export function getArchetypeConfig(archetype: Archetype): ArchetypeConfig {
  return ARCHETYPE_CONFIGS[archetype] ?? ARCHETYPE_CONFIGS.undetermined;
}
