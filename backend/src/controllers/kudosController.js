const KudosBoard = require('../models/KudosBoard');
const Sprint = require('../models/Sprint');
const { getIo } = require('../config/socket');

exports.getAllKudosBoards = async (req, res) => {
  try {
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });

    const boards = await KudosBoard.find({ squadId }).populate('sprintId', 'name theme').sort({ createdAt: -1 });
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar murais de kudos', error });
  }
};

exports.getKudosBoardById = async (req, res) => {
  try {
    const board = await KudosBoard.findById(req.params.id).populate('sprintId', 'name theme');
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar mural de kudos', error });
  }
};

exports.createKudosBoard = async (req, res) => {
  try {
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });

    let sprintId = req.body.sprintId;
    
    // Auto-create a sprint if none exists
    if (!sprintId) {
       const sprint = await Sprint.create({
         squadId,
         name: req.body.sprintName || `Sprint ${new Date().toLocaleDateString()}`,
         startDate: new Date(),
         endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
         theme: req.body.theme || 'Sem Tema'
       });
       sprintId = sprint._id;
    }

    const newBoard = new KudosBoard({
      squadId,
      sprintId,
      title: req.body.title || 'Mural de Kudos',
      introduction: req.body.introduction || 'Reconheça e celebre as conquistas da sua equipe nesta Sprint!',
      backgroundImage: req.body.backgroundImage || ''
    });

    const saved = await newBoard.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar mural de kudos', error });
  }
};

exports.updateKudosBoardTheme = async (req, res) => {
  try {
    const { title, introduction, backgroundImage } = req.body;
    
    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });

    if (title !== undefined) board.title = title;
    if (introduction !== undefined) board.introduction = introduction;
    if (backgroundImage !== undefined) board.backgroundImage = backgroundImage;
    
    const updated = await board.save();
    const populatedBoard = await KudosBoard.findById(updated._id).populate('sprintId', 'name theme');
    getIo().to(`kudos_${updated._id}`).emit('kudos_updated', populatedBoard);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar mural', error });
  }
};

exports.addKudo = async (req, res) => {
  try {
    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });

    const newKudo = {
      from: req.body.from, // { uid, name, avatar }
      to: req.body.to,
      message: req.body.message,
      badge: req.body.badge
    };

    board.kudos.push(newKudo);
    await board.save();
    
    const populatedBoard = await KudosBoard.findById(board._id).populate('sprintId', 'name theme');
    getIo().to(`kudos_${board._id}`).emit('kudos_updated', populatedBoard);
    
    res.status(201).json(board.kudos[board.kudos.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar kudo', error });
  }
};

exports.deleteKudo = async (req, res) => {
  try {
    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });

    board.kudos.pull(req.params.kudoId);
    await board.save();
    
    const populatedBoard = await KudosBoard.findById(board._id).populate('sprintId', 'name theme');
    getIo().to(`kudos_${board._id}`).emit('kudos_updated', populatedBoard);
    
    res.json({ message: 'Kudo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover kudo', error });
  }
};

exports.updateKudo = async (req, res) => {
  try {
    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });

    const kudo = board.kudos.id(req.params.kudoId);
    if (!kudo) return res.status(404).json({ message: 'Kudo não encontrado' });

    // Ensure the user trying to update is the original author
    const uid = req.body.uid;
    if (kudo.from.uid !== uid) {
      return res.status(403).json({ message: 'Sem permissão para editar este kudo' });
    }

    if (req.body.message !== undefined) kudo.message = req.body.message;
    if (req.body.badge !== undefined) kudo.badge = req.body.badge;

    await board.save();

    const populatedBoard = await KudosBoard.findById(board._id).populate('sprintId', 'name theme');
    getIo().to(`kudos_${board._id}`).emit('kudos_updated', populatedBoard);

    res.json(kudo);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar kudo', error });
  }
};

exports.toggleVote = async (req, res) => {
  try {
    const { uid, name } = req.body;
    if (!uid || !name) return res.status(400).json({ message: 'UID e Name são obrigatórios' });

    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });

    const kudo = board.kudos.id(req.params.kudoId);
    if (!kudo) return res.status(404).json({ message: 'Kudo não encontrado' });

    const existingVoterIndex = kudo.voters.findIndex(v => v.uid === uid);
    if (existingVoterIndex !== -1) {
      kudo.voters.splice(existingVoterIndex, 1);
    } else {
      kudo.voters.push({ uid, name });
    }
    kudo.votes = kudo.voters.length;

    await board.save();
    
    const populatedBoard = await KudosBoard.findById(board._id).populate('sprintId', 'name theme');
    getIo().to(`kudos_${board._id}`).emit('kudos_updated', populatedBoard);
    
    res.json(kudo);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar curtida', error });
  }
};

exports.deleteKudosBoard = async (req, res) => {
  try {
    const board = await KudosBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Mural não encontrado' });
    
    if (board.kudos && board.kudos.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir um mural que possui kudos.' });
    }

    await KudosBoard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mural excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir mural', error });
  }
};
