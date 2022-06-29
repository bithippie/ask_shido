export const Actions = Object.freeze({
    USAGE: 'usage',
    ASK: 'ask',
    POSE: 'pose',
    CAPTURE_ANSWER: 'capture_answer'
});

export function parseAppMention({text, thread_ts}) {
    // default response
    const usage = { action: Actions.USAGE }

    // handle someone using `/remind #Channel "@Shido ask" daily at 9am.`
    // input text would read 'Reminder: @Shido ask'
    const sanitizedText = text
        .replace(/^Reminder:/, '')  // remove slackbot reminder prefix
        .replace(/<@.+>/,'')        // remove any at mentions
        .trim()

    // if shido is mentioned in a thread assume it is a reply.
    // the caller will need to do error checking to determine if the parent 
    // thread was actually a question. That is out of scope for this function.
    if (thread_ts) {
        return {
            action: Actions.CAPTURE_ANSWER,
            body: sanitizedText
        }
    }

    // given we are not in a thread, 
    // assume the first word is the action 
    // everything else gets pushed to the body
    let [ action, ...rest ] = sanitizedText.split(/\s+/);
    
    // if the action contains any trailing punctuation scrub it 
    // this supports the use case @Shido ask.
    action = action.replace(/[^\w]*?$/,'')

    // ask and pose are the only two commands we support right now
    if ([Actions.ASK, Actions.POSE].includes(action)) {
        const body = rest.join(' ').trim();
        
        // body is required for a pose
        // print usage
        if (action == Actions.POSE && !body) {
            return usage
        }
        
        // happy path
        return { action, body }
    }

    return usage
}
