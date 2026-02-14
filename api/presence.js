const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const userId = String(body.userId || "").trim();
    const offline = Boolean(body.offline);

    if (!userId) {
      sendJson(res, 400, { error: "Usuario invalido." });
      return;
    }

    const payload = offline
      ? { last_login_at: null }
      : { last_login_at: new Date().toISOString() };

    const updated = await supabaseRequest(
      `/users?id=eq.${encodeFilterValue(userId)}`,
      {
        method: "PATCH",
        body: payload,
      }
    );

    sendJson(res, 200, { user: Array.isArray(updated) ? updated[0] : null });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};

