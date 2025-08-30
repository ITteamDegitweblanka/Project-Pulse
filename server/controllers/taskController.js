const Task = require('../models/task');

// Helper: map DB row to client Task shape
function mapTaskRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description || '',
  status: row.status || '01.Task not started',
  priority: row.priority || 'Medium',
  deadline: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  assigneeId: row.assigned_to != null ? String(row.assigned_to) : null,
    endUserId: null,
    projectId: row.project_id != null ? String(row.project_id) : '',
    difficulty: 5,
  type: row.type || 'task',
  severity: row.severity,
  code: row.code,
  lastUpdated: row.updated_at ? new Date(row.updated_at).toISOString() : (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()),
  };
}

exports.getAllTasks = (req, res) => {
  Task.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    try {
      const mapped = results.map(mapTaskRow);
      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message || e });
    }
  });
};

exports.getTaskById = (req, res) => {
  Task.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Task not found' });
    res.json(mapTaskRow(result[0]));
  });
};

exports.createTask = (req, res) => {
  const b = req.body || {};
  const now = new Date();
  const toDateOnly = (iso) => {
    try {
      if (!iso) return null;
      return iso.includes('T') ? iso.split('T')[0] : iso;
    } catch { return null; }
  };
  // Whitelist and map to DB columns
  const data = {
    title: b.title,
    description: b.description || null,
    project_id: b.projectId != null ? Number(b.projectId) : null,
    assigned_to: b.assigneeId != null && b.assigneeId !== '' ? Number(b.assigneeId) : null,
    status: b.status || '01.Task not started',
    priority: b.priority || 'Medium',
    due_date: toDateOnly(b.deadline),
    created_at: now.toISOString().slice(0, 19).replace('T', ' '),
  };
  if (!data.title || data.project_id == null) {
    return res.status(400).json({ error: 'Missing required fields: title, projectId' });
  }
  Task.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage || err.message || err });
    const row = { id: result.insertId, ...data };
    // Respond in client Task shape; echo through optional client-only fields to keep UI state
    const response = {
      ...mapTaskRow({ ...row }),
      type: b.type || 'task',
      severity: b.severity,
      statusReason: b.statusReason,
    };
    res.status(201).json(response);
  });
};

exports.updateTask = (req, res) => {
  const b = req.body || {};
  const toDateOnly = (iso) => {
    try {
      if (!iso) return undefined;
      return iso.includes('T') ? iso.split('T')[0] : iso;
    } catch { return undefined; }
  };
  // Whitelist/mapping
  const allowed = {};
  if (b.title != null) allowed.title = b.title;
  if (b.description != null) allowed.description = b.description;
  if (b.projectId != null) allowed.project_id = Number(b.projectId);
  if (b.assigneeId !== undefined) allowed.assigned_to = b.assigneeId !== '' && b.assigneeId != null ? Number(b.assigneeId) : null;
  if (b.status != null) allowed.status = b.status;
  if (b.priority != null) allowed.priority = b.priority;
  if (b.deadline != null) allowed.due_date = toDateOnly(b.deadline);

  if (Object.keys(allowed).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  Task.update(req.params.id, allowed, (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage || err.message || err });
    res.json({ message: 'Task updated' });
  });
};

exports.deleteTask = (req, res) => {
  Task.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Task deleted' });
  });
};
