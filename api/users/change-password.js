const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("../_supabase");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const userId = String(body.userId || "").trim();
    const currentPassword = String(body.currentPassword || "");
    const nextPassword = String(body.nextPassword || "");

    if (!userId || !currentPassword || !nextPassword) {
      sendJson(res, 400, { error: "Dados invalidos para alteracao de senha." });
      return;
    }

    const users = await supabaseRequest(
      `/users?select=id,username,password_hash,role&id=eq.${encodeFilterValue(userId)}&limit=1`
    );
    const user = Array.isArray(users) ? users[0] : null;

    if (!user) {
      sendJson(res, 404, { error: "Usuario nao encontrado." });
      return;
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordOk) {
      sendJson(res, 401, { error: "Senha atual incorreta." });
      return;
    }

    const nextHash = await bcrypt.hash(nextPassword, 10);
    const updated = await supabaseRequest(
      `/users?id=eq.${encodeFilterValue(userId)}`,
      {
        method: "PATCH",
        body: { password_hash: nextHash },
      }
    );

    sendJson(res, 200, { user: Array.isArray(updated) ? updated[0] : user });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};
