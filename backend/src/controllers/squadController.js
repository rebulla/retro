const Squad = require('../models/Squad');

exports.getSquads = async (req, res) => {
  try {
    const squads = await Squad.find({});
    res.json(squads);
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
    await Squad.findByIdAndDelete(id);
    res.json({ message: 'Squad deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar squad', error });
  }
};
