// lib/product-suggest.js
// "Did you mean …?" matching for the soft-404 on /shop/<unknown-slug>.
//
// Pure functions over a candidate list the CALLER supplies, so the suggestions
// can come from the database. They used to live in lib/data.js and scored the
// static seed catalogue, which meant the 404 page could suggest a product an
// admin had since deleted (clicking it produced another 404) and showed the seed
// price rather than the current one.
//
// A candidate only needs `{ slug, name }`.

// Pure JS Levenshtein distance.
function levenshtein(a, b) {
    const m = a.length,
        n = b.length;
    if (!m) return n;
    if (!n) return m;
    // Single-row DP   O(min(m,n)) memory.
    const prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
        let last = prev[0];
        prev[0] = i;
        for (let j = 1; j <= n; j++) {
            const tmp = prev[j];
            prev[j] =
                a[i - 1] === b[j - 1]
                    ? last
                    : 1 + Math.min(last, prev[j], prev[j - 1]);
            last = tmp;
        }
    }
    return prev[n];
}

// Normalised similarity in [0..1]. 1 = identical, 0 = nothing in common.
function similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Best similarity between the query and any of: full slug, the product name with
// spaces → dashes, and each individual token (≥ 3 chars) of the slug. This
// handles typos AND missing/extra parts ("cabage" → "chinese-cabbage" via the
// "cabbage" token, "grenapl" → "green-apple" via the full slug).
function bestSimilarity(query, product) {
    const q = query.toLowerCase();
    const slug = String(product.slug || "").toLowerCase();
    const nameSlug = String(product.name || "")
        .toLowerCase()
        .replace(/\s+/g, "-");

    let best = Math.max(similarity(q, slug), similarity(q, nameSlug));
    for (const tok of slug.split("-")) {
        if (tok.length >= 3) best = Math.max(best, similarity(q, tok));
    }
    return best;
}

// Top `n` candidates by similarity to `slug`, as `{ product, similarity }` so the
// caller can decide whether a suggestion is worth showing.
export function findNearestProducts(slug, candidates = [], n = 4) {
    const q = String(slug || "").toLowerCase();
    return candidates
        .map((p) => ({ product: p, similarity: bestSimilarity(q, p) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, n);
}

// Only show a "did you mean" when it crosses a similarity threshold   otherwise
// we'd be making a confident claim to someone who typed random characters.
export function isGoodSuggestion(_query, suggestion) {
    return Boolean(suggestion && suggestion.similarity >= 0.6);
}
