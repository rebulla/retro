require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
