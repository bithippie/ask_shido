import assert from 'assert';
import { generateAskMessage, IMPORTANT_CONTEXT } from "./ask.js";

describe('generateAskMessage', () => {
    const questionORM = Object.freeze({
        recordId: 100,
        questionId: 200,
        question: 'myMock Question'
    });
    
    it('should substitute the questionORM.question into the message', () => {
        const [header, question, context] = generateAskMessage(questionORM)
        assert.equal(header.type, 'header')
        // weird quirk of Slacks`section` block is the double text
        assert(question.text.text.endsWith(questionORM.question))
        assert.equal(context.elements[0].text, IMPORTANT_CONTEXT)
    })
});
