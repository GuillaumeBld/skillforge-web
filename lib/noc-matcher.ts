// lib/noc-matcher.ts
// Fuse.js fuzzy NOC matching against the corpus built by scripts/build_noc_corpus.py
// Falls back to the existing NOC_LOOKUP dictionary if corpus is not loaded.

import Fuse from "fuse.js";
import { NOC_LOOKUP } from "./noc-lookup";

export interface NocMatch {
  code: string;
  title: string;
  score: number; // 0 = perfect, 1 = worst
}

interface NocEntry {
  code: string;
  title: string;
}

let _fuse: Fuse<NocEntry> | null = null;
let _loading = false;
let _loadPromise: Promise<void> | null = null;

async function loadCorpus(): Promise<void> {
  if (_fuse || _loading) return;
  _loading = true;
  try {
    const resp = await fetch("/noc-titles.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const entries: NocEntry[] = await resp.json();
    _fuse = new Fuse(entries, {
      keys: ["title"],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 3,
      includeScore: true,
    });
  } catch (err) {
    console.warn("NOC corpus not loaded, will use dictionary fallback:", err);
  } finally {
    _loading = false;
  }
}

// Eagerly start loading on module import
_loadPromise = loadCorpus();

export async function matchNoc(title: string, topK = 3): Promise<NocMatch[]> {
  await _loadPromise;

  const query = title.trim();
  if (!query) return [];

  if (_fuse) {
    const results = _fuse.search(query, { limit: topK });
    return results.map((r) => ({
      code: r.item.code,
      title: r.item.title,
      score: r.score ?? 1,
    }));
  }

  // Fallback to existing dictionary
  const key = query.toLowerCase();
  const exact = NOC_LOOKUP[key];
  if (exact) return [{ code: exact.code, title: exact.title, score: 0 }];
  for (const [k, v] of Object.entries(NOC_LOOKUP)) {
    if (key.includes(k) || k.includes(key)) {
      return [{ code: v.code, title: v.title, score: 0.3 }];
    }
  }
  return [];
}

export function matchNocSync(title: string): NocMatch | null {
  // Synchronous fallback using dictionary only — for use before corpus loads
  const key = title.toLowerCase().trim();
  if (NOC_LOOKUP[key]) {
    return { code: NOC_LOOKUP[key].code, title: NOC_LOOKUP[key].title, score: 0 };
  }
  for (const [k, v] of Object.entries(NOC_LOOKUP)) {
    if (key.includes(k) || k.includes(key)) {
      return { code: v.code, title: v.title, score: 0.3 };
    }
  }
  return null;
}
