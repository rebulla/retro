const { Server } = require('socket.io');
const Sprint = require('../models/Sprint');

let io;

// In-memory state for rooms
// Structure:
// rooms[roomId] = {
//   status: 'voting' | 'revealed',
//   average: null | number,
//   participants: {
//     [socketId]: { id, name, avatar, vote }
//   }
// }
// rooms[roomId] = { ... }
const rooms = {};

// Roulette Room State
let rouletteParticipants = {};
let isSpinning = false;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuário conectado (Socket ID: ${socket.id})`);

    // 1. Join Room (Poker)
    socket.on('join_room', ({ roomId, user }) => {
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          status: 'voting',
          finalAgreedVote: null,
          participants: {}
        };
      }
      
      const occupiedSeats = Object.values(rooms[roomId].participants).map(p => p.seatIndex);
      const availableSeats = [];
      for(let i = 0; i < 12; i++) {
        if (!occupiedSeats.includes(i)) availableSeats.push(i);
      }
      
      const seatIndex = availableSeats.length > 0 
        ? availableSeats[Math.floor(Math.random() * availableSeats.length)]
        : Math.floor(Math.random() * 12);

      // Add user to room state
      rooms[roomId].participants[socket.id] = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        vote: null,
        seatIndex
      };

      // Emit updated state to everyone in the room
      io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
    });

    // 2. Vote
    socket.on('vote', ({ roomId, voteValue }) => {
      if (rooms[roomId] && rooms[roomId].participants[socket.id]) {
        rooms[roomId].participants[socket.id].vote = voteValue;
        io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
      }
    });

    // 2b. Change Seat
    socket.on('change_seat', ({ roomId, seatIndex }) => {
      if (rooms[roomId] && rooms[roomId].participants[socket.id]) {
        rooms[roomId].participants[socket.id].seatIndex = seatIndex;
        io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
      }
    });

    // 2c. Send Reaction
    socket.on('send_reaction', ({ roomId, reaction }) => {
      if (rooms[roomId] && rooms[roomId].participants[socket.id]) {
        io.to(roomId).emit('reaction_received', { socketId: socket.id, reaction });
      }
    });

    // 3. Reveal Votes
    socket.on('reveal_votes', ({ roomId }) => {
      if (rooms[roomId]) {
        rooms[roomId].status = 'revealed';
        // Send FULL state (including votes)
        io.to(roomId).emit('room_state_update', rooms[roomId]);
      }
    });

    // 4. Set Final Agreed Vote (Facilitator)
    socket.on('set_final_vote', ({ roomId, vote }) => {
      if (rooms[roomId]) {
        rooms[roomId].finalAgreedVote = vote;
        io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
      }
    });

    // 5. Reset Room
    socket.on('reset_room', ({ roomId }) => {
      if (rooms[roomId]) {
        rooms[roomId].status = 'voting';
        rooms[roomId].finalAgreedVote = null;
        Object.keys(rooms[roomId].participants).forEach(socketId => {
          rooms[roomId].participants[socketId].vote = null;
        });
        io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
      }
    });

    // 6. Retrospective Board Events
    socket.on('join_retro', (retroId) => {
      socket.join(`retro_${retroId}`);
    });

    socket.on('leave_retro', (retroId) => {
      socket.leave(`retro_${retroId}`);
    });

    // 7. Kudos Board Events
    socket.on('join_kudos', (kudosId) => {
      socket.join(`kudos_${kudosId}`);
    });

    socket.on('leave_kudos', (kudosId) => {
      socket.leave(`kudos_${kudosId}`);
    });

    // 8. Roulette Events
    socket.on('join_roulette', (user) => {
      socket.join('roulette_room');
      rouletteParticipants[socket.id] = { id: user.id, name: user.name, avatar: user.avatar };
      io.to('roulette_room').emit('roulette_state_update', {
        participants: Object.values(rouletteParticipants),
        isSpinning
      });
    });

    socket.on('leave_roulette', () => {
      socket.leave('roulette_room');
      delete rouletteParticipants[socket.id];
      io.to('roulette_room').emit('roulette_state_update', {
        participants: Object.values(rouletteParticipants),
        isSpinning
      });
    });

    socket.on('spin_roulette', () => {
      if (isSpinning) return;
      isSpinning = true;
      const participantsList = Object.values(rouletteParticipants);
      if (participantsList.length === 0) {
        isSpinning = false;
        return;
      }
      
      const winnerIndex = Math.floor(Math.random() * participantsList.length);
      const winner = participantsList[winnerIndex];
      
      io.to('roulette_room').emit('roulette_spin_start', { winnerIndex });
      
      // Assume animation takes 5 seconds
      setTimeout(async () => {
        isSpinning = false;
        
        // Salva na Sprint ativa o vencedor
        try {
          const activeSprint = await Sprint.findOne({ isActive: true });
          if (activeSprint) {
            activeSprint.themeResponsible = {
              name: winner.name,
              avatar: winner.avatar
            };
            await activeSprint.save();
          }
        } catch (err) {
          console.error("Erro ao salvar responsável pela sprint após roleta:", err);
        }

        io.to('roulette_room').emit('roulette_spin_end', { winner });
      }, 5000);
    });

    // 9. Dashboard Ticker Events
    socket.on('send_ticker_reaction', (emoji) => {
      io.emit('ticker_reaction', emoji);
    });

    // 10. Disconnect
    socket.on('disconnect', () => {
      console.log(`Usuário desconectado (Socket ID: ${socket.id})`);
      
      // Remove from roulette
      if (rouletteParticipants[socket.id]) {
        delete rouletteParticipants[socket.id];
        io.to('roulette_room').emit('roulette_state_update', {
          participants: Object.values(rouletteParticipants),
          isSpinning
        });
      }
      
      // Find poker room and remove user
      for (const roomId in rooms) {
        if (rooms[roomId].participants[socket.id]) {
          delete rooms[roomId].participants[socket.id];
          // If room empty, maybe clean it up, but for now just update remaining
          if (Object.keys(rooms[roomId].participants).length === 0) {
             delete rooms[roomId];
          } else {
             io.to(roomId).emit('room_state_update', getSanitizedRoomState(roomId));
          }
        }
      }
    });
  });
};

// Helper: Hides votes if status is 'voting'
function getSanitizedRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  if (room.status === 'revealed') {
    return room;
  }

  // Deep copy to avoid mutating actual state
  const sanitized = JSON.parse(JSON.stringify(room));
  Object.keys(sanitized.participants).forEach(socketId => {
    // If they voted, just send a boolean flag (true) instead of the actual value
    sanitized.participants[socketId].vote = sanitized.participants[socketId].vote ? true : null;
  });

  return sanitized;
}

// Remove the calculateAverage function entirely


const getIo = () => io;

module.exports = { initSocket, getIo };
