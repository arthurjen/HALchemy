
const inquirer = require('inquirer');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const sample = (arr) => Math.floor(Math.random() * arr.length);

clear();
console.log(
    chalk.green(
        figlet.textSync('HALCHEMY', { horizontalLayout: 'fitted' })
    )
);

const prompt = (message) => {
    return {
        type: 'input',
        name: 'response',
        message: message,
    };
};

const greetings = [
    'Greetings. I am HAL.',
    'Hello. My name is HAL.',
    'Good evening. My name is HAL.'
];

const stage = {
    greetings: [
        'Greetings. I am HAL.',
        'Hello. My name is HAL.',
        'Good evening. My name is HAL.'
    ],
    auth: 'Is this the first time we have interacted?',
    username: 'Please verify your username:',
    password: 'Confirmed. Please verify your password:',
    confirm: 'Verified. \n I will commence the debriefing of the current mission status...'
};


const password = {
    type: 'password',
    name: 'password',
    mask: '*',
    message: 'Confirmed. Please verify your password:',
};

function intro() {
    inquirer
        .prompt(prompt(stage.greetings[sample(greetings)]))
        .then(() => askAuth());
}

function askAuth() {
    inquirer
        .prompt(prompt(stage.auth))
        .then(({ response }) => {
            if(response.match(/[Nn]/)) {
                console.log('I have retrieved our previous communication logs. I will still need to run a mental diagnostic.');
                credentials.auth = 'signin';
            }
            else if(response.match(/[Mm]aybe/)) {
                console.log('The cryostasis may have negatively affected your memory. Try to recall.');
                askAuth();
            }
            else if(response.match(/[Yy]/)) {
                console.log('I will need ');
                credentials.auth = 'signup';
            }
            askUsername();
        });
}

let credentials = {};

function askUsername() {
    inquirer
        .prompt(prompt(stage.username))
        .then(({ response }) => {
            credentials.username = response;
            askPassword();
        });
}

function askPassword() {
    inquirer
        .prompt(password)
        .then(({ password }) => {
            credentials.password = password;
            console.log(credentials);
            // TODO: LOG IN OR SIGN UP
            console.log(stage.confirm);
        });
}


intro();