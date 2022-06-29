
import { Actions } from './parser.js';

export const CommandHandlerRegistry = Object.freeze({
  [Actions.USAGE]: printUsage,
  [Actions.ASK]: printAsk,
  [Actions.POSE]: captureQuestion,
  [Actions.CAPTURE_ANSWER]: captureAnswer,
});

/**
 * Prints Shido usage instructions in the channel that mentioned @Shido.
 */
export async function printUsage({client, event}) {
    logger.info('executing printUsage handler')

    const { channel } = event;

    await client.chat.postMessage({
      channel,
      response_type: "in_channel",
      text: "Usage: `@Shido ask` or `@Shido pose <your question>`"
    });
}

/**
 * Pulls a question for the Airtable Service and prints it to the channel
 * where `@Shido ask` was mentioned.
 */
export async function printAsk({airtableService, client, event}) {
    logger.info('executing printAsk handler')

    const { channel } = event;
    
    let questionORM = await airtableService.selectQuestion();
    
    const postResponse = await client.chat.postMessage({
      channel,
      response_type: "in_channel", 
      text: questionORM.question
    })
    
    const {ts} = postResponse
    
    await airtableService.captureAsk({channel, ts, questionORM})
    
    return
}

/**
 * When a user poses a question, store it in the question table.
 */
export async function captureQuestion({airtableService, body, client, event}) {
    logger.info('executing captureQuestion handler')
    
    const { channel, user } = event;
    
    await airtableService.poseQuestion({question: body, creator: user})
    
    return client.chat.postMessage({
      channel,
      response_type: "in_channel", 
      text: "Hm...:thinking_face: That's a great question!"
    })
}

/**
 * When a user replies to a question, store it in the answers table.
 */
export async function captureAnswer({airtableService, body, event, logger}) {
    logger.info('executing captureAnswer handler')
    
    const { channel, thread_ts, ts, user } = event
    
    const ask = await airtableService.fetchAsk({ts: thread_ts, channel})
    
    logger.info(`Ask ${ask ? '' : 'Not'} Found`)
    
    return airtableService.recordResponse({ts, response: body, responder: user, ask})
}
