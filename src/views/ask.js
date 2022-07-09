export const CONTEXT = "*Important:* Replies must start with `@Shido` and be within this thread to be saved."

/**
 * Takes a questionORM object and returns an slack formatted `ask` message.
 */
export function generateAskMessage({questionORM}) {
    
    const { question } = questionORM

    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Question :thought_balloon:",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `>${question}`
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "If you enjoy this question or discussion, give it a :+1:",
                "emoji": true
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": CONTEXT
                }
            ]
        }
    ]
} 
