/**
 * @file exercise-search.ts
 * @description High-performance (<50ms) exercise search engine for the 6,554-exercise catalogue.
 * Implements gym shorthand expansion (e.g. "db", "rdl", "ohp", "bb"), Damerau-Levenshtein typo tolerance,
 * multi-token matching, and ranking by relevance.
 */

import { RagExercise } from '@/types/exercise-rag';
import { loadExerciseCatalogue } from './catalogue-loader';

export const GYM_SHORTHANDS: Record<string, string[]> = {
  db: ['dumbbell'],
  dbs: ['dumbbell'],
  bb: ['barbell'],
  kb: ['kettlebell'],
  kbs: ['kettlebell'],
  ez: ['ez barbell'],
  sm: ['smith machine', 'smith'],
  bw: ['body weight'],
  bodyweight: ['body weight'],
  ohp: ['overhead press', 'shoulder press', 'military press'],
  rdl: ['romanian deadlift'],
  sldl: ['stiff leg deadlift'],
  dl: ['deadlift'],
  bp: ['bench press'],
  skullcrusher: ['lying triceps extension', 'skull crusher'],
  skullcrushers: ['lying triceps extension', 'skull crusher'],
  pulldown: ['pull down', 'pulldown'],
  pullup: ['pull up', 'pull-up'],
  chinup: ['chin up', 'chin-up'],
  pushup: ['push up', 'push-up'],
  pressup: ['push up', 'push-up'],
  situp: ['sit up', 'sit-up'],
  flye: ['fly'],
  flyes: ['fly'],
  flies: ['fly'],
  abs: ['crunch', 'abs', 'abdominal'],
  hammy: ['hamstring'],
  hammies: ['hamstring'],
  quad: ['quads', 'quadriceps'],
  quads: ['quadriceps', 'quad'],
  tricep: ['triceps'],
  bicep: ['biceps'],
  delt: ['delts', 'deltoids', 'shoulder'],
  delts: ['deltoids', 'shoulder'],
  lat: ['lats', 'latissimus dorsi', 'pulldown'],
  lats: ['latissimus dorsi'],
  trap: ['traps', 'trapezius', 'shrug'],
  traps: ['trapezius', 'shrug'],
  glute: ['glutes', 'gluteal'],
  glutes: ['gluteal', 'glutes'],
  calf: ['calves', 'calf'],
  calves: ['calf', 'calves'],
  rope: ['rope'],
  trx: ['suspension'],
  kettle: ['kettlebell'],
  dumbel: ['dumbbell'],
  'pull-up': ['pull up', 'pullup'],
  'chin-up': ['chin up', 'chinup'],
  'push-up': ['push up', 'pushup'],
  'sit-up': ['sit up', 'situp'],
  'pull-down': ['pull down', 'pulldown'],
  'bench-press': ['bench press'],
  'benchpress': ['bench press'],
  'dead-lift': ['deadlift'],
};

export const normalizeStr = (s?: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] | null = null;
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

const typosAllowed = (word: string): number => (word.length < 4 ? 0 : word.length < 7 ? 1 : 2);

function formsOf(tok: string): string[] {
  const forms = [tok];
  const synonyms = GYM_SHORTHANDS[tok];
  if (synonyms) {
    forms.push(...synonyms);
  }
  if (tok.includes('-')) {
    forms.push(tok.replace(/-/g, ' '), tok.replace(/-/g, ''));
  }
  if (tok.length >= 4 && tok.endsWith('es') && !tok.endsWith('ses')) {
    forms.push(tok.slice(0, -2), tok.slice(0, -1));
  } else if (tok.length >= 4 && tok.endsWith('ses')) {
    forms.push(tok.slice(0, -2));
  } else if (tok.length >= 3 && tok.endsWith('s') && !tok.endsWith('ss') && tok !== 'abs') {
    forms.push(tok.slice(0, -1));
  }
  return Array.from(new Set(forms));
}

interface IndexedCorpus {
  id: string;
  name: string;
  nameWords: string[];
  nameWordSet: Set<string>;
  joinedName: string;
  fullHaystack: string;
}

interface SearchIndex {
  exercises: RagExercise[];
  corpora: IndexedCorpus[];
  vocab: Set<string>;
  wordToCorpora: Map<string, number[]>;
}

let cachedIndex: SearchIndex | null = null;

