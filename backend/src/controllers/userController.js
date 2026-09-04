const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name avatar email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error });
  }
};
