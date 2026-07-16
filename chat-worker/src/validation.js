import { badRequest } from "./errors.js";

const MAX_BODY_BYTES = 16 * 1024;
const AUDIENCES = new Set(["general", "recruiter", "hiring-manager", "engineer", "student"]);

export async function parseChatRequest(request, config) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw badRequest("Content-Type must be application/json.");
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) throw badRequest("Request body is too large.");

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    throw badRequest("Unable to read request body.");
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    throw badRequest("Request body is too large.");
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw badRequest("Malformed JSON body.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Request body must be a JSON object.");
  }
  if (typeof body.question !== "string") throw badRequest("question must be a string.");

  // Normalize whitespace and remove control characters; preserve meaning.
  const question = body.question.normalize("NFKC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  if (!question) throw badRequest("question must not be empty.");
  if (question.length > config.maxQuestionLength) {
    throw badRequest(`question must be at most ${config.maxQuestionLength} characters.`);
  }
  const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : crypto.randomUUID();
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(conversationId)) {
    throw badRequest("conversationId must be 16-128 URL-safe characters.");
  }
  const audience = typeof body.audience === "string" ? body.audience.trim().toLowerCase() : "general";
  if (!AUDIENCES.has(audience)) {
    throw badRequest("audience must be general, recruiter, hiring-manager, engineer, or student.");
  }
  return { question, conversationId, audience };
}
