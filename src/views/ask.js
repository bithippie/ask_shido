/**
 * Takes a questionORM object and returns an slack formatted `ask` message.
 */
export const IMPORTANT_CONTEXT = "*Important:* Replies must start with `@Shido` and be within this thread."

export function generateAskMessage(questionORM) {
    
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
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": IMPORTANT_CONTEXT
                }
            ]
        }
    ]
} 
