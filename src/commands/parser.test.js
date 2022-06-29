import assert from 'assert';
import { parseAppMention } from "./parser.js";

const SHIDO = "<@U03ASQX6X2R|mentionbot>"

describe('parseAppMention', () => {
    
    /**
     * Test cases for when shido usage is requested
     */
    describe('@Shido', () => {
        [
            {
                description: "@Shido is mentioned with no other content",
                command: `${SHIDO}`
            },
            {
                description: "@Shido is given an instruction it doesn\'t recognize",
                command:`${SHIDO} do a barrel roll`
            }
        ].forEach(({description, command}) => {
            
            const { action, body:actual } = parseAppMention({text: command})

            it(`should return 'usage' as the action when ${description}`, () => {
                assert.equal(action, 'usage')
            });

             it(`should return 'undefined' as the body when ${description}`, () => {
                assert.equal(actual, undefined)
            });
        })
    });

    /**
     * Test cases for when shido should ask the group a question
     */
    describe('@Shido ask', () => {
        [
            {
                description: "is empty",
                command: `${SHIDO} ask`,
                body: ""
            },
            {
                description: "has trailing punctuation",
                command: `${SHIDO} ask.`,
                body: ""
            },
            {
                description: "has extra text",
                command: `${SHIDO} ask me a question`,
                body: "me a question"
            },
            {
                description: "comes from a reminder",
                command: `Reminder: ${SHIDO} ask a question.`,
                body: "a question."
            }
        ].forEach(({description, command, body}) => {
            
            const { action, body:actual } = parseAppMention({text: command})
                
            it(`should return 'ask' as the action when the ask ${description}`, () => {
                assert.equal(action, 'ask')
            });
            
            it(`should return '${body}' as the body when the ask ${description}`, () => {
                assert.equal(actual, body)
            });
        })
    });

    /**
     * Test cases for when someone poses a question to the group.
     */
    describe('@Shido pose', () => {
        [
            {
                description: "I pose my insightful question",
                command: `${SHIDO} pose my insightful question`,
                body: "my insightful question"
            }
        ].forEach(({description, command, body: expected}) => {

            const { action, body:actual } = parseAppMention({text: command})

            it(`should return 'pose' as the action when ${description}`, () => {
                assert.equal(action, 'pose')
            });
            
            it(`should return '${expected}' as the body when ${description}`, () => {
                assert.equal(actual, expected)
            });
        })

        it ('should return `usage` as the action if pose is provided without a question', () => {
            const { action } = parseAppMention({text: `${SHIDO} pose`})
            assert.equal(action, 'usage')
        })
        
        it (`should return 'undefined' as the body if pose is provided without a question`, () => {
            const { body: actual } = parseAppMention({text: `${SHIDO} pose`})
            assert.equal(actual, undefined)
        })
    });

    /**
     * Tests cases for when the reply is in a thread.
     */
    describe('@Shido ask response', () => {
        
        const thread_ts = 1656537008.380709;
        
        [
            {
                description: "a user replies to an ask",
                command: `${SHIDO} My thoughtful answer to your insightful question.`,
                body: "My thoughtful answer to your insightful question."
            }
        ].forEach(({description, command, body: expected}) => {
            
            const { action, body: actual } = parseAppMention({text: command, thread_ts})
            
            it(`should return 'capture_answer' as the action when ${description}`, () => {
                assert.equal(action, 'capture_answer')
            });
            
            it(`should return '${expected}' as the body when ${description}`, () => {
                assert.equal(actual, expected)
            });
        })
    });
});
