const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("../_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const userId = String(body.userId || "").trim();
    if (!userId) {
      sendJson(res, 400, { error: "Usuário inválido." });
      return;
    }

    const users = await supabaseRequest(
      `/users?select=id,role&id=eq.${encodeFilterValue(userId)}&limit=1`
    );
    const user = Array.isArray(users) ? users[0] : null;

    if (!user) {
      sendJson(res, 404, { error: "Usuário não encontrado." });
      return;
    }

    if (user.role === "admin") {
      sendJson(res, 400, { error: "Não é permitido excluir o Admin." });
      return;
    }

    await supabaseRequest(`/users?id=eq.${encodeFilterValue(userId)}`, { method: "DELETE" });

    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};

