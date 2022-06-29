export function parseAppMention({text}) {
    const usage = { action: 'usage' }
    const sanitizedText = text
        .replace(/^Reminder:/, '')  // remove slackbot reminder prefix
        .replace(/<@.+>/,'')        // remove any at mentions
        .trim()

    // assume the first word is the action everything else gets pushed to the body
    const [ action, ...rest ] = sanitizedText.split(/\s+/);
    
    // these are the only two commands we support right now
    if (['ask', 'pose'].includes(action)) {
        const body = rest.join(' ').trim();
        
        if (action == 'pose' && !body) {
            return usage
        }
        
        return { action, body }
    }
    
    return usage
}
