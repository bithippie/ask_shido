import assert from 'assert';
import sinon from 'sinon';
import { ConsoleLogger, LogLevel } from '@slack/logger';

import { printUsage, printAsk, captureQuestion, captureAnswer } from './handlers.js';
import { AirtableService } from '../services/airtable.js';

describe('app_mention event command handlers', () => {
    // inject bolt's logger
    const logger = new ConsoleLogger();
    logger.setLevel(LogLevel.ERROR) // we don't actually need to see any errors in the test output.
    
    // mock command event
    const appMentionEvent = Object.freeze({
        channel: 'C0000000000',
        user: 'U00000000',
        ts: 1656541224.716069
    });

    // mocked client.chat.postMessage response
    const postMessageResponse = Object.freeze({
        ts: 1656537008.380709
    });

    // stubbed in beforeEach
    let airtableService;
    let client;

    beforeEach(() => {
        // mock the airtable service 
        airtableService = sinon.createStubInstance(AirtableService, {
            selectQuestion: {
                question: 'mock'
            },
            captureAsk: sinon.fake.resolves(),
            fetchAsk: {
                ask: {
                    getId: () => 100
                }
            },
            poseQuestion: sinon.fake.resolves(),
            recordResponse: sinon.fake.resolves(),
        });

        // mocked slack client
        client = { 
            chat: {
                postMessage: sinon.fake.resolves(postMessageResponse)
            }
        };
    })

    describe('printUsage', () => {
        let postMessageFake;
        
        beforeEach(() => {
            postMessageFake = client.chat.postMessage
        });

        it('call client.chat.postMessage once with usage text', async () => {
            postMessageFake = client.chat.postMessage
            
            await printUsage({ client, event: appMentionEvent, logger})
            
            assert.equal(client.chat.postMessage.callCount, 1)
            
            const {channel, response_type, blocks} = postMessageFake.firstCall.firstArg;
            
            assert.equal(channel, appMentionEvent.channel)
            assert.equal(response_type, "in_channel")
            assert(blocks)
        });
    });

    describe('printAsk', () => {
        let selectQuestionFake;
        let postMessageFake;
        let captureAskFake;

        beforeEach(async () => {
            selectQuestionFake = airtableService.selectQuestion
            postMessageFake = client.chat.postMessage
            captureAskFake = airtableService.captureAsk

            await printAsk({airtableService, client, event: appMentionEvent, logger})
        });

        it('calls airtableService.selectQuestion', () => {
            assert.equal(selectQuestionFake.callCount, 1)
        });

        it('call client.chat.postMessage once with expected args', () => {
            assert.equal(postMessageFake.callCount, 1)
            
            // confirm we are sending the right channel, response_type, and text
            const { channel, response_type, blocks } = postMessageFake.firstCall.firstArg;
            const selectedQuestionORM = selectQuestionFake.firstCall.returnValue
            
            assert.equal(channel, appMentionEvent.channel)
            assert.equal(response_type, "in_channel")
            assert(blocks)
        });

        it('calls airtableService.captureAsk once with expected args', () => {
            assert.equal(captureAskFake.callCount, 1)
            
            // confirm we are sending the right channel, ts, and question
            const {channel, ts, questionORM } = captureAskFake.firstCall.firstArg
            const selectedQuestionORM = selectQuestionFake.firstCall.returnValue

            assert.equal(channel, appMentionEvent.channel)
            assert.equal(ts, postMessageResponse.ts)
            assert.equal(questionORM, selectedQuestionORM)
        });
    });

    describe('captureQuestion', () => {
        let poseQuestionFake;
        let postMessageFake;
        let body;
        
        beforeEach(async () => {
            poseQuestionFake = airtableService.poseQuestion
            postMessageFake = client.chat.postMessage
            body = 'My New Question'
            await captureQuestion({airtableService, body, client, event: appMentionEvent, logger})
        });

        it('calls airtableServices.poseQuestion once', () => {
            assert.equal(poseQuestionFake.callCount, 1)
            
            // confirm we are sending the right question, and creator
            const { question, creator } = poseQuestionFake.firstCall.firstArg
            
            assert.equal(question, body)
            assert.equal(creator, appMentionEvent.user)
        });

        it('calls client.chat.postMessage', () => {
            assert.equal(postMessageFake.callCount, 1)
            
            // confirm we are sending the right question, and creator
            const { channel, response_type, blocks } = postMessageFake.firstCall.firstArg
            
            assert.equal(channel, appMentionEvent.channel)
            assert.equal(response_type, "in_channel")
            assert(blocks)
        });
    });

    describe('captureAnswer', () => {
        let fetchAskFake;
        let recordResponseFake;
        let body;
        
        // the only way for there to be a captureAnswer is to add a thread_ts
        // however we'll add some tests that raise exceptions if that's not the case.  
        let threadedAppMentionEvent = {
            thread_ts: 1656542363.218289,
            ...appMentionEvent
        }
        
        beforeEach(() => {
            fetchAskFake = airtableService.fetchAsk;
            recordResponseFake = airtableService.recordResponse;
            body = 'My Answer To The Question';
        });
        
        it ('calls airtableServices.fetchAsk once with expected args', async () => {
            await captureAnswer({airtableService, body, event: threadedAppMentionEvent, logger})

            assert.equal(fetchAskFake.callCount, 1)

            // confirm we are sending the right question, and creator
            const { ts, channel } = fetchAskFake.firstCall.firstArg
            
            assert.equal(channel, threadedAppMentionEvent.channel)
            assert.equal(ts, threadedAppMentionEvent.thread_ts)
        });

        it ('calls airtableServices.recordResponse once with expected args', async () => {
            await captureAnswer({airtableService, body, event: threadedAppMentionEvent, logger})

            assert.equal(recordResponseFake.callCount, 1)
            
            // confirm we are sending the right answer, and answerer
            const { ts, response, responder, ask } = recordResponseFake.firstCall.firstArg

            assert.equal(ts, threadedAppMentionEvent.ts)
            assert.equal(response, body)
            assert.equal(responder, threadedAppMentionEvent.user)
            assert.equal(ask, fetchAskFake.firstCall.returnValue)
        });

        it ('does not call recordResponse when the parent ask can\'t be found', async () => {
            // null out the return from the fake configured in beforeEach 
            fetchAskFake.returns(undefined)
            
            await captureAnswer({airtableService, body, event: threadedAppMentionEvent, logger})

            assert.equal(recordResponseFake.callCount, 0)
        });

        it ('raises an error if the event.thread_ts is undefined', async () => {
            // appMentionEvent doesn't include a thread_ts in contrast to threadAppMentionEvent
            await captureAnswer({airtableService, body, event: appMentionEvent, logger})

            assert.equal(fetchAskFake.callCount, 0)
            assert.equal(recordResponseFake.callCount, 0)
        });

    });
});