function getSearchIndex(): SearchIndex {
  if (cachedIndex) return cachedIndex;

  const { exercises } = loadExerciseCatalogue();
  const vocab = new Set<string>();
  const wordToCorpora = new Map<string, number[]>();

  const corpora: IndexedCorpus[] = exercises.map((e, idx) => {
    const normName = normalizeStr(e.name);
    const words = normName.split(/[\s\-‐-―()/,]+/).filter(Boolean);
    const wordSet = new Set<string>(words);

    const joined = normName.replace(/[\s\-‐-―]+/g, '');
    const haystack = normalizeStr([
      normName,
      e.target,
      e.equipment,
      e.bodyPart,
      ...(e.secondaryMuscles || []),
      e.description,
    ].join(' '));

    const haystackWords = haystack.split(/[\s\-‐-―()/,]+/).filter(Boolean);
    const allUniqueWords = new Set<string>([...words, ...haystackWords]);

    for (const w of allUniqueWords) {
      vocab.add(w);
      let list = wordToCorpora.get(w);
      if (!list) {
        list = [];
        wordToCorpora.set(w, list);
      }
      list.push(idx);
    }

    return {
      id: e.id,
      name: normName,
      nameWords: words,
      nameWordSet: wordSet,
      joinedName: joined,
      fullHaystack: haystack,
    };
  });

  cachedIndex = { exercises, corpora, vocab, wordToCorpora };
  return cachedIndex;
}

export interface SearchOptions {
  limit?: number;
  thresholdScore?: number;
}

interface ProcessedForm {
  form: string;
  clean: string;
  isMultiWord: boolean;
}

/**
 * Searches the 6,554-exercise catalogue with high performance (<50ms).
 * Supports gym shorthands, typo tolerance, multi-token queries, and relevance ranking.
 */
