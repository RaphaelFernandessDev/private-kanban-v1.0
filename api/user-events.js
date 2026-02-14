const { sendJson, supabaseRequest } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Metodo nao permitido." });
    return;
  }

  try {
    const events = await supabaseRequest(
      "/user_events?select=id,type,user_id,username,timestamp&order=timestamp.desc"
    );

    sendJson(res, 200, { events: Array.isArray(events) ? events : [] });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
  }
};

