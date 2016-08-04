'use strict';
const BootBot = require('bootbot');
const config = require('config');
const random = require('random-js')();
const pokemon = require('./pokemon');

const bot = new BootBot({
  accessToken: config.get('access_token'),
  verifyToken: config.get('verify_token'),
  appSecret: config.get('app_secret')
});

const askPokemon = (convo) => {
  const randomID = random.integer(1, 151);
  convo.set('currentPokemon', randomID);

  const question = () => (
    convo.sendGenericTemplate([{
      title: pokemon[randomID - 1],
      subtitle: `What's this Pokémon's number?`,
      image_url: `https://yostik.io/images/pokemon/messenger_cards/${randomID}.jpg`
    }])
  );
  const answer = (payload, convo) => {
    if (!payload.message) { convo.end(); }
    const score = convo.get('score') || 0;
    if (payload.message.text === convo.get('currentPokemon').toString()) {
      convo.set('score', score + 1);
      convo.say('Correct! Try another one:', { typing: true })
        .then(() => askPokemon(convo));
    } else {
      convo.say(`Nope! That Pokémon is actually #${randomID}`, { typing: true })
        .then(() => convo.say(`Your score was: ${score}. Type START to play again!`))
        .then(() => convo.end());
    }
  };

  convo.ask(question, answer);
};

const newGameMenu = (payload, chat) => {
  chat.say(`Let's see how much you know about Pokémon...`, { typing: true })
    .then(() => chat.conversation(askPokemon));
};

const helpMenu = (payload, chat) => {
  chat.say(`Just type START or PLAY to get started!`, { typing : true });
};

bot.hear([`start`, `play`, /let(')?s play/i], newGameMenu);

bot.hear(['help', 'help me'], helpMenu);

bot.setGetStartedButton((payload, chat) => {
  chat.say(`Hey there, trainer! How well you think you know your Pokémon?.`, { typing: true })
    .then(() => chat.say(`Type START or PLAY to join the challenge!`, { typing: true }));
});

bot.setPersistentMenu([
  { type: 'postback', title: 'New Game', payload: 'MENU_NEW_GAME' },
  { type: 'postback', title: 'Help', payload: 'MENU_HELP' }
]);

bot.on('postback:MENU_NEW_GAME', newGameMenu);
bot.on('postback:MENU_HELP', helpMenu);

bot.start(config.get('bot_port'));
