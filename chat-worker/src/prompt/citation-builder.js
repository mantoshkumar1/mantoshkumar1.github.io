export function sourceLabel(source) {
  const category = source.category[0].toUpperCase() + source.category.slice(1).replaceAll("-", " ");
  return `${category}: ${source.title}`;
}

export function toMarkdownCitation(source) {
  return `[${source.label || sourceLabel(source)}](${source.url})`;
}

export function deduplicateSources(sources) {
  return [...new Map(sources.map((source) => [source.url || source.slug, {
    ...source,
    label: source.label || sourceLabel(source)
  }])).values()];
}
