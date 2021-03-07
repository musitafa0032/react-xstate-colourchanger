import { MachineConfig, send, Action, assign, actions} from "xstate";
import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useMachine, asEffect } from "@xstate/react";
import { inspect } from "@xstate/inspect";

const {cancel}=actions

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

function promptAndAsk(prompt: string, speechprompt:string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: "prompt",
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: "ask" }
            },
            hist: {type: "history"},
            maxspeech: {
                ...speech(speechprompt)
        },  
            ask: {
                entry: [listen(), send('MAXSPEECH', {delay: 5000})]
            },
        }})
}


function helpm(prompt: string, name: string): MachineConfig<SDSContext, any, SDSEvent>{
    return ({entry: say(prompt),
             on: {ENDSPEECH: name+".hist" }})
}

function speech(prompt: string): MachineConfig<SDSContext, any, SDSEvent>{
    return ({entry: say(prompt),
             on: {ENDSPEECH: "ask"
            }})
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string } } = {
    "John": { person: "John Appleseed" },
	"Chris": { person: "Chris Thomas" },
	"Grace": {person: "Grace Jane"},
    "on Friday": { day: "Friday" },
	"on Monday": { day: "Monday" },
	"at8": {time: "eight o'clock" },
	"at eight": { time: "eight o'clcok" },
	"at10":{time:"ten o'clcok" },
    "at ten": { time: "ten o'clcok" },
	"at7": {time: "seven o'clock"},
    "at seven": {time: "seven o'clock"},
	"at11": {time: "eleven o'clock"},
    "at eleven": {time: "eleven o'clock"}
}

const grammar2= { "yes": true,
                  "Yes": true,
				  "Of course": true,
                  "of course": true, 
				  "No": false,
				  "no" : false,
				  "No way": false,
				  "no way" : false
}
const commands = {"help": "h", "Help": "H"}