export function searchExercises(
  query: string,
  options: SearchOptions = {}
): RagExercise[] {
  const normQuery = normalizeStr(query).trim();
  const limit = Math.max(0, options.limit ?? 30);
  if (!normQuery) {
    const { exercises } = loadExerciseCatalogue();
    return exercises.slice(0, Math.max(0, options.limit ?? 25));
  }

  const { exercises, corpora, vocab, wordToCorpora } = getSearchIndex();
  const cleanedQuery = normQuery.replace(/[(),/:]/g, ' ');
  const tokens = cleanedQuery.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return exercises.slice(0, Math.max(0, options.limit ?? 25));
  }

  // Prepare token forms and precompute clean string variants outside the corpus loop
  const tokenFormsData: ProcessedForm[][] = tokens.map((tok) => {
    const rawForms = formsOf(tok);
    return rawForms.map((f) => ({
      form: f,
      clean: f.replace(/[\s\-]+/g, ''),
      isMultiWord: f.includes(' '),
    }));
  });

  // Fast vocabulary-based typo check check without scanning corpora
  const needsTypoCheck = tokens.map((tok, idx) => {
    if (GYM_SHORTHANDS[tok]) return false;
    if (vocab.has(tok)) return false;
    const forms = tokenFormsData[idx];
    if (forms.some((item) => vocab.has(item.form) || item.form.split(/\s+/).every((w) => vocab.has(w)))) {
      return false;
    }
    return true;
  });

  // Precompute typo matches for tokens that genuinely need it across vocabulary
  const typoMatchingWords: Map<string, Set<string>> = new Map();
  for (let idx = 0; idx < tokens.length; idx++) {
    if (!needsTypoCheck[idx]) continue;
    for (const item of tokenFormsData[idx]) {
      const maxTypos = typosAllowed(item.form);
      if (maxTypos <= 0) continue;
      const matched = new Set<string>();
      for (const w of vocab) {
        if (editDistance(item.form, w, maxTypos) <= maxTypos) {
          matched.add(w);
        }
      }
      if (matched.size > 0) {
        typoMatchingWords.set(item.form, matched);
      }
    }
  }

  // Intersect candidate posting lists across all tokens
  let candidateIndices: Set<number> | null = null;

  for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
    const formItems = tokenFormsData[tIdx];
    const tokenCandidates = new Set<number>();

    for (const item of formItems) {
      const { form, clean, isMultiWord } = item;

      if (!isMultiWord) {
        // Direct word match
        const list = wordToCorpora.get(form);
        if (list) {
          for (let k = 0; k < list.length; k++) tokenCandidates.add(list[k]);
        }
        // Plural / singular variants O(1)
        const sVariant = wordToCorpora.get(form + 's');
        if (sVariant) {
          for (let k = 0; k < sVariant.length; k++) tokenCandidates.add(sVariant[k]);
        }
        const esVariant = wordToCorpora.get(form + 'es');
        if (esVariant) {
          for (let k = 0; k < esVariant.length; k++) tokenCandidates.add(esVariant[k]);
        }
        if (form.endsWith('s')) {
          const sing = wordToCorpora.get(form.slice(0, -1));
          if (sing) {
            for (let k = 0; k < sing.length; k++) tokenCandidates.add(sing[k]);
          }
        }
        if (form.endsWith('es')) {
          const sing = wordToCorpora.get(form.slice(0, -2));
          if (sing) {
            for (let k = 0; k < sing.length; k++) tokenCandidates.add(sing[k]);
          }
        }

        // Typo matching words
        if (needsTypoCheck[tIdx]) {
          const matchSet = typoMatchingWords.get(form);
          if (matchSet) {
            for (const mw of matchSet) {
              const tList = wordToCorpora.get(mw);
              if (tList) {
                for (let k = 0; k < tList.length; k++) tokenCandidates.add(tList[k]);
              }
            }
          }
        }

        // Fall back to prefix / substring match in vocabulary only if no exact/plural hit
        if (tokenCandidates.size === 0 && form.length >= 3) {
          for (const w of vocab) {
            if (w.startsWith(form) || (form.length >= 4 && w.includes(form))) {
              const pList = wordToCorpora.get(w);
              if (pList) {
                for (let k = 0; k < pList.length; k++) tokenCandidates.add(pList[k]);
              }
            }
          }
        }
      } else {
        // Multi-word phrase (e.g. "bench press", "overhead press")
        const subWords = form.split(/\s+/).filter(Boolean);
        const firstList = wordToCorpora.get(subWords[0]);
        if (firstList) {
          for (let k = 0; k < firstList.length; k++) {
            const idx = firstList[k];
            const c = corpora[idx];
            if (c.name.includes(form) || c.fullHaystack.includes(form)) {
              tokenCandidates.add(idx);
            }
          }
        }
      }

      // If no candidates found and clean length >= 4, check joined name
      if (tokenCandidates.size === 0 && clean.length >= 4) {
        for (let i = 0; i < corpora.length; i++) {
          if (corpora[i].joinedName.includes(clean)) {
            tokenCandidates.add(i);
          }
        }
      }
    }

    if (candidateIndices === null) {
      candidateIndices = tokenCandidates;
    } else {
      const next = new Set<number>();
      for (const idx of candidateIndices) {
        if (tokenCandidates.has(idx)) {
          next.add(idx);
        }
      }
      candidateIndices = next;
    }

    if (candidateIndices.size === 0) {
      return [];
    }
  }

  if (!candidateIndices || candidateIndices.size === 0) {
    return [];
  }

  const scored: { exercise: RagExercise; score: number }[] = [];

  for (const i of candidateIndices) {
    const c = corpora[i];
    let totalScore = 0;
    let allTokensMatched = true;

    for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
      const formItems = tokenFormsData[tIdx];
      let bestTokenScore = 0;

      for (let fIdx = 0; fIdx < formItems.length; fIdx++) {
        const { form, clean } = formItems[fIdx];

        // 1. Exact match on whole name
        if (c.name === form) {
          bestTokenScore = Math.max(bestTokenScore, 120);
          continue;
        }

        // 2. Exact word match in name
        if (c.nameWordSet.has(form)) {
          bestTokenScore = Math.max(bestTokenScore, 100);
          continue;
        }

        // 3. Name starts with form or contains phrase
        if (c.name.startsWith(form) || c.name.includes(form)) {
          bestTokenScore = Math.max(bestTokenScore, 80);
          continue;
        }

        // 4. Joined name match (e.g. "benchpress" matches "bench press")
        if (clean.length >= 4 && c.joinedName.includes(clean)) {
          bestTokenScore = Math.max(bestTokenScore, 70);
          continue;
        }

        // 5. Match in target, equipment, or secondary muscles
        if (c.fullHaystack.includes(form)) {
          bestTokenScore = Math.max(bestTokenScore, 40);
          continue;
        }

        // 6. Typo tolerance (only evaluated if token has no exact hit in dataset)
        if (needsTypoCheck[tIdx]) {
          const matchSet = typoMatchingWords.get(form);
          if (matchSet && c.nameWords.some((w) => matchSet.has(w))) {
            bestTokenScore = Math.max(bestTokenScore, 50);
          }
        }
      }

      if (bestTokenScore === 0) {
        allTokensMatched = false;
        break;
      }
      totalScore += bestTokenScore;
    }

    if (allTokensMatched && totalScore > 0) {
      scored.push({ exercise: exercises[i], score: totalScore });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.exercise.name.length - b.exercise.name.length);
  return scored.slice(0, limit).map((s) => s.exercise);
}
