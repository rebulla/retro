const Sprint = require('../models/Sprint');
const KudosBoard = require('../models/KudosBoard');
const RetrospectiveBoard = require('../models/RetrospectiveBoard');

exports.getActiveSprint = async (req, res) => {
  try {
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });

    // Busca a sprint ativa da squad
    let activeSprint = await Sprint.findOne({ isActive: true, squadId })
      .sort({ createdAt: -1 });
      
      
    if (!activeSprint) {
      // Cria a primeira sprint padrão se não houver
      activeSprint = await Sprint.create({
        squadId,
        name: `Sprint #1`,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        theme: 'Sem Tema',
        isActive: true
      });
      // Cria os boards padrão associados
      await KudosBoard.create({ sprintId: activeSprint._id, squadId });
      await RetrospectiveBoard.create({ 
        squadId,
        sprintId: activeSprint._id,
        columns: [
          { name: 'O que foi bom?', color: 'success' },
          { name: 'O que pode melhorar?', color: 'danger' },
          { name: 'Ações (Próximos passos)', color: 'primary' }
        ]
      });
    }
    
    res.json(activeSprint);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sprint ativa', error });
  }
};

exports.updateSprint = async (req, res) => {
  try {
    const { name, startDate, endDate, theme, themeResponsible, backgroundImage } = req.body;
    
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint não encontrada' });
    
    if (name !== undefined) sprint.name = name;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (theme !== undefined) sprint.theme = theme;
    if (backgroundImage !== undefined) sprint.backgroundImage = backgroundImage;
    
    if (themeResponsible !== undefined) {
      if (themeResponsible === null || themeResponsible === '') {
        sprint.themeResponsible = undefined;
      } else {
        sprint.themeResponsible = themeResponsible;
      }
    }
    
    await sprint.save();
    
    const updatedSprint = await Sprint.findById(sprint._id);
    res.json(updatedSprint);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar sprint', error });
  }
};

exports.createSprint = async (req, res) => {
  try {
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });

    const { name, startDate, endDate, theme, themeResponsible, backgroundImage } = req.body;
    
    // Desativar todas as sprints antigas da squad
    await Sprint.updateMany({ isActive: true, squadId }, { $set: { isActive: false } });
    
    // Criar nova sprint
    const newSprint = new Sprint({
      squadId,
      name: name || `Sprint ${new Date().toLocaleDateString()}`,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(new Date().setDate(new Date().getDate() + 14)),
      theme: theme || 'Sem Tema',
      backgroundImage: backgroundImage || '',
      themeResponsible: themeResponsible || undefined,
      isActive: true
    });
    
    const savedSprint = await newSprint.save();
    
    // Criar boards associados automaticamente
    await KudosBoard.create({ sprintId: savedSprint._id, squadId });
    await RetrospectiveBoard.create({ 
      squadId,
      sprintId: savedSprint._id,
      columns: [
        { name: 'O que foi bom?', color: 'success' },
        { name: 'O que pode melhorar?', color: 'danger' },
        { name: 'Ações (Próximos passos)', color: 'primary' }
      ]
    });
    
    const populatedSprint = await Sprint.findById(savedSprint._id);
    res.status(201).json(populatedSprint);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar sprint', error });
  }
};

exports.getAllSprints = async (req, res) => {
  try {
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });

    const sprints = await Sprint.find({ squadId })
      .sort({ createdAt: -1 });
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sprints', error });
  }
};

exports.activateSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const squadId = req.headers['x-squad-id'];
    if (!squadId) return res.status(400).json({ message: 'x-squad-id header is required' });
    
    // Desativar todas da squad
    await Sprint.updateMany({ squadId }, { $set: { isActive: false } });
    
    // Ativar a específica
    const sprint = await Sprint.findByIdAndUpdate(sprintId, { isActive: true }, { new: true });
    
    if (!sprint) return res.status(404).json({ message: 'Sprint não encontrada' });
    
    res.json(sprint);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao reativar sprint', error });
  }
};

exports.deleteSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    
    const kudosBoard = await KudosBoard.findOne({ sprintId });
    if (kudosBoard && kudosBoard.kudos && kudosBoard.kudos.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir: existem Kudos registrados nesta Sprint.' });
    }
    
    const retroBoard = await RetrospectiveBoard.findOne({ sprintId });
    if (retroBoard && retroBoard.cards && retroBoard.cards.length > 0) {
      return res.status(400).json({ message: 'Não é possível excluir: existem Cards de Retrospectiva registrados.' });
    }
    
    // Se passou, deleta os boards e a sprint
    if (kudosBoard) await KudosBoard.findByIdAndDelete(kudosBoard._id);
    if (retroBoard) await RetrospectiveBoard.findByIdAndDelete(retroBoard._id);
    
    await Sprint.findByIdAndDelete(sprintId);
    
    const squadId = req.headers['x-squad-id'];
    
    // Se a sprint que deletamos estava ativa, ativamos a mais recente que sobrou
    const activeSprint = await Sprint.findOne({ isActive: true, squadId });
    if (!activeSprint) {
      const mostRecent = await Sprint.findOne({ squadId }).sort({ createdAt: -1 });
      if (mostRecent) {
        mostRecent.isActive = true;
        await mostRecent.save();
      }
    }
    
    res.json({ message: 'Sprint excluída com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir sprint', error });
  }
};