const grammar3 ={"count": 0}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },
		welcome: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    target: "query",
                    cond: (context) => !(context.recResult in commands),
                    actions: [assign((context) => { return { option: context.recResult } }),assign((context) => { grammar3["count"]=0}),cancel("maxsp")],
                    
                },
                {target: "help1",
                cond: (context) => context.recResult in commands,
                actions: cancel("maxsp")} ],
                MAXSPEECH: [{target:".maxspeech",
                cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}]
            },
            states: {        
                prompt: {
                entry: say("What would you like to do?"),
                on: { ENDSPEECH: "ask" }
            },
            hist: {type: "history"},
               maxspeech: {
                ...speech("You did not respond，just tell me what you want to do")
        },  
            ask: {
                entry: [listen(), send('MAXSPEECH', {delay: 5000})]
            }
        }   
    }, 
    
        help1:{
            ...helpm("Please kindly tell me what you want to do","welcome")
        },
		query: {
            invoke: {
                id: "rasa",
                src: (context, event) => nluRequest(context.option),
                onDone: {
                    target: "menu",
                    actions: [assign((context, event) => { return  {option: event.data.intent.name} }),
                    (context: SDSContext, event: any) => console.log(event.data)]
                    //actions: assign({ intent: (context: SDSContext, event: any) =>{ return event.data }})

                },
                onError: {
                    target: "welcome",
                    actions: (context, event) => console.log(event.data)
                }
            }
        },
      
        menu: {
            initial: "prompt",
            on: {
                ENDSPEECH: [
                    { target: "todo", cond: (context) => context.option === "todo" },
                    { target: "timer", cond: (context) => context.option === "timer" },
                    { target: "appointment", cond: (context) => context.option === "appointment" }
                ]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. I understand，you want a ${context.option}.`
                    })),
        },
     /*            nomatch: {
                    entry: say("Sorry, I don"t understand"),
                    on: { ENDSPEECH: "prompt" }
        } */ 
            }       
        },


        todo: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Let"s create a to do item`
                    }))
                }}
        },
        
        timer: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Let"s create a timer`
                    }))
                }}
        },
        
        
        appointment: {
            initial: "prompt",
            on: { ENDSPEECH: "who" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Let"s create an appointment`
                    }))
                }}
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: [assign((context) => { return { person: grammar[context.recResult].person } }),assign((context) => { grammar3["count"]=0}), cancel("maxsp")],
                    target: "day"

                },
                { target: ".nomatch" ,
                 cond: (context) => !(context.recResult in commands),
                 actions: cancel("maxsp")},
                 {target: "help2",
                 cond: (context) => context.recResult in commands,
                 actions: cancel("maxsp")}],
                 MAXSPEECH: [{target:".maxspeech",
                 cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}] 
            },
            states: {
                prompt: {
                    entry: say("Who are you meeting with?"),
                    on: { ENDSPEECH: "ask" }
                },
                hist: {type: "history"},
                ask: {
                    entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
                },
                maxspeech: {
                    ...speech("You did not respond, just tell me the person")
                },
                nomatch: {
                    entry: say("Sorry I don't know them"),
                    on: { ENDSPEECH:  "prompt" }
                
                }
             }
        },
        help2:{
            ...helpm("Just tell me the name","who")
        },
        day: {
            initial: "prompt",
            on: {
	            RECOGNISED: [{
	                cond: (context) => "day" in (grammar[context.recResult] || {}),
		            actions: [assign((context) => { return { day: grammar[context.recResult].day } }),assign((context) => { grammar3["count"]=0}),cancel("maxsp")],
		            target: "wholeday"

		        },	
		        { target: ".nomatch" ,
                cond: (context) => !(context.recResult in commands),
                actions: cancel("maxsp")},
                {target: "help3",
                cond: (context) => context.recResult in commands,
                actions: cancel("maxsp")}],
                MAXSPEECH: [{target:".maxspeech",
                cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}] 
	        },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}. On which day is your meeting?`
                    })),
		            on: { ENDSPEECH: "ask" }
                },
                hist: {type: "history"},
		        ask: {
		            entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
	            },
                maxspeech: {
                 ...speech("You did not respond, say a day")
              },
		        nomatch: {
		            entry: say("Sorry I don't know which day are you talking about"),
		            on: { ENDSPEECH: "prompt" }
	            }	     
            }
        },
        help3:{
            ...helpm("Just tell me the day","day")
        },
        
	    wholeday: {
		        initial: "prompt",
		        on: {
	                RECOGNISED: [{
			            cond: (context) => grammar2[context.recResult] === true,
                        target: "notime",
                        actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]},
						{
						cond: (context) => grammar2[context.recResult] === false,
						target: "whattime",
                        actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]
		            },
	                { target: ".nomatch",
                    cond: (context) => !(context.recResult in commands),
                    actions: cancel("maxsp")},
                    {target: "help4",
                    cond: (context) => context.recResult in commands,
                    actions: cancel("maxsp")}],
                    MAXSPEECH: [{target:".maxspeech",
                    cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}] 
		        },
		        states: {
		            prompt: {
			            entry: send((context) => ({
			                type: "SPEAK",
						    value: `Good.on ${context.day}. Will it take the whole day?`
			            })),
			            on: { ENDSPEECH: "ask" }
		            },
                    hist: {type: "history"},
		            ask: {
		                entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
		            },
                    maxspeech: {
                      ...speech("You did not respond, say a decision")
                    },
		            nomatch: {
			            entry: say("Please repeat it again"),
		                on: { ENDSPEECH: "prompt" }
		            }
		        }	     
            },
            help4:{
                ...helpm("Just tell me the decision","wholeday")
            },
            notime: {
		           initial: "prompt",
	               on: {
		               RECOGNISED: [{ 
			               cond: (context) => grammar2[context.recResult] === true,
			               target: "Finished",
                           actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]},
						   {
							cond: (context) => grammar2[context.recResult] === false,
                           target: "who",
						   actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]
		                },
		                { target: ".nomatch",
                        cond: (context) => !(context.recResult in commands),
                        actions: cancel("maxsp")},
                        {target: "help5",
                        cond: (context) => context.recResult in commands,
                        actions: cancel("maxsp")}],
                        MAXSPEECH: [{target:".maxspeech",
                        cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}]  
		            },
		            states: {
		                prompt: {
			                entry: send((context) => ({
			                    type: "SPEAK",
								value: `Good. Do you want to me create an appointment with ${context.person} on ${context.day}for the whole day?`
                            })),
                            on: { ENDSPEECH: "ask" }
		                },
                        hist: {type: "history"},
		                ask: {
			                entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
		                },
                        maxspeech: {
                             ...speech("You did not respond, please confirm it")},
		                nomatch: {
			                entry: say("Please repeat it again"),
			                on: { ENDSPEECH: "prompt" }
		                }
                    }
	            },
                help5:{
                    ...helpm("Just confirm it","notime")
                },
				whattime: {
					initial: "prompt",
					on: {
						RECOGNISED: [{
							cond: (context) => "time" in (grammar[context.recResult] || {}),
							actions: [assign((context) => { return { time: grammar[context.recResult].time } }),assign((context) => { grammar3["count"]=0}),cancel("maxsp")],
							target: "withtime"

						},
						{ target: ".nomatch" ,
                        cond: (context) => !(context.recResult in commands),
                        actions: cancel("maxsp")},
                        {target: "help6",
                        cond: (context) => context.recResult in commands,
                        actions: cancel("maxsp")}],
                        MAXSPEECH: [{target:".maxspeech",
                        cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}]  
					},
					states: {
						prompt: { entry: say("What time is your meeting"),
						on: { ENDSPEECH: "ask" }
					},
                    hist: {type: "history"},
					ask: {
						entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
				},
                maxspeech: {
                  ...speech("You did not respond, say a time")
                },
				nomatch: {
					entry: say("Please repeat it again"),
					on: { ENDSPEECH: "prompt" }
				}
			}
		},
        help6:{
            ...helpm("Just tell me the time","whattime")
        },
        
		withtime: {
			initial: "prompt",
			on: {
				RECOGNISED: [{ 
					cond: (context) => grammar2[context.recResult] === true,
					target: "Finished",
                    actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]},
					{
					cond: (context) => grammar2[context.recResult] === false,
					target: "who",
                    actions: [assign((context) => { grammar3["count"]=0}),cancel("maxsp")]
				 },
				 { target: ".nomatch",
                 cond: (context) => !(context.recResult in commands),
                 actions: cancel("maxsp")},
                 {target: "help7",
                 cond: (context) => context.recResult in commands,
                 actions: cancel("maxsp")}],
                 MAXSPEECH: [{target:".maxspeech",
                 cond: (context) => grammar3["count"] <= 2,
                actions: assign((context) => { grammar3["count"]=grammar3["count"]+1 } )
                },{target: "#root.dm.init", 
                cond: (context) => grammar3["count"] > 2, 
                actions:assign((context) => { grammar3["count"]=0})}] 
			 },
			 states: {
				 prompt: {
					 entry: send((context) => ({
						 type: "SPEAK",
						 value: `Good. Do you want to me create an appointment with ${context.person} on ${context.day} at ${context.time}?`
					 })),
					 on: { ENDSPEECH: "ask" }
				 },
                 hist: {type: "history"},
				 ask: {
					 entry: [listen(), send('MAXSPEECH', {delay: 5000, id: "maxsp"})]
				 },
                maxspeech: {
                 ...speech("You did not respond, just confirm it")
                },        
				 nomatch: {
					 entry: say("Please repeat it again"),
					 on: { ENDSPEECH: "prompt" }
				 }
			 }
		},
        help7:{
            ...helpm("Please confirm it","withtime")
        },
        
        Finished: {
		                 initial: "prompt",
		                 on: { ENDSPEECH: "init" },
		                 states: {
			                 prompt: { entry: say("Your appointment has been created!")
		                    },
	                    }
	                }	    
                }
            })


			/* RASA API
 *  */
const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = "https://intents-oyousuf.herokuapp.com/model/parse"
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: "POST",
        headers: { "Origin": "http://localhost:3000/react-xstate-colourchanger" }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());
