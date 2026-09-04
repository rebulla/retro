const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rotas do backend virão aqui
const retroRoutes = require('./routes/retroRoutes');
const kudosRoutes = require('./routes/kudosRoutes');
const sprintRoutes = require('./routes/sprintRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/retrospectives', retroRoutes);
app.use('/api/kudos', kudosRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
