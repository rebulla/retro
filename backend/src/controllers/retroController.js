const RetrospectiveBoard = require('../models/RetrospectiveBoard');
const Sprint = require('../models/Sprint');
const { getIo } = require('../config/socket');

exports.getAllRetrospectives = async (req, res) => {
  try {
    const retros = await RetrospectiveBoard.find().populate('sprintId', 'name theme').sort({ createdAt: -1 });
    res.json(retros);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar retrospectivas', error });
  }
};

exports.getRetrospectiveById = async (req, res) => {
  try {
    const retro = await RetrospectiveBoard.findById(req.params.id).populate('sprintId', 'name theme');
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });
    res.json(retro);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar retrospectiva', error });
  }
};

exports.createRetrospective = async (req, res) => {
  try {
    let sprintId = req.body.sprintId;
    
    // Auto-create a sprint if none exists
    if (!sprintId) {
       const sprint = await Sprint.create({
         name: req.body.sprintName || `Sprint ${new Date().toLocaleDateString()}`,
         startDate: new Date(),
         endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
         theme: req.body.theme || 'Sem Tema'
       });
       sprintId = sprint._id;
    }

    const newRetro = new RetrospectiveBoard({
      sprintId,
      title: req.body.title || 'Nova Retrospectiva',
      backgroundImage: req.body.backgroundImage || '',
      columns: req.body.columns || [
        { name: 'O que foi bom', description: '', color: 'success' },
        { name: 'O que melhorar', description: '', color: 'warning' },
        { name: 'Ações', description: '', color: 'primary' }
      ]
    });

    const saved = await newRetro.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar retrospectiva', error });
  }
};

exports.updateRetrospectiveTheme = async (req, res) => {
  try {
    const { title, backgroundImage, columns, status } = req.body;
    
    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });

    if (title !== undefined) retro.title = title;
    if (backgroundImage !== undefined) retro.backgroundImage = backgroundImage;
    if (status !== undefined) retro.status = status;
    
    // Update existing columns or replace
    if (columns && Array.isArray(columns)) {
      // For simplicity, we can replace the columns array.
      // However, if we replace them, we might lose columnIds that cards are referencing.
      // It's safer to update existing ones by ID if provided.
      columns.forEach(col => {
        const existingCol = retro.columns.id(col._id);
        if (existingCol) {
          if (col.name) existingCol.name = col.name;
          if (col.description !== undefined) existingCol.description = col.description;
          if (col.color) existingCol.color = col.color;
        } else if (!col._id) {
          retro.columns.push(col);
        }
      });
    }

    const updated = await retro.save();
    const populatedRetro = await RetrospectiveBoard.findById(updated._id).populate('sprintId', 'name theme');
    getIo().to(`retro_${updated._id}`).emit('retro_updated', populatedRetro);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar retrospectiva', error });
  }
};

exports.addCard = async (req, res) => {
  try {
    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });

    const newCard = {
      columnId: req.body.columnId,
      text: req.body.text,
      // Optional author mapping for future
      // author: req.body.userId 
    };

    retro.cards.push(newCard);
    await retro.save();
    
    const populatedRetro = await RetrospectiveBoard.findById(retro._id).populate('sprintId', 'name theme');
    getIo().to(`retro_${retro._id}`).emit('retro_updated', populatedRetro);
    
    // Return the inserted card
    res.status(201).json(retro.cards[retro.cards.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar cartão', error });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });

    const card = retro.cards.id(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

    if (req.body.columnId) card.columnId = req.body.columnId;
    if (req.body.text) card.text = req.body.text;
    if (req.body.votes !== undefined) card.votes = req.body.votes;

    await retro.save();
    
    const populatedRetro = await RetrospectiveBoard.findById(retro._id).populate('sprintId', 'name theme');
    getIo().to(`retro_${retro._id}`).emit('retro_updated', populatedRetro);
    
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar cartão', error });
  }
};

exports.toggleVote = async (req, res) => {
  try {
    const { uid, name } = req.body;
    if (!uid || !name) return res.status(400).json({ message: 'UID e Name são obrigatórios' });

    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });

    const card = retro.cards.id(req.params.cardId);
    if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

    const existingVoterIndex = card.voters.findIndex(v => v.uid === uid);
    if (existingVoterIndex !== -1) {
      card.voters.splice(existingVoterIndex, 1);
    } else {
      card.voters.push({ uid, name });
    }
    card.votes = card.voters.length;

    await retro.save();
    
    const populatedRetro = await RetrospectiveBoard.findById(retro._id).populate('sprintId', 'name theme');
    getIo().to(`retro_${retro._id}`).emit('retro_updated', populatedRetro);
    
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar voto', error });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });

    retro.cards.pull(req.params.cardId);
    await retro.save();
    
    const populatedRetro = await RetrospectiveBoard.findById(retro._id).populate('sprintId', 'name theme');
    getIo().to(`retro_${retro._id}`).emit('retro_updated', populatedRetro);
    
    res.json({ message: 'Cartão removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover cartão', error });
  }
};

exports.deleteRetrospective = async (req, res) => {
  try {
    const retro = await RetrospectiveBoard.findById(req.params.id);
    if (!retro) return res.status(404).json({ message: 'Retrospectiva não encontrada' });
    
    if (retro.cards && retro.cards.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir uma retrospectiva que possui cards.' });
    }

    await RetrospectiveBoard.findByIdAndDelete(req.params.id);
    res.json({ message: 'Retrospectiva excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir retrospectiva', error });
  }
};
