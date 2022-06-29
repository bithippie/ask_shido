import assert from 'assert';
import { parseAppMention } from "./parser.js";

const SHIDO = "<@U03ASQX6X2R|mentionbot>"

describe('parseAppMention', () => {
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
            it(`should return 'usage' as the action when ${description}`, () => {
                const { action } = parseAppMention({text: command})
                assert.equal(action, 'usage')
            });
             it(`should return 'undefined' as the body when ${description}`, () => {
                const { body} = parseAppMention({text: command})
                assert.equal(body, undefined)
            });
        })
    });
    describe('@Shido ask', () => {
        [
            {
                description: "is empty",
                command: `${SHIDO} ask`,
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
            it(`should return 'ask' as the action when the ask ${description}`, () => {
                const { action } = parseAppMention({text: command})
                assert.equal(action, 'ask')
            });
             it(`should return '${body}' as the body when the ask ${description}`, () => {
                const { body:actual } = parseAppMention({text: command})
                assert.equal(actual, body)
            });
        })
    });
    describe('@Shido pose', () => {
        [
            {
                description: "I pose my insightful question",
                command: `${SHIDO} pose my insightful question`,
                body: "my insightful question"
            }
        ].forEach(({description, command, body}) => {
            it(`should return 'pose' as the action when ${description}`, () => {
                const { action } = parseAppMention({text: command})
                assert.equal(action, 'pose')
            });
             it(`should return '${body}' as the body when ${description}`, () => {
                const { body:actual } = parseAppMention({text: command})
                assert.equal(actual, body)
            });
        })
        it ('should return `usage` as the action if pose is provided without a question', () => {
            const { action } = parseAppMention({text: `${SHIDO} pose`})
            assert.equal(action, 'usage')
        })
        it (`should return 'undefined' as the body if pose is provided without a question`, () => {
            const { body } = parseAppMention({text: `${SHIDO} pose`})
            assert.equal(body, undefined)
        })
    });
});
