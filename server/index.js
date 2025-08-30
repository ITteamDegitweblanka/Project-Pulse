
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const riskIssueRoutes = require('./routes/riskIssueRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const todoRoutes = require('./routes/todoRoutes');

const toolRoutes = require('./routes/toolRoutes');
const fileRoutes = require('./routes/fileRoutes');
const projectPhaseRoutes = require('./routes/projectPhaseRoutes');
const riskLevelRoutes = require('./routes/riskLevelRoutes');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

app.use('/api/users', userRoutes);
app.use('/api/teams/members', teamRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/risks-issues', riskIssueRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/todos', todoRoutes);


app.use('/api/tools', toolRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/project-phases', projectPhaseRoutes);
app.use('/api/risk-levels', riskLevelRoutes);



const departmentRoutes = require('./routes/departmentRoutes');
const projectPhaseController = require('./controllers/projectPhaseController');

app.use('/api/departments', departmentRoutes);
app.get('/api/project-phases', projectPhaseController.getProjectPhases);

app.get('/api/system-configuration', (req, res) => {
  // Fetch system configuration from database
  db.query('SELECT * FROM system_configuration LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!results.length) return res.status(404).json({ error: 'No configuration found' });
    res.json(results[0]);
  });
});

app.get('/', (req, res) => {
  res.send('Server is running and connected to MySQL!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// User authentication route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password });
  if (!username || !password) {
    return res.status(400).send('Username and password required');
  }
  // Check user in database
  db.query('SELECT * FROM users WHERE name = ? AND password = ?', [username, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      console.log('Login failed for:', { username, password });
      return res.status(401).send('Invalid username or password');
    }
    // Return user data (omit password)
    const user = { ...results[0] };
    delete user.password;
    res.json(user);
  });
});
// Risk levels API route
app.get('/api/risk-levels', (req, res) => {
  // Fetch risk levels from database
  db.query('SELECT id, level, description, color, status FROM risk_levels', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});
