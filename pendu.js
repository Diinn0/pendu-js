const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const { Client, GatewayIntentBits, Collection, Partials, EmbedBuilder} = require('discord.js');

const { token, admin, clientId, guildId, channel } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const {REST} = require("@discordjs/rest");
const { Routes } = require('discord.js');

const mots = require('./mots.json');

let mot = "";
let motc = "";
let gameStarted = false;
let essaiMax = 6;
let essai = 0;
let lettreUsed = "";

let msgId = "";

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

// Login to Discord with your client's token
client.login(token);


client.on('messageCreate', async  interaction => {
   if (interaction.author.bot === true) return;
   if (interaction.channel.id !== channel && interaction.channel.type !== 1) return;

   const msg = interaction.content;
   const canal = client.channels.cache.get(interaction.channel.id);

   if (msg.startsWith('/ping')) {
       canal.send("Mon ping est de **" + Math.abs(Date.now() - interaction.createdTimestamp) + "ms** 🏓");
       return;
   }

   if (msg.startsWith("/pendu") && !gameStarted) {
       mot = mots.liste_mot[Math.round(Math.random() * mots.liste_mot.length)];
       gameStarted = true;
       essai = 0;
       lettreUsed = "Aucune";
       msgId = "";

       motc = mot[0];
       for (let i = 1; i < mot.length; i++) {
           motc += " _";
       }

       essaiMax = Math.floor(mot.length*80/100);
       // essaiMax = 6;

       const embed = new EmbedBuilder()
           .setTitle("`>" + motc + "<`")
           .setDescription(affPendu(Math.round(essai*6/essaiMax)))
           .setColor(0xd128cc)
           .addFields(
               { name: 'Essai restant', value: essai + "/" + essaiMax, inline: true },
               { name: 'Lettre utilisé', value: lettreUsed, inline: true },
           );

       // canal.send("`" + motc + "`");

       canal.send({embeds: [embed]}).then(sent => {
           msgId = sent.id;
       });
       return;
   }

   if (gameStarted) {
       if (interaction.channel.type !== 1) await interaction.delete();
       if (!msg.startsWith("/")) {
           if (msg.length === 1) {
               // if (msg.match("[a-zA-Z]")) {
               //     canal.send("La lettre :regional_indicator_" + msg.toLowerCase() + ':');
               // }

               let error = true;
               for (let i = 1; i < mot.length; i++) {
                   if (mot[i] === msg.toUpperCase()) {
                       motc = motc.replaceAt(i*2, msg.toUpperCase());
                       error = false;
                   }
               }

               if (error) {
                   if (!lettreUsed.includes(msg.toUpperCase())) {
                       essai++;
                       if (lettreUsed === "Aucune") lettreUsed = "";
                       lettreUsed += msg.toUpperCase();
                   }
               }

               const embed = new EmbedBuilder()
                   .setTitle("`>" + motc + "<`")
                   .setDescription(affPendu(Math.round(essai*6/essaiMax)))
                   .setColor(0xd128cc)
                   .addFields(
                       { name: 'Essai restant', value: essai + "/" + essaiMax, inline: true },
                       { name: 'Lettre utilisé', value: lettreUsed, inline: true },
                   );

               if (!motc.match("_")) {
                   gameStarted = false;
                   canal.messages.fetch(msgId).then(message => {
                       message.edit({embeds: [embed]});
                   });
                   canal.send("https://fr.wiktionary.org/wiki/" + mot.toLowerCase());
                   canal.send("https://fr.wikipedia.org/wiki/" + mot.toLowerCase());
                   return;
               }

               // canal.send("`" + motc + "`");


               if (msgId === "") {
                   canal.send({embeds: [embed]}).then(sent => {
                        msgId = sent.id;
                   });
               } else {
                   canal.messages.fetch(msgId).then(message => {
                       message.edit({embeds: [embed]});
                   });
               }

               if (essai >= essaiMax) {
                   canal.send("Pendu ! le mot était " + mot);
                   canal.send("https://fr.wiktionary.org/wiki/" + mot.toLowerCase());
                   canal.send("https://fr.wikipedia.org/wiki/" + mot.toLowerCase());
                   gameStarted = false;
                   return;
               }



           }
           // else {
           //     let sen = "";
           //
           //     for (let i = 0; i < msg.length; i++) {
           //         if (msg.match("[a-zA-Z]")) {
           //             sen += ":regional_indicator_" + msg[i] + ":";
           //         } else {
           //             sen += msg[i];
           //         }
           //     }
           //     canal.send(sen);
           //
           //
           //     if (mot === msg.toUpperCase()) {
           //         canal.send("Pendu !, le mot était " + mot);
           //         canal.send("https://fr.wiktionary.org/wiki/" + mot.toLowerCase());
           //         gameStarted = false;
           //         return;
           //     }
           // }
       }
   }


   //Commande admin
   if (interaction.author.id === admin) {
       if (msg.startsWith('/bc')) {
           client.channels.cache.get(channel).send(msg.substring(3));
           return;
       }
   }

});

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

