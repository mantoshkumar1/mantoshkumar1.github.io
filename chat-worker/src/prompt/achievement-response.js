const GATE_SOURCE_SLUG = "gate-cs-top-one-percent";
const PROFILE_SOURCE_SLUG = "about-mantosh";
const GATE_RESULT = "Mantosh ranked in the top 0.76% among 156,780 candidates in India's GATE CS & IT examination in 2012 and the top 0.87% among 224,160 candidates in 2013.";

function sourceBySlug(sources, slug) {
  return sources.find((source) => source.slug === slug);
}

export function conciseAchievementResponse(question, sources = []) {
  const value = String(question || "").trim();

  if (/\bgate\b/i.test(value)) {
    const source = sourceBySlug(sources, GATE_SOURCE_SLUG);
    if (!source) return null;

    if (/\b(?:tum|technical university of munich|admission|master'?s|m\.?sc\.?)\b/i.test(value)) {
      return {
        answer: "Mantosh says a GATE result formed part of his admission journey to TUM's M.Sc. in Computer Science; his published résumé confirms the completed degree.",
        source
      };
    }
    if (/\b(?:what is|prestig\w*|why.*(?:matter|notable)|conducted|exam(?:ination)?)\b/i.test(value)) {
      return {
        answer: `GATE is a prestigious national examination conducted by IISc and the IITs. ${GATE_RESULT}`,
        source
      };
    }
    return {
      answer: GATE_RESULT,
      source
    };
  }

  if (/\b(?:heroes of tomorrow|intel\s+(?:heroes|awards?)|awards?\s+(?:at|from)\s+intel)\b/i.test(value)) {
    const source = sourceBySlug(sources, PROFILE_SOURCE_SLUG);
    if (!source) return null;
    return {
      answer: "Mantosh received two Intel Heroes of Tomorrow awards for outstanding engineering contributions.",
      source
    };
  }

  return null;
}
