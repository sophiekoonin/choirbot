const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const querystring = require('querystring');

// With thanks to Dennis Alund https://medium.com/evenbit/building-a-slack-app-with-firebase-as-a-backend-151c1c98641d

exports.oauth_redirect = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'GET') {
      console.error(`Got unsupported ${req.method} request. Expected GET.`);
      return res.send(405, 'Only GET requests are accepted');
    }

    if (!req.query && !req.query.code) {
      return res.status(401).send("Missing query attribute 'code'");
    }

    const queryParams = {
      code: req.query.code,
      client_id: functions.config().shebot.id,
      client_secret: functions.config().shebot.secret,
      redirect_uri: `https://europe-west1-${
        process.env.GCLOUD_PROJECT
      }.cloudfunctions.net/oauth_redirect`
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
      console.error('The request was not ok: ' + JSON.stringify(result));
      return res
        .header(
          'Location',
          `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`
        )
        .send(302);
    }

    await admin
      .firestore()
      .collection('tokens')
      .doc(responseJson.team_id)
      .set({
        token: responseJson.access_token
      });

    return res
      .header(
        'Location',
        `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/success.html`
      )
      .send(302);
  });
