import {default as Airtable} from 'airtable';

export class AirtableService {
    static QUESTION_BASE_ID = 'appIAF3Iz0JPTmlOX';
    
    constructor() {
        this.base = new Airtable().base(AirtableService.QUESTION_BASE_ID);
        this.questions = this.fetchQuestions()
    }
    /**
     * Pull questions from airtable base and load into global container memory so 
     * we don't make unnecessary http hops for data we can cache.
     */
    async fetchQuestions() {
        console.log("Fetching questions from Airtable...")
        let questions = [];
        await this.base('Questions').select().eachPage((records, fetchNextPage) => {
            questions.push(...records.map(({id:recordId, fields: {id:questionId, question}}) => (
            {
                recordId, // looks like i have to use airtable record ids for joins
                questionId, // not sure if I need this then.
                question,
            }
            )));
            fetchNextPage()
        })
        console.log(`Received ${questions.length} questions`)
        return questions
    }

    /**
     * Pull a question at random from the global question list
     */
    async selectQuestion() {
        const questionList = await this.questions
        const questionIndex = Math.floor(Math.random() * questionList.length);
        return questionList[questionIndex];
    };
    
    async captureAsk({channel, ts, questionORM}) {
        await this.base('Asks').create([
            {
                "fields": {
                    channel,
                    ts,
                    Questions: [
                        questionORM.recordId
                    ],
                }
            }
        ])
    }

    /**
     * Given a Channel ID and a TS, fetch an ask.
     */
    async fetchAsk({channel, ts}) {
        const results = await this.base('Asks')
            .select({
                filterByFormula: `AND(ts="${ts}",channel="${channel}")`
            })
            .firstPage()
        
        if (results.length !== 1) {
            console.log(`found ${results.length} asks to pair with reaction`)
            return
        }

        return results[0]
    }

    /**
     * Add a question to the question table and record the owner
     */
    async poseQuestion({question, creator}) {
        await this.base('Questions').create([
            {
                "fields": {
                    question,
                    creator
                }
            }
        ])
        return question
    }

    /**
     * Add a reaction to the reactions table
     */
    async recordReaction({channel, reaction, reactor, ts}) {
        // we need to do a search to get the recordId for the join.
        // the only thing we have from the event api is the ts.
        // ts has been added to both Ask and QuestionResponse tables
        // to link the two activities
        const ask = await this.fetchAsk({channel, ts})

        await this.base('QuestionReactions').create([
            {
                "fields": {
                    reaction,
                    reactor,
                    Ask: [
                        ask.getId()
                    ]
                }
            }
        ])
    }

    /**
     * Record someone's answer to an ask
     */
    async recordResponse({ts, response, responder, ask}) {
        await this.base('Responses').create([
            {
                "fields": {
                    ts,
                    response,
                    responder,
                    Ask: [
                        ask.getId()
                    ]
                }
            }
        ])
    }
}
