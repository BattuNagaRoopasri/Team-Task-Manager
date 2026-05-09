const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timesheetRoutes = require('./routes/timesheets');
const invoiceRoutes = require('./routes/invoices');

dotenv.config();

const app = express();

app.use(cors({
  origin: ['https://teamtaskmanagerss.netlify.app', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Team Task Manager API is Live');
});

app.get('/api', (req, res) => {
  res.json({ message: 'API working perfectly' });
});

app.get('/api/setup-db', (req, res) => {
  const { exec } = require('child_process');
  exec('npx --yes prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ message: 'Failed to push schema', error: error.message, stderr });
    }
    res.json({ message: 'Database schema pushed successfully!', stdout });
  });
});

app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.message);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});