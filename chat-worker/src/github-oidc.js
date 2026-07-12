import { AppError } from "./errors.js";

const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
const DEFAULT_AUDIENCE = "ask-mantosh-indexer";
const DEFAULT_REPOSITORY = "mantoshkumar1/mantoshkumar1.github.io";
const DEFAULT_REF = "refs/heads/main";
const MAX_TOKEN_CHARS = 8_192;

function unauthorized() {
  throw new AppError(401, "unauthorized", "Unauthorized.");
}

function decodeBase64Url(value) {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    unauthorized();
  }
}

function decodeJson(value) {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
  } catch {
    unauthorized();
  }
}

function audienceMatches(value, expected) {
  return typeof value === "string" ? value === expected : Array.isArray(value) && value.includes(expected);
}

function validateClaims(claims, env) {
  const now = Math.floor(Date.now() / 1_000);
  const audience = env.GITHUB_OIDC_AUDIENCE || DEFAULT_AUDIENCE;
  const repository = env.GITHUB_REPOSITORY || DEFAULT_REPOSITORY;
  const ref = env.GITHUB_SYNC_REF || DEFAULT_REF;
  const workflowRef = `${repository}/.github/workflows/sync-knowledge.yml@${ref}`;
  if (claims.iss !== ISSUER || !audienceMatches(claims.aud, audience) || claims.repository !== repository || claims.ref !== ref || claims.workflow_ref !== workflowRef) unauthorized();
  if (!Number.isInteger(claims.exp) || claims.exp <= now || !Number.isInteger(claims.iat) || claims.iat > now + 60) unauthorized();
  if (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > now + 60)) unauthorized();
  if (!new Set(["push", "workflow_dispatch"]).has(claims.event_name)) unauthorized();
}

async function githubKey(kid) {
  const response = await fetch(JWKS_URL, {
    headers: { Accept: "application/json" },
    cf: { cacheEverything: true, cacheTtl: 3_600 }
  });
  if (!response.ok) throw new AppError(503, "oidc_keys_unavailable", "Indexer authentication is temporarily unavailable.");
  const declaredLength = Number(response.headers.get("Content-Length") || 0);
  if (declaredLength > 100_000) throw new AppError(503, "oidc_keys_invalid", "Indexer authentication is temporarily unavailable.");
  const body = await response.json();
  const key = Array.isArray(body?.keys) ? body.keys.find((candidate) => candidate.kid === kid && candidate.kty === "RSA" && candidate.use === "sig") : null;
  if (!key) unauthorized();
  return key;
}

export async function verifyGitHubOidcToken(token, env) {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_CHARS) unauthorized();
  const parts = token.split(".");
  if (parts.length !== 3) unauthorized();
  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const header = decodeJson(encodedHeader);
  const claims = decodeJson(encodedClaims);
  if (header.alg !== "RS256" || header.typ !== "JWT" || typeof header.kid !== "string") unauthorized();
  validateClaims(claims, env);
  const key = await crypto.subtle.importKey("jwk", await githubKey(header.kid), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodeBase64Url(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`));
  if (!valid) unauthorized();
  return claims;
}
