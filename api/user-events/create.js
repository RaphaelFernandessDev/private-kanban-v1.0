const { readBody, sendJson, supabaseRequest } = require("../_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const id = String(body.id || "").trim();
    const type = String(body.type || "").trim();
    const userId = String(body.userId || "").trim();
    const username = String(body.username || "").trim();
    const timestamp = Number(body.timestamp || Date.now());

    if (!id || !type || !userId || !username) {
      sendJson(res, 400, { error: "Dados invalidos do evento." });
      return;
    }

    await supabaseRequest("/user_events", {
      method: "POST",
      body: [{
        id,
        type,
        user_id: userId,
        username,
        timestamp,
      }],
    });

    sendJson(res, 201, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    if (message.toLowerCase().includes("duplicate key")) {
      sendJson(res, 200, { ok: true });
      return;
    }
    sendJson(res, 500, { error: message });
  }
};
