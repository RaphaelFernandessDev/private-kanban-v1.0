const { sendJson, supabaseRequest } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const users = await supabaseRequest(
      "/users?select=id,username,password_hash,password_plain,role,last_login_at,created_at&order=username.asc"
    );

    sendJson(res, 200, { users });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};
