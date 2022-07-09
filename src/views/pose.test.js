import assert from 'assert';
import { generatePoseResponseMessage, CONTEXT } from "./pose.js";

describe('generatePoseResponseMessage', () => {
    const creator = '<@U0000000000>'
    it('mention the creator', () => {
        const [header, mention, thanks, context] = generatePoseResponseMessage({creator})
        assert.equal(header.type, 'header')
        assert(mention.text.text.includes(creator))
        assert(thanks.text.text.toLowerCase().includes('thank you'))
        assert.equal(context.elements[0].text, CONTEXT)
    })
});
