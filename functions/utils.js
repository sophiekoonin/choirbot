const admin = require('firebase-admin');
const functions = require('firebase-functions');
const env = functions.config().shebot.env;

exports.getTokenAndPostOptions = function() {
  const token =
    env === 'prod'
      ? admin
          .firestore()
          .collection('tokens')
          .doc(team_id)
          .get()
          .then(doc => {
            if (!doc.exists) {
              throw new Error('Token not found');
            } else {
              return doc.get('token');
            }
          })
      : functions.config().slack.token;

  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`
    }
  };
};
