import 'dotenv/config';
import bolt from '@slack/bolt';
import { http } from '@google-cloud/functions-framework';

import { parseAppMention } from './src/commands/parser.js';
import AirtableService from './src/services/airtable.js';

const {App, ExpressReceiver, LogLevel} = bolt;

const expressReceiver = new ExpressReceiver({
    endpoints: '/events',
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    processBeforeResponse: true
});

const USE_SOCKET_MODE = (process.env.SOCKET_MODE.toLowerCase() === "true")

const app = new App({
  receiver: USE_SOCKET_MODE ? undefined : expressReceiver,
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: USE_SOCKET_MODE,
  logLevel: process.env.LOG_LEVEL || LogLevel.DEBUG,
  port: process.env.port || 3000
});

const airtableService = new AirtableService()

/**
 * Shido was mentioned
 * Use the command parser to look at the context around the mention and
 * determine the best course of action.
 */
app.event('app_mention', async ({ event, message, client, logger }) => {  
    const {
      thread_ts,
      ts,
      channel, 
      text, 
      user
    } = event
    logger.info(`app_mention event fired`)
  
    logger.debug('event', event)
    logger.debug('message', message)
    
    const sanitizedText = text.replace(/^(Reminder:)?\s*?<@.+?>/g, '').trim()
    logger.debug('sanitizedText', sanitizedText)

    if (thread_ts) {
      logger.info('Recording response...')
      // this should be moved to process command 
      // however, this will work for now because ask and pose aren't supported in threads

      const ask = await airtableService.fetchAsk({ts: thread_ts, channel})
      logger.debug(`Ask ${ask ? '' : 'Not'} Found`)
      return airtableService.recordResponse({ts, response: sanitizedText, responder: user, ask})
    }
    
    const { action, body } = parseAppMention({text: sanitizedText});

    await processCommand({action, body, caller_id: user, channel, client})
});

async function processCommand({action, body, caller_id, channel, client}) {
  if (action === 'ask' || action === "ask.") { // workaround for the reminder adding trailing period
    console.log('ask')
    let questionORM = await airtableService.selectQuestion();
    const postResponse = await client.chat.postMessage({
      channel: channel,
      response_type: "in_channel", 
      text: questionORM.question
    })
    const {ts} = postResponse
    await airtableService.captureAsk({channel, ts, questionORM})
    return
  }
  
  if (action === 'pose') {
    console.log('pose')
    let response = await airtableService.poseQuestion({question: body, creator: caller_id})
    return client.chat.postMessage({
      channel: channel,
      response_type: "in_channel", 
      text: "Hm...:thinking_face: That's a great question!"
    });
  }

  if (action === 'usage') {
    console.log('usage')
    await client.chat.postMessage({
      channel: channel,
      response_type: "in_channel",
      text: "Usage: `@shido ask` or `@shido pose <your question>`"
    })
  }
}

/**
 * Record when someone reacts to an Ask.
 */
app.event('reaction_added', async ({ event, logger }) => {  
    logger.info('reaction_added')
    const { item: { channel, ts }, reaction, user: reactor } = event
    await airtableService.recordReaction({ channel, ts, reaction, reactor })
});

if (USE_SOCKET_MODE) {
  (async () => {
    await app.start();
    console.log('⚡️ Bolt app started');
  })();
} else {
  http('slack', expressReceiver.app)
}
