const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

dotenv.config();

const app = express();

/* ✅ CORS FIX (important) */
app.use(cors({
  origin: 'https://teamtaskmanagerss.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

/* ✅ API Routes */
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

/* ✅ Root route */
app.get('/', (req, res) => {
  res.send('🚀 Team Task Manager API is Live');
});

/* ✅ Health check */
app.get('/api', (req, res) => {
  res.json({ message: 'API working perfectly' });
});

/* ❗ GLOBAL ERROR HANDLER (VERY IMPORTANT) */
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.message);
  res.status(500).json({
    message: 'Server error',
    error: err.message
  });
});

/* ✅ PORT */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});