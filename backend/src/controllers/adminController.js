const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('squads.squad', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { globalRole, squads } = req.body;
    
    // squads deve ser um array de { squad: ObjectId, role: string }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    user.status = 'approved';
    if (globalRole) user.globalRole = globalRole;
    if (squads && Array.isArray(squads)) {
      squads.forEach(newSq => {
        const existingIdx = user.squads.findIndex(s => s.squad.toString() === newSq.squad.toString());
        if (existingIdx !== -1) {
          user.squads[existingIdx].role = newSq.role;
        } else {
          user.squads.push(newSq);
        }
      });
    }
    
    await user.save();
    
    const updatedUser = await User.findById(id).populate('squads.squad', 'name');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar usuário', error });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    user.status = 'rejected';
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar usuário', error });
  }
};
exports.removeSquadFromUser = async (req, res) => {
  try {
    const { id, squadId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    
    user.squads = user.squads.filter(sq => sq.squad.toString() !== squadId);
    await user.save();
    
    const updatedUser = await User.findById(id).populate('squads.squad', 'name');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover squad do usuário', error });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error });
  }
};
