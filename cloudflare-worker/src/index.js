/**
 * Tactics AI Gateway
 * Gateway بين Frontend و Groq API. لا يحلل ولا يعالج فيديو.
 */

const ALLOWED_ORIGINS = [
  "https://njr706380-cmd.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/" || path === "/health") {
        return jsonResponse(
          { status: "ok", service: "tactics-ai-gateway", version: "0.1.0" },
          200, cors
        );
      }

      if (path === "/api/chat") {
        if (request.method !== "POST") {
          return jsonResponse({ error: "method_not_allowed" }, 405, cors);
        }
        return await proxyGroq(request, env, cors);
      }

      if (path.startsWith("/api/v1/analyze")) {
        return await proxyBackend(request, env, cors);
      }

      return jsonResponse({ error: "not_found", path }, 404, cors);
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse(
        { error: "internal_error", message: "الخدمة غير متاحة مؤقتًا" },
        500, cors
      );
    }
  },
};

async function proxyGroq(request, env, cors) {
  if (!env.GROQ_API_KEY) {
    return jsonResponse(
      { error: "server_misconfigured", message: "GROQ_API_KEY غير مضبوط" },
      500, cors
    );
  }
  const body = await request.text();
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body,
  });
  const data = await groqRes.text();
  return new Response(data, {
    status: groqRes.status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

async function proxyBackend(request, env, cors) {
  if (!env.BACKEND_URL) {
    return jsonResponse(
      { error: "not_implemented", message: "Backend لم يُفعّل بعد." },
      503, cors
    );
  }
  const url = new URL(request.url);
  const backendRes = await fetch(env.BACKEND_URL + url.pathname + url.search, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
    },
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer(),
  });
  const data = await backendRes.text();
  return new Response(data, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("Content-Type") || "application/json; charset=utf-8",
      ...cors,
    },
  });
    }
