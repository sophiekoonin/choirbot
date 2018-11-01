const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const querystring = require('querystring');

// With thanks to Dennis Alund https://medium.com/evenbit/building-a-slack-app-with-firebase-as-a-backend-151c1c98641d

exports.oauth_redirect = functions
  .region('europe-west1')
  .https.onRequest((request, response) => {
    if (request.method !== 'GET') {
      console.error(`Got unsupported ${request.method} request. Expected GET.`);
      return response.send(405, 'Only GET requests are accepted');
    }

    if (!request.query && !request.query.code) {
      return response.status(401).send("Missing query attribute 'code'");
    }
    const queryParams = {
      code: request.query.code,
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

    const result = fetch(
      `https://slack.com/api/oauth.access?${encodedQueryString}`,
      options
    )
      .then(result => result.json())
      .then(result => {
        if (!result.ok) {
          console.error('The request was not ok: ' + JSON.stringify(result));
          return response
            .header(
              'Location',
              `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com`
            )
            .send(302);
        }
        return admin
          .firestore()
          .collection('tokens')
          .doc(result.team_id)
          .set({
            token: result.access_token
          });
      })
      .then(() =>
        response
          .header(
            'Location',
            `https://${process.env.GCLOUD_PROJECT}.firebaseapp.com/success.html`
          )
          .send(302)
      );
  });
