const GATE_SOURCE_SLUG = "gate-cs-top-one-percent";
const PROFILE_SOURCE_SLUG = "about-mantosh";

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
        answer: "GATE is a prestigious national examination conducted by IISc and the IITs. Mantosh ranked in the top 1% in CS & IT in both 2012 and 2013.",
        source
      };
    }
    return {
      answer: "Mantosh ranked in the top 1% in India's GATE Computer Science & Information Technology examination in both 2012 and 2013.",
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
