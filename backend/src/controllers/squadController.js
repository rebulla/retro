const Squad = require('../models/Squad');
const User = require('../models/User');

exports.getSquads = async (req, res) => {
  try {
    const squads = await Squad.find({}).lean();
    const squadsWithCount = await Promise.all(squads.map(async (squad) => {
      const userCount = await User.countDocuments({ "squads.squad": squad._id });
      return { ...squad, userCount };
    }));
    res.json(squadsWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar squads', error });
  }
};

exports.createSquad = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newSquad = await Squad.create({ name, description });
    res.status(201).json(newSquad);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar squad', error });
  }
};

exports.updateSquad = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await Squad.findByIdAndUpdate(id, { name, description }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar squad', error });
  }
};

exports.deleteSquad = async (req, res) => {
  try {
    const { id } = req.params;
    const userCount = await User.countDocuments({ "squads.squad": id });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Não é possível remover a squad, pois existem usuários vinculados a ela.' });
    }
    await Squad.findByIdAndDelete(id);
    res.json({ message: 'Squad deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar squad', error });
  }
};
