import { MachineConfig, send, Action, assign } from "xstate";
import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useMachine, asEffect } from "@xstate/react";
import { inspect } from "@xstate/inspect";

// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/Homeappliances'

const gram = loadGrammar(grammar)
const input = "Please turn the light off"
const prs = parse(input.split(/\s+/), gram)
const result = prs.resultsForRule(gram.$root)[0]
console.log(result)

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function parsing(text:string): MachineConfig<SDSContext, any, SDSEvent> {
    return (parse(text.split(/\s+/), gram).resultsForRule(gram.$root)[0])
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: listen(),
            },
            nomatch: {entry: say("Please say it again"),
                on: { ENDSPEECH: 'prompt' }
            }
        }
    })
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
        welcome: {
            on: {
                RECOGNISED: [{
                    cond: (context) => parsing(context.recResult) !== undefined,
                    target: "returnobject",
                    actions: assign((context) => { return { option: parsing(context.recResult) } }),
                },
                {target: ".nomatch" }]    
            },
                ...promptAndAsk("What do you want to do?")
        },
        returnobject: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. the object is ${context.option.homeappliances.object} and the action is ${context.option.homeappliances.action}.`
                    }))
                },
            }
        },
        
    }
})
