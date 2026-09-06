const User = require('../models/User');

exports.syncUser = async (req, res) => {
  try {
    const { firebaseUid, email, name, avatar } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ message: 'firebaseUid e email são obrigatórios' });
    }

    // Tenta encontrar pelo firebaseUid ou email (para usuários legados)
    let user = await User.findOne({ 
      $or: [{ firebaseUid }, { email }] 
    }).populate('squads.squad', 'name');

    if (user) {
      // Atualiza firebaseUid, nome e avatar se o usuário for legado ou se as informações mudaram
      let updated = false;
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        updated = true;
      }
      if (user.name !== name || user.avatar !== avatar) {
        user.name = name;
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // Usuário novo - será criado como 'pending'
      user = await User.create({
        firebaseUid,
        email,
        name,
        avatar,
        status: 'pending',
        globalRole: 'user',
        squads: []
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro no sync do usuário:', error);
    res.status(500).json({ message: 'Erro ao sincronizar usuário', error });
  }
};
