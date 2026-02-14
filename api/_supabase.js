function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }
  return value;
}

function getSupabaseConfig() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!serviceRoleKey) {
    throw new Error("Variavel de ambiente ausente: SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)");
  }

  return {
    url: getEnv("SUPABASE_URL"),
    serviceRoleKey,
  };
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

async function supabaseRequest(path, { method = "GET", body } = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = data?.message || data?.error || "Falha ao consultar banco de dados.";
    throw new Error(errorMessage);
  }

  return data;
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function readBody(req) {
  if (!req?.body) {
    return {};
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = {
  encodeFilterValue,
  readBody,
  sendJson,
  supabaseRequest,
};
