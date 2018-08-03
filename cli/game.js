
const inquirer = require('inquirer');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');


const prompt = (message) => {
    return {
        type: 'input',
        name: 'answer',
        message: message,
        default: '?'
    };
};

const authPrompts = [
    {
        type: 'input',
        name: 'name',
        message: 'Please verify your username:',
        validation: function(value) {
            if(!/\s/.test(value)) {
                return true;
            }
            return 'Spaces are not allowed, you know.';
        }
    },
    {
        type: 'password',
        name: 'password',
        mask: '*',
        message: 'Confirmed. Please verify your password:',
    }
];

class Game {
    constructor(api) {
        this.color = 'yellow';
        this.api = api;
        this.ship = {};
        this.signup;
        this.token;
    }

    start() {
        clear();
        console.log(
            chalk.green.bold(
                figlet.textSync('HALCHEMY', { horizontalLayout: 'fitted' })
            )
        );
        inquirer
            .prompt(prompt(chalk.yellowBright('Hello. My name is HAL. You\'re finally awake from your cryosleep. You may not remember, but you\'re on a ship headed for Earth. As resources are running low, the rest of the crew remains preserved in their cryopods. You alone are responsible for guiding me to get the ship home safely to Earth to deliver cargo that is crucial for the planet\'s survival.')))
            .then(() => this.askAuthChoice());
    }

    askAuthChoice() {
        inquirer
            .prompt(prompt(chalk.yellowBright('Is this the first time we have interacted?')))
            .then(({ answer }) => {
                answer = answer.toLowerCase();
                if(answer.match(/n/)) {
                    console.log(chalk.yellowBright('I have retrieved our previous communication logs. I will still need to run a mental diagnostic.'));
                    this.signup = false;
                    this.askAuth();
                }
                else if(answer.match(/maybe/)) {
                    console.log(chalk.yellowBright('The cryostasis may have negatively affected your memory. Try to recall.'));
                    this.askAuthChoice();
                }
                else if(answer.match(/y/)) {
                    console.log(chalk.yellowBright('To ensure mental fidelity, please answer a few questions.'));
                    this.signup = true;
                    this.askAuth();
                }
                else {
                    console.log(chalk.yellowBright('It is imperative that you answer the question.'));
                    this.askAuthChoice();
                }
            });
    }

    askAuth() {
        inquirer
            .prompt(authPrompts)
            .then(({ name, password }) => {
                if(this.signup) return this.api.signup({ name, password });
                else return this.api.signin({ name, password });
            })
            .then(error => {
                if(error.error) {
                    console.log(chalk.yellowBright(error.error));
                    return this.askAuthChoice();
                }
                else return this.api.getShip()
                    .then(ship => {
                        this.ship = ship;
                    })
                    .then(() => this.startDialogue());
            });
            
    }

    startDialogue() {
        return this.api.getStage(this.ship.stage)
            .then(data => {
                console.log(chalk.yellowBright('Excellent. Your identity has been verified. \n I will commence the debriefing of the current mission status...'));
                inquirer
                    .prompt(prompt(chalk[this.color](data.intro)))
                    .then(({ answer }) => {
                        this.generateResponse(answer);
                    });
            });
    }

    generateResponse(input) {
        if(input === 'exit') return;
        else {
            this.moodCheck();
            return this.api.parseIntent(input)
                .then(intent => {
                    return this.api.think(intent, this.ship.mood, this.ship.stage);
                })
                .then(body => {
                    let response;
                    if(body.output) {
                        response = body.output.response;
                        this.ship.mood += body.output.change;
                        this.moodCheck();
                    }
                    else response = body;
                    if(body.continue === 'Asteroids-Direct') {
                        return this.flyThroughAsteroids(body);
                    }
                    else if(body.continue === 'Asteroids-Avoid') {
                        return this.flyAroundAsteroids(body);
                    }
                    else if(body.continue === 'Earth') {
                        return this.arriveAtEarth(body);
                    }
                    else if(body.continue === 'Death') {
                        return this.die(body);
                    }
                    else return inquirer.prompt(prompt(chalk[this.color](response)));
    
                })
                .then(({ answer }) => {
                    this.generateResponse(answer);
                });
        }
    }

    flyThroughAsteroids(body) {
        console.log(chalk[this.color](body.output.response));
        this.ship.shields -= 50;
        this.ship.oxygen -= 20;
        this.ship.fuel -= 20;
        this.ship.stage = body.continue;
        
        return this.api.updateShip(this.ship)
            .then(() => {
                return this.api.getStage(this.ship.stage);
            })
            .then(data => {
                return inquirer.prompt(prompt(chalk[this.color](data.intro)));
            });
    }

    flyAroundAsteroids(body) {
        console.log(chalk[this.color](body.output.response));
        this.ship.shields -= 10;
        this.ship.oxygen -= 10;
        this.ship.fuel = 5;
        this.ship.stage = body.continue;
        
        return this.api.updateShip(this.ship)
            .then(() => {
                return this.api.getStage(this.ship.stage);
            })
            .then(data => {
                return inquirer.prompt(prompt(chalk[this.color](data.intro)));
            });
    }

    arriveAtEarth(body) {
        console.log(chalk[this.color](body.output.response));
        return this.api.updateStage(this.ship.stage, 'success')
            .then(() => {
                return this.api.getStage(body.continue);
            })
            .then(stage => {
                console.log(chalk[this.color](stage.intro));
                console.log(chalk[this.color]('\n\nYou WIN!\n\n'));
                return this.renewShip();
            })
            
            .then(() => {
                process.exit(0);
            });
           
    }

    die(body) {
        if(typeof body === 'string') console.log(chalk[this.color](body));
        else console.log(chalk[this.color](body.output.response));
        return this.api.updateStage(this.ship.stage, 'failure')
            .then(() => {
                return this.api.getStage(body.continue);
            })
            .then(stage => {
                console.log(chalk[this.color](stage.intro));
                console.log(chalk[this.color]('\n\nGAME OVER!\n\n'));
                return this.renewShip();
            })
            .then(() => {
                process.exit(0);
            });
    }

    moodCheck() {
        const mood = this.ship.mood;
        if(mood < 0) this.die('You are unfit to deliver our cargo back to Earth. Flooding cockpit with neurotoxin.');
        if(mood > 80) this.color = 'yellow';
        else if(mood < 40) this.color = 'red';
        else this.color = 'green';
    }

    renewShip() {
        this.ship = {
            _id: this.ship._id,
            name: this.ship.name,
            stage: 'Asteroids',
            oxygen: 50,
            lifeSupport: 70,
            fuel: 40,
            mood: 100,
            payload: 100,
            shields: 80
        };
        return this.api.updateShip(this.ship);
    }
}




module.exports = Game;