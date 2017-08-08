'use strict';
const http = require('http');

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Are you going to Harvard or Central Square?';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = '';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying the Alexa Skills Kit sample. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the route in the session and prepares the speech to reply to the user.
 */
function nextBus(intent, session, callback) {
    intent = intent || {
        name: 'nextBus',
        slots: {
            route: {
                name: 'route',
                value: 'Harvard'
            }
        }
    }
    const cardTitle = intent.name;
    const routeSlot = intent.slots.route;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = true;
    queryMBTA(intent, (info) => {
        let speechOutput = `Buses to ${info.destination} in ${info.times}`; // at ${info.whichStop}

        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });

}

function queryMBTA(intent, callback) {
    console.log(intent.slots.route.value)
    const API_KEY = `KUWzeVOvsUqr4i8TY_CTOw`;
    const stations = {
        'Harvard': { name: `Harvard Square`, code: `2056` },
        'central': { name: `Central Square`, code: `1436` }
    };
    const terminus = stations[intent.slots.route.value] || 'Harvard';

    run(terminus);

    function run(route) {
        console.log(route)
        let options = getRoute(route.code);
        let req = http.request(options, (res) => {
            var body = '';

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', function () {
                predict(body, route.name);
            });

        });
        req.end();

        req.on('error', (e) => {
            console.log('ERROR:', e);
        });
    }

    function getRoute(dest) {
        return `http://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=${API_KEY}&stop=${dest}&format=json`;
    }

    function predict(res, dest) {
        console.log(res)
        const data = JSON.parse(res);
        if (!data.mode) {
            return `No available data`;
        }
        const stop = data.mode[0].route[0].direction[0];
        const len = stop.trip.length;
        const secondsAway = (num) => {
            return stop.trip[num].pre_away;
        };
        const minutesAway = (num) => {
            return Math.floor(secondsAway(num) / 60);
        }

        let nextArr = [];

        for (let i = 0; i < len; i++) {
            if (minutesAway(i) > 2) {
                nextArr.push(minutesAway(i) + (minutesAway(i) === 1 ? ' minute' : ' minutes'));
                if (i < len - 2) {
                    nextArr.push(', ');
                } else if (i === len - 2) {
                    nextArr.push(' and ');
                }
            }
        }

        let info = {
            times: nextArr.join(''),
            whichStop: data.stop_name,
            destination: terminus.name
        }
        callback(info);
    }
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    // getWelcomeResponse(callback);
    nextBus(null, session, callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'nextBus') {
        nextBus(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
