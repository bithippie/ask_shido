export const CONTEXT = "Think you can help? No need to wait for `@Shido`! Reply in the thread."

/**
 * Takes a questionORM object and returns an slack formatted `ask` message.
 */
export function generatePoseResponseMessage({creator}) {
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Question Added! :pencil:",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `:thinking_face: That's a great question, <@${creator}>!`
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "Thank you for adding your question to the list.",
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

