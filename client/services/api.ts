const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || 'http://localhost:3001';

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} at ${url}: ${bodyText.slice(0, 200)}`);
  }
  try {
    if (contentType.includes('application/json')) {
      return JSON.parse(bodyText);
    }
    // Try JSON anyway; if it fails, show a useful snippet
    return JSON.parse(bodyText);
  } catch {
    throw new Error(`Invalid JSON from ${url}. First bytes: ${bodyText.slice(0, 120)}`);
  }
}

export async function addRiskLevel(data) {
  const res = await fetch(`${API_BASE}/api/risk-levels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add risk level');
  return res.json();
}

export async function updateRiskLevel(id, data) {
  const res = await fetch(`${API_BASE}/api/risk-levels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update risk level');
  return res.json();
}

export async function deleteRiskLevel(id) {
  const res = await fetch(`${API_BASE}/api/risk-levels/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete risk level');
  return res;
}
export async function deleteProjectPhase(id) {
  const res = await fetch(`${API_BASE}/api/project-phases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project phase');
  return res.json();
}
export async function deleteDepartment(id) {
  const res = await fetch(`${API_BASE}/api/departments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete department');
  return res.json();
}
export async function addDepartment({ name, description }) {
  const res = await fetch(`${API_BASE}/api/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to add department');
  return res.json();
}
export async function addProjectPhase({ name, description }) {
  const res = await fetch(`${API_BASE}/api/project-phases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to add project phase');
  return res.json();
}
export async function getDepartments() {
  return fetchJSON(`${API_BASE}/api/departments`);
}
export async function getProjectPhases() {
  return fetchJSON(`${API_BASE}/api/project-phases`);
}
export async function getSystemConfiguration() {
  return fetchJSON(`${API_BASE}/api/system-configuration`);
}
export async function getAuditLogs() {
  return fetchJSON(`${API_BASE}/api/audit-logs`);
}
export async function getLeave() {
  return fetchJSON(`${API_BASE}/api/leaves`);
}
export async function getToDos() {
  return fetchJSON(`${API_BASE}/api/todos`);
}
// API service for frontend to backend communication

export async function getProjects() {
  return fetchJSON(`${API_BASE}/api/projects`);
}

export async function addProject(project: any) {
  const payload = {
    // required
    name: project.name,
    description: project.description,
    end_date: project.end_date,
    status: project.status,
    owner_id: Number(project.owner_id),
    team_id: Number(project.team_id),
    beneficiary: project.beneficiary,
    created_at: project.created_at,
    // optional/extended
    allocatedHours: project.allocatedHours != null ? Number(project.allocatedHours) : undefined,
    usedHours: project.usedHours != null ? Number(project.usedHours) : undefined,
    milestoneDate: project.milestoneDate ?? project.end_date,
  };
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add project');
  return res.json();
}

// Add more API functions as needed

export async function getTeamMembers() {
  return fetchJSON(`${API_BASE}/api/users`);
}

export async function getTasks() {
  return fetchJSON(`${API_BASE}/api/tasks`);
}
export async function getTeams() {
  return fetchJSON(`${API_BASE}/api/teams`);
}

export async function authenticateUser(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Login failed');
  }
  return res.json();
}
export async function getTools() {
  return fetchJSON(`${API_BASE}/api/tools`);
}
export async function getRiskLevels() {
  return fetchJSON(`${API_BASE}/api/risk-levels`);
}
export async function addTeam(name: string, description: string) {
  const res = await fetch(`${API_BASE}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description })
  });
  if (!res.ok) throw new Error('Failed to add team');
  return res.json();
}
export async function addMember(name, role, password, team_id, subTeamLeaderId, officeLocation) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role, password, team_id, subTeamLeaderId, officeLocation })
  });
  if (!res.ok) throw new Error('Failed to add member');
  return res.json();
}
export async function addAuditLogEntry({ user_id, action, entity_type, entity_id, timestamp, details }) {
  const res = await fetch(`${API_BASE}/api/audit-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, action, entity_type, entity_id, timestamp, details })
  });
  if (!res.ok) throw new Error('Failed to add audit log entry');
  return res.json();
}

export async function updateTask(taskId, updates) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(taskId) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

export async function deleteMember(memberId) {
  const res = await fetch(`${API_BASE}/api/users/${memberId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete member');
  return res.json();
}

export async function updateMemberRole(memberId, role) {
  const res = await fetch(`${API_BASE}/api/users/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error('Failed to update member role');
  return res.json();
}

export async function addTask(newTask) {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTask)
  });
  if (!res.ok) throw new Error('Failed to add task');
  return res.json();
}

export async function updateProject(projectId, updates) {
  // Normalize payload: map client aliases and strip unsupported fields
  const payload: any = { ...updates };
  if (payload.leadId != null) {
    payload.owner_id = typeof payload.leadId === 'string' ? Number(payload.leadId) || payload.leadId : payload.leadId;
    delete payload.leadId;
  }
  if (payload.teamId != null && payload.team_id == null) {
    payload.team_id = typeof payload.teamId === 'string' ? Number(payload.teamId) || payload.teamId : payload.teamId;
    delete payload.teamId;
  }
  if (payload.team_id != null) {
    payload.team_id = typeof payload.team_id === 'string' ? Number(payload.team_id) || payload.team_id : payload.team_id;
  }
  if (payload.owner_id != null) {
    payload.owner_id = typeof payload.owner_id === 'string' ? Number(payload.owner_id) || payload.owner_id : payload.owner_id;
  }
  // Remove client-only fields not stored in DB
  delete payload.parentId;
  delete payload.weight;
  delete payload.frequency;
  delete payload.frequencyDetail;

  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let details = '';
    try {
      const text = await res.text();
      details = text;
    } catch {}
    throw new Error(`Failed to update project${details ? `: ${details}` : ''}`);
  }
  return res.json();
}

export async function deleteProject(projectId) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export async function updateTodo(todoId, updates) {
  const res = await fetch(`${API_BASE}/api/todos/${todoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function addTodo(newTodo) {
  const res = await fetch(`${API_BASE}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTodo)
  });
  if (!res.ok) throw new Error('Failed to add todo');
  return res.json();
}

export async function deleteTodo(todoId) {
  const res = await fetch(`${API_BASE}/api/todos/${todoId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete todo');
  return res.json();
}

export async function addLeave(leaveData) {
  const res = await fetch(`${API_BASE}/api/leaves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leaveData)
  });
  if (!res.ok) throw new Error('Failed to add leave');
  return res.json();
}

export async function deleteLeave(leaveId) {
  const res = await fetch(`${API_BASE}/api/leaves/${leaveId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete leave');
  return res.json();
}

export async function getMemberPerformance(memberId) {
  const res = await fetch(`${API_BASE}/api/users/${memberId}/performance`);
  if (!res.ok) throw new Error('Failed to fetch member performance');
  return res.json();
}

export async function updateTeam(teamId, updates) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update team');
  return res.json();
}

export async function deleteTeam(teamId) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team');
  return res.json();
}

export async function updateTool(toolId, updates) {
  const res = await fetch(`${API_BASE}/api/tools/${toolId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update tool');
  return res.json();
}

export async function addTool(toolData) {
  const res = await fetch(`${API_BASE}/api/tools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toolData)
  });
  if (!res.ok) throw new Error('Failed to add tool');
  return res.json();
}

export async function deleteTool(toolId: string) {
  const res = await fetch(`${API_BASE}/api/tools/${toolId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tool');
  return res.json();
}
