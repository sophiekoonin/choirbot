const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const db = require('./db');

exports.getLocalStrategy = () =>
  new LocalStrategy(async (username, password, done) => {
    const doc = await db
      .collection('users')
      .doc('user')
      .get();
    if (!doc.exists()) {
      return done(null, false, { message: 'User not found' });
    }
    const hashedPassword = doc.get('password');
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (isMatch)
      return done(null, { username: user, displayName: doc.get('name') });
    return done(null, false, { message: 'Invalid password' });
  });
