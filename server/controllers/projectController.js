const Project = require('../models/project');

function parseProjectJsonFields(project) {
  if (project.team) try { project.team = JSON.parse(project.team); } catch {}
  if (project.users) try { project.users = JSON.parse(project.users); } catch {}
  if (project.toolsUsed) try { project.toolsUsed = JSON.parse(project.toolsUsed); } catch {}
  if (project.latestComments) try { project.latestComments = JSON.parse(project.latestComments); } catch {}
  if (project.lastUsedBy) try { project.lastUsedBy = JSON.parse(project.lastUsedBy); } catch {}
  if (project.usedHours != null) {
    const n = Number(project.usedHours);
    project.usedHours = Number.isFinite(n) && n > 0 ? n : 0;
  }
  return project;
}

exports.getAllProjects = (req, res) => {
  Project.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    const parsedResults = results.map(parseProjectJsonFields);
    res.json(parsedResults);
  });
};

exports.getProjectById = (req, res) => {
  Project.getById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result.length) return res.status(404).json({ error: 'Project not found' });
    res.json(parseProjectJsonFields(result[0]));
  });
};

exports.createProject = (req, res) => {
  console.log('DEBUG: Incoming req.body:', req.body);
  const newProject = { ...req.body };
  // Map parentId to parent_id for MySQL, handle string/number
  if ('parentId' in newProject && newProject.parentId != null && String(newProject.parentId).trim() !== '') {
    newProject.parent_id = parseInt(newProject.parentId, 10);
    delete newProject.parentId;
  }
  // Serialize JSON fields
  if (newProject.team) newProject.team = JSON.stringify(newProject.team);
  if (newProject.users) newProject.users = JSON.stringify(newProject.users);
  if (newProject.toolsUsed) newProject.toolsUsed = JSON.stringify(newProject.toolsUsed);
  if (newProject.latestComments) newProject.latestComments = JSON.stringify(newProject.latestComments);
  if (newProject.lastUsedBy) newProject.lastUsedBy = JSON.stringify(newProject.lastUsedBy);
  // If frontend provides created_at, use it; otherwise, use current local time
  if (!newProject.created_at) {
    // Sri Lanka is UTC+5:30
    const offsetMinutes = 5.5 * 60;
    const localDate = new Date(Date.now() + offsetMinutes * 60 * 1000);
    // Use local time in ISO format with correct offset
    newProject.created_at = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');
  }
  // Keep timerStartTime as provided; DB will store DATETIME without TZ
  // Remove any createdAt field to avoid MySQL error
  delete newProject.createdAt;
  console.log('DEBUG: FINAL newProject object for DB insert:', newProject);
  if ('parent_id' in newProject) {
    console.log('DEBUG: parent_id value before DB insert:', newProject.parent_id, 'typeof:', typeof newProject.parent_id);
  } else {
    console.log('DEBUG: parent_id is missing from newProject before DB insert');
  }
  Project.create(newProject, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    // Fetch the full project from DB to ensure parent_id is included
    Project.getById(result.insertId, (err2, rows) => {
      if (err2 || !rows || !rows.length) {
        return res.status(201).json({ id: result.insertId, ...newProject });
      }
      res.status(201).json(parseProjectJsonFields(rows[0]));
    });
  });
};

exports.updateProject = (req, res) => {
  const projectId = req.params.id;

  // Map client aliases to DB columns
  const aliasMap = {
    leadId: 'owner_id',
    teamId: 'team_id',
  startDate: 'start_date', // client may send camelCase; DB uses snake_case
  };

  // Columns that actually exist in the projects table (per schema)
  const allowedDbFields = new Set([
    'name', 'description', 'end_date', 'status', 'owner_id', 'team_id', 'beneficiary', 'created_at',
  'timerStartTime', 'usedHours', 'completedAt', 'phase', 'start_date', 'allocatedHours', 'milestoneDate',
    'team', 'users', 'toolsUsed', 'latestComments', 'additionalHours', 'savedHours', 'expectedSavedHours',
    'lastUsedBy'
  ]);

  const jsonFields = new Set(['team', 'users', 'toolsUsed', 'latestComments', 'lastUsedBy']);

  const updateData = {};
  for (const [key, value] of Object.entries(req.body || {})) {
    const targetKey = aliasMap[key] || key;
    if (!allowedDbFields.has(targetKey)) {
      continue; // skip unknown/nonexistent columns
    }
    if (jsonFields.has(targetKey) && value) {
      updateData[targetKey] = JSON.stringify(value);
    } else {
      updateData[targetKey] = value;
    }
  }

  // Coerce and clamp usedHours to non-negative number
  if (Object.prototype.hasOwnProperty.call(updateData, 'usedHours')) {
    const n = Number(updateData['usedHours']);
    updateData['usedHours'] = Number.isFinite(n) && n > 0 ? n : 0;
  }

  // Normalize incoming date-time strings to MySQL DATETIME (local) to avoid TZ confusion
  const toMySQLLocal = (d) => {
    if (!d) return d;
    const date = new Date(d);
    if (isNaN(date.getTime())) return d; // leave as-is if unparsable
    const pad = (x) => String(x).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const MI = pad(date.getMinutes());
    const SS = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${HH}:${MI}:${SS}`;
  };
  if (Object.prototype.hasOwnProperty.call(updateData, 'timerStartTime') && updateData['timerStartTime']) {
    updateData['timerStartTime'] = toMySQLLocal(updateData['timerStartTime']);
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'completedAt') && updateData['completedAt']) {
    updateData['completedAt'] = toMySQLLocal(updateData['completedAt']);
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'created_at') && updateData['created_at']) {
    updateData['created_at'] = toMySQLLocal(updateData['created_at']);
  }
  if (Object.prototype.hasOwnProperty.call(updateData, 'start_date') && updateData['start_date']) {
    updateData['start_date'] = toMySQLLocal(updateData['start_date']);
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  Project.update(projectId, updateData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update project', details: err });
    }
    Project.getById(projectId, (err2, updatedProject) => {
      if (err2) {
        return res.status(500).json({ error: 'Failed to fetch updated project', details: err2 });
      }
      res.json(updatedProject && updatedProject[0] ? parseProjectJsonFields(updatedProject[0]) : {});
    });
  });
};

exports.deleteProject = (req, res) => {
  Project.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Project deleted' });
  });
};
