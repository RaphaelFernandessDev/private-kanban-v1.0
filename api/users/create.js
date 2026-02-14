const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("../_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const body = readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      sendJson(res, 400, { error: "Informe login e senha." });
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username) || !/^[a-zA-Z0-9._-]+$/.test(password)) {
      sendJson(res, 400, { error: "Use apenas letras, números, ponto, traço ou underline." });
      return;
    }

    const exists = await supabaseRequest(
      `/users?select=id&username=eq.${encodeFilterValue(username)}&limit=1`
    );
    if (Array.isArray(exists) && exists.length) {
      sendJson(res, 409, { error: "Este login já existe." });
      return;
    }

    const created = await supabaseRequest("/users", {
      method: "POST",
      body: [{ username, password_hash: password, role: "user" }],
    });

    sendJson(res, 201, { user: Array.isArray(created) ? created[0] : null });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};

