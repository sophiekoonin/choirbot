const utils = require('../utils');

exports.getToken = async function(team_id) {
  return await utils.getDbOrConfigValue('teams', team_id, 'token');
};
