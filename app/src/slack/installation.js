const slack = require('slack');
const { getDbOrConfigValue } = require('../utils');
const { getToken } = require('./auth');

exports.onSlackInstall = async ({ token, userId }) => {
  await slack.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Welcome to the SHE Bot!'
  });
  await configureRehearsalDay({ token, userId });
};

const configureRehearsalDay = async ({ token, userId }) => {
  const { ts, channel } = await slack.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'SHE Bot',
    text: 'Which day do you rehearse?',
    blocks: [
      {
        type: 'section',
        block_id: 'rehearsal_day',
        text: {
          type: 'mrkdwn',
          text: 'Pick the day that you rehearse'
        },
        accessory: {
          action_id: 'select_rehearsal_day',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select an item',
            emoji: true
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Monday',
                emoji: true
              },
              value: '1'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Tuesday',
                emoji: true
              },
              value: '2'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Wednesday',
                emoji: true
              },
              value: '3'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Thursday',
                emoji: true
              },
              value: '4'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Friday',
                emoji: true
              },
              value: '5'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Saturday',
                emoji: true
              },
              value: '6'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Sunday',
                emoji: true
              },
              value: '0'
            }
          ]
        }
      }
    ]
  });
};

exports.configureRehearsalDay = configureRehearsalDay;
