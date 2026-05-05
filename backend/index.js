const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

dotenv.config();

const app = express();
app.use(cors({
  origin: 'https://teamtaskmanagerss.netlify.app'
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Serve static files in production
app.get('/', (req, res) => {
  res.send('🚀 Team Task Manager API is Live');
});

// Health/API check
app.get('/api', (req, res) => {
  res.json({ message: 'API working perfectly' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