function affPendu(pErreur) {
    /*
    affPendu : procedure :
      Affichage du pendu à differents stades en fonction de pErreur

    Parametre:
      pErreur : int : le nombre d'erreur de l'utilisateur

    Retour:
      chaineSortie : str : la chaine de sortie
    */

    if (pErreur === 0) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃\n ┃\n ┃\n━┻━```";
    } else if (pErreur === 1) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃     O\n ┃\n ┃\n━┻━```";
    } else if (pErreur === 2) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃     O\n ┃     X\n ┃\n━┻━```";
    } else if (pErreur === 3) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃    \\O\n ┃     X\n ┃\n━┻━```";
    } else if (pErreur === 4) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃    \\O/\n ┃     X\n ┃\n━┻━```";
    } else if (pErreur === 5) {
        var chaineSortie = "``` ┏━━━━━┯\n ┃     │\n ┃    \\O/\n ┃     X\n ┃    /\n━┻━```";
    } else if (pErreur === 6) {
        var chaineSortie = "``` ┏━━━━━┯\n" +
                              " ┃     │\n" +
                              " ┃     O\n" +
                              " ┃    /X\\\n" +
                              " ┃     ║\n" +
                              "━┻━```";
    }
//Π ║
    return chaineSortie;
}

// client.once('ready', async () => {
//     const channel = client.channels.cache.get('1020331284981108816');
//     try {
//         const webhooks = await channel.fetchWebhooks();
//         const webhook = webhooks.find(wh => wh.token);
//
//         if (!webhook) {
//             return console.log('No webhook was found that I can use!');
//         }
//
//         await webhook.send({
//             content: 'Webhook test',
//             username: 'GeoGuessr Info',
//             avatarURL: 'https://i.imgur.com/AfFp7pu.png',
//             embeds: [embed],
//         });
//     } catch (error) {
//         console.error('Error trying to send a message: ', error);
//     }
// });

//
// setInterval(() => {
//     fetch('https://game-server.geoguessr.com/api/parties/65664dc6-7e60-41de-8103-e025a691909d')
//         .then((response) => response.json())
//         .then(async (data) => {
//
//             const channel = client.channels.cache.get('1020331284981108816');
//             try {
//                 const webhooks = await channel.fetchWebhooks();
//                 const webhook = webhooks.find(wh => wh.token);
//
//                 console.log(data.party.leaderboard);
//
//                 const embed = new EmbedBuilder()
//                     .setTitle(data.party.name)
//                     .setURL(data.party.shareLink)
//                     .setColor(0x00FFFF)
//                     .addFields(
//                         { name: '1er', value: data.party.leaderboard.entries[0].user.name, inline: true },
//                         { name: '2ème', value: 'Some value here', inline: true },
//                         { name: '3ème', value: 'Some value here', inline: true },
//                     );
//
//                 if (!webhook) {
//                     return console.log('No webhook was found that I can use!');
//                 }
//
//                 const message = await webhook.editMessage('1020335129647919204', {
//                     content: '',
//                     username: 'GeoGuessr Info',
//                     avatarURL: 'https://www.geoguessr.com/_next/static/images/favicon-aae84a1ec836612840470a029b5c29d6.png',
//                     embeds: [embed],
//                 });
//             } catch (error) {
//                 console.error('Error trying to send a message: ', error);
//             }
//
//             // console.log(data)
//         });
// }, 1000 * 5);
