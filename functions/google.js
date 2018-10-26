const functions = require('firebase-functions');
const { OAuth2Client } = require('google-auth-library');
const admin = require('firebase-admin');

const clientId = functions.config().google.id;
const clientSecret = functions.config().google.secret;

const redirUrl = `https://us-central1-${
  process.env.GCLOUD_PROJECT
}.cloudfunctions.net/googleOauthRedirect`;

const functionsOauthClient = new OAuth2Client(clientId, clientSecret, redirUrl);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// visit the URL for this Function to obtain tokens
exports.authGoogleAPI = functions.https.onRequest((req, res) =>
  res.redirect(
    functionsOauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    })
  )
);

exports.googleOauthRedirect = functions.https.onRequest((req, res) => {
  const code = req.query.code;
  functionsOauthClient.getToken(code, (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      return res.status(400).send(err);
    }
    return admin
      .firestore()
      .collection('tokens')
      .doc(clientId)
      .set({
        tokens
      })
      .then(() => res.status(200).send('OK'));
  });
});
