import 'dotenv/config';
import bolt from '@slack/bolt';
import { http } from '@google-cloud/functions-framework';

import { parseAppMention } from './src/commands/parser.js';
import { CommandHandlerRegistry } from './src/commands/handlers.js';
import { AirtableService } from './src/services/airtable.js';

const { App, ExpressReceiver, LogLevel } = bolt;

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

// Spawn a "Singleton" Airflow Service
// I *think* we should be able to use the same global instance for all 
// invocations of an instance of a cloud function
const airtableService = new AirtableService()

/**
 * Shido was mentioned
 * Use the command parser to look at the context around the mention and
 * proxy action, body, and the slack event objects to the CommandHandlerRegistry.
 */
app.event('app_mention', async ({ client, event, logger }) => {  
  logger.info(`app_mention event fired`)
  logger.debug('event', event)

  const { action, body } = parseAppMention(event);

  logger.info(`processing action '${action}' for ts: '${event.ts}', thread_ts: '${event.thread_ts}'`)
  
  const handler = CommandHandlerRegistry[action]
  
  await handler({airtableService, action, body, client, event, logger});
});

/**
 * Record when someone reacts to an Ask.
 */
app.event('reaction_added', async ({ event, logger }) => {  
    logger.info('reaction_added event fired')
    logger.debug('event', event)
    
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
