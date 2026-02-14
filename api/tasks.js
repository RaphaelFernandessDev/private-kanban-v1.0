const { encodeFilterValue, readBody, sendJson, supabaseRequest } = require("./_supabase");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const userId = String(req.query?.userId || "").trim();
      if (!userId) {
        sendJson(res, 400, { error: "Usuario invalido." });
        return;
      }

      const tasks = await supabaseRequest(
        `/tasks?select=id,user_id,title,priority,due_date,details,images,status,created_at&user_id=eq.${encodeFilterValue(userId)}&order=created_at.desc`
      );
      sendJson(res, 200, { tasks: Array.isArray(tasks) ? tasks : [] });
      return;
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
      return;
    }
  }

  if (req.method === "POST") {
    try {
      const body = readBody(req);
      const userId = String(body.userId || "").trim();
      const taskList = Array.isArray(body.tasks) ? body.tasks : [];

      if (!userId) {
        sendJson(res, 400, { error: "Usuario invalido." });
        return;
      }

      await supabaseRequest(`/tasks?user_id=eq.${encodeFilterValue(userId)}`, { method: "DELETE" });

      if (taskList.length) {
        const payload = taskList.map((task) => ({
          id: String(task.id || ""),
          user_id: userId,
          title: String(task.title || ""),
          priority: String(task.priority || "media"),
          due_date: task.dueDate || null,
          details: String(task.details || ""),
          images: Array.isArray(task.images) ? task.images : [],
          status: String(task.status || "todo"),
          created_at: task.createdAt || new Date().toISOString(),
        }));

        await supabaseRequest("/tasks", {
          method: "POST",
          body: payload,
        });
      }

      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Erro interno." });
    }
    return;
  }

  sendJson(res, 405, { error: "Metodo nao permitido." });
};

