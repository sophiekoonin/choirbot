import { SlackClient } from '../client'

const installationMessageBlocks = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':wave: *Welcome to Choirbot!*'
    }
  },
  {
    type: 'section',
    text: {
      type: 'plain_text',
      emoji: true,
      text: "I'm a Slack app that takes attendance for you, and keeps track of who hasn't been coming to rehearsals. Every week at 9:30 am on your rehearsal day, I'll post a message inviting people to respond if they are or aren't coming."
    }
  },
  {
    type: 'section',
    text: {
      type: 'plain_text',
      emoji: true,
      text: "If you like, I can also post reminders 4 days before rehearsals with info about what's coming up."
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "There are a few things you'll need to do to get it all set up."
    }
  },
  {
    type: 'divider'
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Setting up the schedule*'
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "The bot works with a <https://docs.google.com/spreadsheets/d/1ngSxEdAuhdJTEb_pFE5nq1avNjzEjdMY8r-Z1QQL-v0|schedule template> that lives in Google Sheets. You'll need to *make a copy* (`File > Make a copy`) of the template and keep it up to date with your rehearsals."
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "Fill the first column with the dates of your rehearsals, in the form `DD/MM/YYYY` (e.g. 01/01/2020). You don't have to go too far into the future."
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "The next columns are for the titles of the songs you'll be doing. If you don't do run throughs in your rehearsals, feel free to hide those columns and leave them blank (don't delete them, though)."
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "Fill out the `Main song link` column with the link to the song in the <https://drive.google.com/drive/u/0/folders/0B4M1uGHjD5R9WkZJR3pLcWxEY0k|Arrangements folder>. If you don't have a link, leave it blank."
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Keep the first 5 columns the same* - feel free to add any additional columns after, SHEbot will ignore them.'
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'As long as the schedule is filled out before rehearsal day (or, if you have rehearsal reminders on, 4 days before) the bot will read the details from the spreadsheet and post it in the channel.'
    }
  },
  {
    type: 'divider'
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Configuring SHEbot*'
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "Click the `Home` tab above to open the SHEbot settings. This is where you can set your rehearsal day, set the channel you want me to post to, enable or disable rehearsal reminder posts, and customise the message that gets posted every rehearsal day. *You'll need to set this up otherwise the bot won't work.*"
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "There's also a section where you can trigger posts just in case they don't get automatically posted. Use with caution!"
    }
  },
  {
    type: 'divider'
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Attendance reports*'
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'You can view reports on the Home tab by clicking the `View Report` button.'
    }
  },
  {
    type: 'divider'
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Problems and feedback*'
    }
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: "This app was developed by Sophie from SHE Choir London. If you're having any issues, or have ideas for new reports or new features, please send her an email at `london@shechoir.com`."
    }
  }
]

export async function onSlackInstall({
  token,
  userId
}: {
  token: string
  userId: string
}): Promise<void> {
  await SlackClient.chat.postMessage({
    token,
    channel: userId,
    as_user: true,
    username: 'Choirbot',
    text: 'Welcome to the Choirbot!',
    blocks: installationMessageBlocks
  })
}
