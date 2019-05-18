const bcrypt = require('bcrypt');
const db = require('./db');

exports.register = async (req, res) => {
  if (process.env !== 'dev') {
    return res.send(403);
  }

  const { username, password, name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await db
      .collection('users')
      .doc(username)
      .set({ password: hashedPassword, displayName: name });
    return res.send(201);
  } catch (err) {
    throw err;
  }
};
