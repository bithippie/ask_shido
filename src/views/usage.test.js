import assert from 'assert';
import { generateUsageMessage, CONTEXT } from "./usage.js";

describe('generateUsageMessage', () => {
    ['usage', 'ask', 'pose', 'reply'].forEach(action => {
        it(`should include instructions for how to use action '${action}'`, () => {
            const [header, instructions, context] = generateUsageMessage()
            assert.equal(header.type, 'header')
            // weird quirk of Slacks`section` block is the double text
            assert(instructions.text.text.includes(action))
            assert.equal(context.elements[0].text, CONTEXT)
        })
    });
});
