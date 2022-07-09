/**
 * Respond to a Usage call.
 */

export const CONTEXT = "Complete instructions can be found <https://bithippie.slack.com/archives/D03AY2639N0|here>."

export function generateUsageMessage() {
    return [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "Usage :toolbox:",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "> `@Shido` - Print this usage message.\n> `@Shido ask` - Have Shido ask a question. \n> `@Shido pose <my question>` - Add your question to the list. \n> `@Shido <reply>` - Answer a question. *Only works in a thread.*"
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
