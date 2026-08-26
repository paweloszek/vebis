// Simple keyword search over the knowledge base (no embeddings).
// input:  a user message (string)
// output: best-matching knowledge base items (array), most relevant first.
//
// Usage:
//   import { searchKnowledge } from "./utils/searchKnowledge.js";
//   const matches = searchKnowledge("ile kosztuje strona?");

import { knowledgeBase } from "../data/knowledgeBase.js";

// words too generic to be useful for matching (PL + EN)
const STOP_WORDS = new Set([
  "i", "oraz", "lub", "albo", "the", "a", "an", "and", "or", "to", "of", "in", "on",
  "jak", "co", "czy", "jest", "są", "być", "dla", "do", "na", "z", "ze", "za", "o",
  "w", "we", "po", "od", "przez", "moja", "moje", "mój", "twoja", "twoje", "wasz",
  "ile", "gdzie", "kiedy", "dlaczego", "który", "która", "które", "mi", "się",
]);

// Normalize text: lowercase, strip Polish diacritics, drop punctuation.
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove combining accents (ą ę ó ż ź ć ń ś)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Split any text into meaningful words (length >= 3).
function words(text) {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3);
}

// Turn a message into unique search tokens (drops stop words).
function tokenize(text) {
  return [...new Set(words(text).filter((w) => !STOP_WORDS.has(w)))];
}

// A token matches a word if they share a 4+ char prefix (absorbs Polish
// inflection: "technologii" ~ "technologie", "strona" ~ "strony") OR one
// contains the other (absorbs prefixed forms: "skontaktowac" ⊇ "kontakt").
function tokenMatchesWord(token, word) {
  if (token === word) return true;
  const prefix = Math.min(token.length, word.length, 5);
  if (prefix >= 4 && token.slice(0, prefix) === word.slice(0, prefix)) return true;
  const [short, long] = token.length <= word.length ? [token, word] : [word, token];
  return short.length >= 4 && long.includes(short);
}

/**
 * Search the knowledge base for the items most relevant to `message`.
 * @param {string} message - the user's message
 * @param {object} [options]
 * @param {number} [options.limit=3]    - max items to return
 * @param {number} [options.minScore=1] - minimum score required to be included
 * @returns {Array<{id, category, title, content, score}>}
 */
export function searchKnowledge(message, options = {}) {
  const { limit = 3, minScore = 1 } = options;
  const tokens = tokenize(message);
  if (tokens.length === 0) return [];

  const scored = knowledgeBase.map((item) => {
    const titleWords = words(item.title);
    const categoryWords = words(item.category);
    const contentWords = words(item.content);

    let score = 0;
    for (const token of tokens) {
      if (titleWords.some((w) => tokenMatchesWord(token, w))) score += 3; // title weighs most
      if (categoryWords.some((w) => tokenMatchesWord(token, w))) score += 2; // category is a strong hint
      score += contentWords.filter((w) => tokenMatchesWord(token, w)).length; // each body hit = 1
    }
    return { ...item, score };
  });

  return scored
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export default searchKnowledge;
