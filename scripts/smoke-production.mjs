const site = (process.env.SITE_URL || "https://mantoshkumar1.github.io").replace(/\/$/, "");
const worker = (process.env.WORKER_URL || "https://ask-mantosh.mantoshk234.workers.dev").replace(/\/$/, "");
const expectedRevision = process.env.EXPECTED_REVISION || "";
const attempts = Number(process.env.SMOKE_ATTEMPTS || 12);

async function waitFor(label, assertion) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await assertion(); }
    catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
  throw new Error(`${label}: ${lastError?.message || "failed"}`);
}

async function text(path) {
  const response = await fetch(`${site}${path}`, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

await waitFor("deployed revision", async () => {
  const response = await fetch(`${site}/deployment.json?revision=${encodeURIComponent(expectedRevision)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`deployment.json returned ${response.status}`);
  const deployment = await response.json();
  if (expectedRevision && deployment.revision !== expectedRevision) throw new Error(`expected ${expectedRevision}, received ${deployment.revision}`);
});
await waitFor("homepage", async () => {
  const html = await text("/");
  if (!html.includes("Turn engineering friction into reusable systems")) throw new Error("hero text missing");
});
await waitFor("knowledge-system evidence", async () => {
  const html = await text("/projects/engineering-knowledge-system.html");
  if (!html.includes("labelled cases")) throw new Error("evaluation evidence missing");
});
await waitFor("feed", async () => {
  const xml = await text("/feed.xml");
  if (!xml.includes("<feed") || !xml.includes("<entry>")) throw new Error("Atom feed structure missing");
});
await waitFor("Worker health", async () => {
  const response = await fetch(`${worker}/health`);
  const payload = await response.json();
  if (!response.ok || payload.success !== true) throw new Error(`health returned ${response.status}`);
});
await waitFor("deterministic Worker navigation", async () => {
  const response = await fetch(`${worker}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: site },
    body: JSON.stringify({ question: "How do I subscribe?", conversationId: `deployment_smoke_${Date.now()}` })
  });
  const payload = await response.json();
  if (!response.ok || payload.action?.url !== "/newsletter/" || payload.sources?.length) throw new Error(`navigation contract failed with ${response.status}`);
});

console.log(`Production smoke passed for ${site}, ${worker}, and revision ${expectedRevision || "unconstrained"}.`);
