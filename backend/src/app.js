const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
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
