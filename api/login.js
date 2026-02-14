const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("./_supabase");
const bcrypt = require("bcryptjs");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      sendJson(res, 400, { error: "Informe login e senha." });
      return;
    }

    const users = await supabaseRequest(
      `/users?select=id,username,password_hash,role,last_login_at&username=eq.${encodeFilterValue(username)}&limit=1`
    );
    const user = Array.isArray(users) ? users[0] : null;

    let passwordOk = false;
    if (user) {
      if (user.password_hash === password) {
        passwordOk = true;
      } else {
        try {
          passwordOk = await bcrypt.compare(password, user.password_hash);
        } catch {
          passwordOk = false;
        }
      }
    }

    if (!user || !passwordOk) {
      sendJson(res, 401, { error: "Login ou senha invalidos." });
      return;
    }

    const lastLoginAt = new Date().toISOString();
    const updatedUsers = await supabaseRequest(
      `/users?id=eq.${encodeFilterValue(user.id)}`,
      {
        method: "PATCH",
        body: { last_login_at: lastLoginAt },
      }
    );
    const updated = Array.isArray(updatedUsers) ? updatedUsers[0] : user;

    sendJson(res, 200, {
      user: {
        id: updated.id,
        username: updated.username,
        password_hash: updated.password_hash,
        role: updated.role,
        last_login_at: updated.last_login_at,
      },
    });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};
