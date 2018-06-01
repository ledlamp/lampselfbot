const Discord = require('discord.js');
const fs = require('fs');
const child_process = require('child_process');
const colors = require('colors');

const client = new Discord.Client();
/* token */																																																											client.login("MjgxMTM0MjE2MTE1MjU3MzQ0.C91VhA.FTbZB8lGGPS6xyycy3ZccLutdbc");

var ops = [];
var cmdchar = "~";

client.on('ready', () => {
 	ops.push(client.user.id);
	console.log('Ready'.green);
});




// Commands

////////////////////////////////////////////////////////////////////////////////
client.on('message', message => {

	if (message.content.substr(0,1) === cmdchar && ops.includes(message.author.id)) {

		var arg = message.content.split(' ');
		var cmd = arg[0].slice(1).toLowerCase();
		var txt = function(i) {return arg.slice(i).join(' ');}

		if (cmd === ">") {
			try {supersay('`'+eval(txt(1))+'`', message.channel);}
			catch (error) {supersay('`'+error+'`', message.channel);}
		}

		if (cmd === "$") {
			child_process.exec(txt(1), function (error, stdout, stderr) {
				supersay('**stdout:** ' + stdout, message.channel);
				supersay('**stderr:** ' + stderr, message.channel);
			});
		}

	}

});



// Eval Terminal
const stdin = process.openStdin();
stdin.addListener("data", function(data) {
	let input = data.toString().trim();
	let output;
	try {
		output = eval(input);
	}
	catch (error) {
		output = error;
	}
	console.log(colors.cyan(output));
});









// Logging
////////////////////////////////////////////////////////////////////////////////

function log(thing){
	var date = new Date();
	var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString() + " - ";
	var line = timestamp+thing;
	console.log(line);
	fs.appendFile('console.log', line+'\n');
}


// Channel stuff -- [guild] [#channel] ...

client.on('message', (message) => {
	if (message.guild) 
		log(`[${message.guild.name}] [#${message.channel.name}] ${message.id} <${message.author.tag}>: ${message.content}`);
	else
		log(`[DM] ${message.id} <${message.author.tag}>: ${message.content}`);
});
client.on('messageDelete', (message) => {
	if (message.guild)
		log(`[${message.guild.name}] [#${message.channel.name}] Message ${message.id} has been deleted.`);
	else
		log(`[DM] Message ${message.id} has been deleted.`);
});
client.on('messageDeleteBulk', (messages) => {
	if (messages.first().guild)
		log(`[${messages.first().guild.name}] [#${messages.first().channel.name}] Some messages were bulk-deleted.`);
	else
		log(`[DM] Some messages were bulk-deleted.`);
});
client.on('messageUpdate', (oldMessage, newMessage) => {
	if (newMessage.content !== oldMessage.content) {
		if (newMessage.guild)
			log(`[${newMessage.guild.name}] [#${newMessage.channel.name}] Message ${oldMessage.id} has been edited: ${newMessage.content}`);
		else
			log(`[DM] Message ${oldMessage.id} has been edited: ${newMessage.content}`);
	}
});
client.on('messageReactionAdd', (messageReaction, user) => {
	log((messageReaction.message.guild ? `[${messageReaction.message.guild.name}] [#${messageReaction.message.channel.name}]` : '[DM]') + ` <${user.tag}> reacted to message ${messageReaction.message.id} with :${messageReaction.emoji.name}:`);
});
client.on('messageReactionRemove', (messageReaction, user) => {
	log((messageReaction.message.guild ? `[${messageReaction.message.guild.name}] [#${messageReaction.message.channel.name}]` : '[DM]') + ` <${user.tag}> removed reaction :${messageReaction.emoji.name}: from message ${messageReaction.message.id}`);
});
client.on('messageReactionRemoveAll', (message) => {
	log((message.guild ? `[${message.guild.name}] [#${message.channel.name}]` : '[DM]') + ` All reactions on message ${message.id} have been removed.`);
});
client.on('channelPinsUpdate', (channel) => {
	log((channel.guild ? `[${channel.guild.name}] [#${channel.name}]` : '[DM]') + ` Pinned messages updated.`);
});



// Guild stuff -- [guild] ...

client.on('guildBanAdd', (guild, user) => {
	log(`[${guild.name}] ${user.tag} has been banned.`);
});
client.on('guildBanRemove', (guild, user) => {
	log(`[${guild.name}] ${user.tag} has been unbanned.`);
});
client.on('guildMemberAdd', (member) => {
	log(`[${member.guild.name}] ${member.user.tag} joined the guild.`);
});
client.on('guildMemberRemove', (member) => {
	log(`[${member.guild.name}] ${member.user.tag} left the guild.`);
});
client.on('channelCreate', (channel) => {
	log(`[${channel.guild.name}] [#${channel.name}] Channel created.`);
});
client.on('channelDelete', (channel) => {
	log(`[${channel.guild.name}] [#${channel.name}] Channel deleted.`);
});
client.on('channelUpdate', (oldChannel, newChannel) => {
	if (newChannel.name !== oldChannel.name) {
		log(`[${newChannel.guild.name}] [#${newChannel.name}] Channel renamed from #${oldChannel.name} to #${newChannel.name}`);
	}
});
client.on('emojiCreate', (emoji) => {
	log(`[${emoji.guild.name}] Emoji :${emoji.name}: has been created; URL:${emoji.url}`);
});
client.on('emojiDelete', (emoji) => {
	log(`[${emoji.guild.name}] Emoji :${emoji.name}: has been deleted.`);
});
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	if (newEmoji.name !== oldEmoji.name) {
		log(`[${emoji.guild.name}] Emoji :${oldEmoji.name}: has been renamed to :${newEmoji.name}:`);
	}
});


// Client stuff

client.on('guildCreate', (guild) => {
	log(`Client joined guild "${guild.name}"`);
});

client.on('guildDelete', (guild) => {
	log(`Client left guild "${guild.name}"`);
});

client.on('disconnect', (event) => {
	log('Websocket Disconnected');
});

client.on('reconnecting', () => {
	log('Reconnecting to WebSocket');
});

client.on('resume', (replayed) => {
	log('WebSocket resumed. '+replayed)
});

client.on('warn', (info) => {
	log('Warn: '+info);
});

//client.on('debug', (info) => {
//	log('Debug: '+info);
//});


////////////////////////////////////////////////////////////////////////////////












// Utility functions
////////////////////////////////////////////////////////////////////////////////
function chunkSubstr(str, size) {
  var numChunks = Math.ceil(str.length / size),
      chunks = new Array(numChunks);
  for(var i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}

function supersay(input, channel) {
	if (input.length > 2000) {
		let chunks = chunkSubstr(input, 2000);
		chunks.forEach(function(chunk) {
			channel.send(chunk);
		});
	} else {
		channel.send(input);
	}
}
/*
////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', err => {
	console.error(colors.red(err));
	process.exit();
});*/
