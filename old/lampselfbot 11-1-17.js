const Discord = require('discord.js');
const fs = require('fs');
const mkdirp = require('mkdirp');
const child_process = require('child_process');
const colors = require('colors');

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const client = new Discord.Client();
client.login(config.token);

client.once('ready', () => {
	console.log('Ready'.green);
});




// Commands

////////////////////////////////////////////////////////////////////////////////
client.on('message', message => {
	if (message.author.id !== client.user.id) return;

	var args = message.content.split(' ');
	var txt = function(i) {return args.slice(i).join(' ');}

	if (message.content.startsWith(config.cmdChar)) {
		const cmd = args[0].slice(1).toLowerCase();
		if (cmd === "ping" ) message.channel.send('pong');
		if (cmd === ">") {
			(function(){
				var output;
				try {output = eval(txt(1))}
				catch (error) {output = error}
				supersay('`'+output+'`', message.channel);
			})();
		}
		if (cmd === "$") {
			child_process.exec(txt(1), function (error, stdout, stderr) {
				if (stdout) supersay('**stdout:** ' + stdout, message.channel);
				if (stderr) supersay('**stderr:** ' + stderr, message.channel);
			});
		}
	}

	args.some(arg => {
		if (!(arg.startsWith('>>') && arg.length === 20)) return false;
		message.channel.fetchMessage(arg.substr(2)).then(quote => {
			if (!quote) return;
			const embed = {
				color: (quote.member && quote.member.colorRole && quote.member.colorRole.color) || undefined,
				author: {
					name: (quote.member && quote.member.displayName) || quote.author.username,
					icon_url: quote.author.avatarURL
				},
				description: quote.content,
				timestamp: quote.createdAt,
				footer: {
					text: quote.id
				}
			};
			message.edit(undefined, {embed});
		});
		return true;
	});

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

const log = {
	startDate: Date(),
	filesUpdatedSinceStart: [],
	log: function (str, path, file, prefix) {
		var date = new Date();
		var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString() + " - ";
		//console.log(colors.dim(timestamp + (prefix || "")  + str));
		if (!path) return;
		var line = timestamp + str + '\n';
		if (!this.filesUpdatedSinceStart.includes(path+file)) {
			line = `(Client restarted at ${this.startDate})\n` + line;
			this.filesUpdatedSinceStart.push(path+file);
		}
		var append = function () {
			fs.appendFile(path + file, line, function (err) {
				if (err) {
					if (err.toString().includes('ENOENT')) {
						mkdirp(path, function (err) {
							if (err) throw err;
							console.log('Created path', path);
							append();
						});
					} else {
						console.error(colors.red(err));
					}
				}
			});
		}
		append();
	},
	channel: function (content, channel) {
		if (config.ignoredChannels.includes(channel.id) || (channel.guild && config.ignoredGuilds.includes(channel.guild.id))) return;
		this.log(
			content,
			channel.guild ? `./logs/${channel.guild.id}/${channel.id}/` : `./logs/dms/${channel.id}/`,
			'channel.log',
			channel.guild ? `[${channel.guild.name}] [#${channel.name}] ` : '[DM] '
		);
	},
	guild: function (content, guild) {
		if (config.ignoredGuilds.includes(guild.id)) return;
		this.log(
			content,
			`./logs/${guild.id}/`,
			'guild.log',
			`[${guild.name}] `
		);
	},
	client: function (str) {
		this.log(str, `./logs/`, `client.log`);
	}
};


// channel
client.on('message', (message) => log.channel(`${message.id} ${message.author.tag}: ${message.content} ${message.attachments.first() ? `\nAttachment: ${message.attachments.first().url}` : ''}`, message.channel));
client.on('messageDelete', (message) => log.channel(`Message ${message.id} has been deleted.`, message.channel));
client.on('messageDeleteBulk', (messages) => log.channel(`Some messages have been bulk-deleted!`, messages.first().channel));
client.on('messageUpdate', (oldMessage, newMessage) => {
	if (newMessage.content !== oldMessage.content) log.channel(`Message ${oldMessage.id} has been edited: ${newMessage.content}`, newMessage.channel);
});
client.on('messageReactionAdd', (messageReaction, user) => log.channel(`${user.tag} reacted to message ${messageReaction.message.id} with :${messageReaction.emoji.name}:`, messageReaction.message.channel));
client.on('messageReactionRemove', (messageReaction, user) => log.channel(`${user.tag} removed reaction :${messageReaction.emoji.name}: from message ${messageReaction.message.id}`, messageReaction.message.channel));
client.on('messageReactionRemoveAll', (message) => log.channel(`All reactions on message ${message.id} have been removed.`, message.channel));
client.on('channelCreate', (channel) => log.channel(`Client has gained access to channel.`, channel));
client.on('channelDelete', (channel) => log.channel(`Client has lost access to channel.`, channel));
client.on('channelPinsUpdate', (channel) => log.channel(`Pinned messages have been updated.`, channel));
client.on('channelUpdate', (oldChannel, newChannel) => {
	if (newChannel.type === "text") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel has been renamed from #${oldChannel.name} to #${newChannel.name}`, newChannel);
		if (newChannel.topic !== oldChannel.topic) log.channel(`Topic has been changed: ${newChannel.topic}`, newChannel);
		if (newChannel.nsfw !== oldChannel.nsfw) log.channel(`NSFW mode is now ${newChannel.nsfw ? 'enabled' : 'disabled'}.`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites) log.channel(`Permissions have been updated.`, newChannel);
		//if (newChannel.position !== oldChannel.position) log.channel(`Channel position has changed to ${newChannel.position}`, newChannel);
	}
	if (newChannel.type === "voice") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel has been renamed from ${oldChannel.name} to ${newChannel.name}`, newChannel);
		if (newChannel.bitrate !== oldChannel.bitrate) log.channel(`Bitrate has changed from ${oldChannel.bitrate} to ${newChannel.bitrate}`, newChannel)
		if (newChannel.userLimit !== oldChannel.userLimit) log.channel(`User limit has changed from ${oldChannel.userLimit} to ${newChannel.userLimit}`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites)  log.channel(`Permissions have been updated.`, newChannel);
	}
});

// guild
client.on('guildBanAdd', (guild, user) => log.guild(`${user.tag} has been banned.`, guild));
client.on('guildBanRemove', (guild, user) => log.guild(`${user.tag} has been unbanned.`, guild));
client.on('guildMemberAdd', (member) => log.guild(`${member.user.tag} joined the guild.`, member.guild));
client.on('guildMemberRemove', (member) => log.guild(`${member.user.tag} left the guild.`, member.guild));
client.on('guildMemberUpdate', (oldMember, newMember) => {
	if (newMember.nickname !== oldMember.nickname) log.guild(`User ${newMember.user.tag} changed their nickname from ${oldMember.nickname || '(none)'} to ${newMember.nickname || '(none)'}`, newMember.guild);
	if (newMember.roles !== oldMember.roles) log.guild(`Roles on ${newMember.user.tag} have been updated.`, newMember.guild);
	if (newMember.serverMute !== oldMember.serverMute) log.guild(`User ${newMember.user.tag} has been ${newMember.serverMute ? '' : 'un-'}server-muted.`, newMember.guild);
	if (newMember.serverDeaf !== oldMember.serverDeaf) log.guild(`User ${newMember.user.tag} has been ${newMember.serverMute ? '' : 'un-'}server-deafened.`, newMember.guild);
});
client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (newMember.voiceChannel !== oldMember.voiceChannel) log.guild(`${newMember.user.tag} ${newMember.voiceChannel ? `joined voice channel "${newMember.voiceChannel.name}"` : 'left voice channel.'}`, newMember.guild);
});
client.on('emojiCreate', (emoji) => log.guild(`Emoji "${emoji.identifier}" has been created. URL: ${emoji.url}`, emoji.guild));
client.on('emojiDelete', (emoji) => log.guild(`Emoji "${emoji.identifier}" has been deleted. URL: ${emoji.url}`, emoji.guild));
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	if (newEmoji.name !== oldEmoji.name) log.guild(`Emoji "${oldEmoji.identifier}" has been renamed to ${newEmoji.name}`, newEmoji.guild);
});
client.on('roleCreate', role => log.guild(`Role "${role.name}" has been created. ID: ${role.id} Color: ${role.color} Permissions: ${role.permissions} Position: ${role.position}`, role.guild));
client.on('roleDelete', role => log.guild(`Role "${role.name}" has been deleted. ID: ${role.id} Color: ${role.color} Permissions: ${role.permissions} Position: ${role.position}`, role.guild));
client.on('roleUpdate', (oldRole, newRole) => {
	if (newRole.name !== oldRole.name) log.guild(`Role "${oldRole.name}" (${oldRole.id}) has been renamed to "${newRole.name}"`, newRole.guild);
	if (newRole.color !== oldRole.color) log.guild(`Color of role "${oldRole.name}" (${oldRole.id}) has changed from ${oldRole.color} to ${newRole.color}`, newRole.guild);
	if (newRole.position !== oldRole.position) log.guild(`Position of role "${oldRole.name}" (${oldRole.id}) changed from ${oldRole.position} to ${newRole.position}`, newRole.guild);
	if (newRole.permissions !== oldRole.perissions) log.guild(`Permissions of role "${oldRole.name}" changed from ${oldRole.permissions} to ${newRole.permissions}`, newRole.guild);
});

// client
client.on('guildCreate', (guild) => log.client(`Client joined guild "${guild.name}"`));
client.on('guildDelete', (guild) => log.client(`Client left guild "${guild.name}"`));
client.on('userUpdate', (oldUser, newUser) => {
	if (newUser.tag !== oldUser.tag) log.client(`User ${oldUser.tag} changed their username to ${newUser.tag}`);
	if (newUser.displayAvatarURL !== oldUser.displayAvatarURL) log.client(`User ${newUser.tag} changed their avatar. Old avatar: ${oldUser.displayAvatarURL} New avatar: ${newUser.displayAvatarURL}`);
});

client.on('disconnect',		(event) => console.log('Websocket Disconnected'.blue));
client.on('reconnecting',	() => console.log('Reconnecting to WebSocket'.blue));
client.on('resume',			(replayed) => console.log(colors.blue('WebSocket resumed. '+replayed)));
client.on('warn',			(info) => console.log(colors.blue('[WARN] '+info)));
/*client.on('debug',		(info) => log.client('Debug: '+info));*/


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

client.on('error', error => console.error(colors.red(error)) );
