
import { Actions } from './parser.js';
import { generateAskMessage } from '../views/ask.js';
import { generateUsageMessage } from '../views/usage.js';
import { generatePoseResponseMessage } from '../views/pose.js';
/**
 * Map actions to event handlers
 * This is very similar to how a express router works
 */
export const CommandHandlerRegistry = Object.freeze({
  [Actions.USAGE]: printUsage,
  [Actions.ASK]: printAsk,
  [Actions.POSE]: captureQuestion,
  [Actions.CAPTURE_ANSWER]: captureAnswer,
});

/**
 * Prints Shido usage instructions in the channel that mentioned @Shido.
 */
export async function printUsage({client, event, logger}) {
    logger.info('executing printUsage handler')

    const { channel } = event;

    await client.chat.postMessage({
      channel,
      response_type: "in_channel",
      blocks: generateUsageMessage()
    });
}

/**
 * Pulls a question for the Airtable Service and prints it to the channel
 * where `@Shido ask` was mentioned.
 */
export async function printAsk({airtableService, client, event, logger}) {
    logger.info('executing printAsk handler')

    const { channel } = event;
    
    let questionORM = await airtableService.selectQuestion();
    
    const postResponse = await client.chat.postMessage({
      channel,
      response_type: "in_channel", 
      blocks: generateAskMessage({questionORM})
    })
    
    const {ts} = postResponse
    
    await airtableService.captureAsk({channel, ts, questionORM})
    
    return
}

/**
 * When a user poses a question, store it in the question table.
 */
export async function captureQuestion({airtableService, body, client, event, logger}) {
    logger.info('executing captureQuestion handler')
    
    const { channel, user: creator } = event;
    
    await airtableService.poseQuestion({question: body, creator})
    
    return client.chat.postMessage({
      channel,
      response_type: "in_channel", 
      blocks: generatePoseResponseMessage({creator})
    })
}

/**
 * When a user replies to a question, store it in the answers table.
 */
export async function captureAnswer({airtableService, body, client, event, logger}) {
    logger.info('executing captureAnswer handler')
    
    const { channel, thread_ts, ts, user } = event
    
    // the command parser uses thread_ts to determine the `action`
    // thread_ts is a requirement for the `capture_answer` so this
    // shouldn't happen, but if it does, be defensive.
    if (!thread_ts) {
      logger.warn('In captureAnswer handler without a thread_ts!')
      return
    }
    
    // fetch the parent ask using thread_ts
    // we need the airtable's record id from the ask to join the answer to the ask.
    const ask = await airtableService.fetchAsk({ts: thread_ts, channel})
    
    if (!ask) {
      logger.info(`No Ask found for ts: ${thread_ts}, channel: ${channel}`)
      // TODO: bot could postMessage that answer went unhandled.
      return
    }
    
    await airtableService.recordResponse({ts, response: body, responder: user, ask})

    return client.reactions.add({
      channel,
      timestamp: ts,
      name: "white_check_mark"
    })
}
