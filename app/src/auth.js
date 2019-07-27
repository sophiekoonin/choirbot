const fetch = require('node-fetch');
const querystring = require('querystring');
const db = require('./db');
const utils = require('./utils');

// With thanks to Dennis Alund https://medium.com/evenbit/building-a-slack-app-with-firebase-as-a-backend-151c1c98641d

exports.oauth_redirect = async function(req, res) {
  if (req.method !== 'GET') {
    console.error(`Got unsupported ${req.method} request. Expected GET.`);
    return res.send(405, 'Only GET requests are accepted');
  }

  if (!req.query && !req.query.code) {
    return res.status(401).send("Missing query attribute 'code'");
  }

  const [id, secret] = await utils.getDbOrConfigValues('config', 'slack', [
    'id',
    'secret'
  ]);

  const queryParams = {
    code: req.query.code,
    client_id: id,
    client_secret: secret,
    redirect_uri: `https://${
      process.env.GOOGLE_CLOUD_PROJECT
    }.appspot.com/oauth_redirect`
  };

  const encodedQueryString = querystring.stringify(queryParams);
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf8'
    }
  };

  const response = await fetch(
    `https://slack.com/api/oauth.access?${encodedQueryString}`,
    options
  );

  const responseJson = await response.json();
  if (!responseJson.ok) {
    console.error('The request was not ok: ' + JSON.stringify(responseJson));
    return res
      .header(
        'Location',
        `https://${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com/oauth_error`
      )
      .sendStatus(302);
  }

  await db
    .collection('tokens')
    .doc(responseJson.team_id)
    .set({
      team_name: responseJson.team_name,
      user_id: responseJson.user_id,
      channel_id: responseJson.incoming_webhook.channel_id,
      channel: responseJson.incoming_webhook.channel,
      token: responseJson.access_token
    });

  return res
    .header(
      'Location',
      `https://${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com/oauth_success`
    )
    .sendStatus(302);
};

exports.oauth_success = (req, res) => res.send('Hooray! All authenticated.');
exports.oauth_error = (req, res) => res.send('Unable to authenticate :(');
