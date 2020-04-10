

/* initialization */

process.on('unhandledRejection', error => {
	console.error(error.stack);
});

var Discord = require('discord.js');
var fs = require('fs');
var child_process = require('child_process');
var exitHook = require('exit-hook');

var config = require('./config.json');
var client = new Discord.Client();
client.login(config.token);
client.on('ready', ()=>{
	client.user.setStatus('invisible');
});
client.on('error', error => console.error(error.stack));








/* logging */

var logpath = "discord.log";
fs.appendFileSync(logpath, '\n\n\n');
var log = {
	log: function (str) {
		var date = new Date();
		var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString() + " - ";
		var line = timestamp + str;
		line = line.replace(/\n/g, "\\n");
//		console.log(line);
		fs.appendFileSync(logpath, line + '\n');
	},
	channel: function (content, channel) {
		//if (channel.guild && channel.guild.muted) return;
		if (channel.guild)
			this.log(`/${channel.guild.id}(${channel.guild.name})/${channel.id}(${channel.name})/${content}`);
		 else 
			this.log(`/${channel.id}(DM)/${content}`);
	},
	guild: function (content, guild) {
		//if (guild.muted) return;
		this.log(`/${guild.id}(${guild.name})/${content}`);
	},
	client: function (str) {
		this.log(str);
	}
};
log.client('Program Started');

// channel
client.on('message', (message) => log.channel(`${message.author.id}(${message.author.tag})/${message.id}: ${message.content} ${message.attachments.first() ? `\nAttachment: ${message.attachments.first().url}` : ''}`, message.channel));
client.on('messageDelete', (message) => log.channel(`Message ${message.id} has been deleted.`, message.channel));
client.on('messageDeleteBulk', (messages) => log.channel(`Messages have been bulk-deleted: ${messages.map(m => m.id).join(', ')}`, messages.first().channel));
client.on('messageUpdate', (oldMessage, newMessage) => {
	if (newMessage.content !== oldMessage.content) log.channel(`Message ${oldMessage.id} has been edited.\nOld content: ${oldMessage.content}\nNew content: ${newMessage.content}`, newMessage.channel);
});
client.on('messageReactionAdd', (messageReaction, user) => log.channel(`User ${user.id} (${user.tag}) reacted to message ${messageReaction.message.id} with :${messageReaction.emoji.name}:`, messageReaction.message.channel));
client.on('messageReactionRemove', (messageReaction, user) => log.channel(`User ${user.id} (${user.tag}) removed reaction :${messageReaction.emoji.name}: from message ${messageReaction.message.id}`, messageReaction.message.channel));
client.on('messageReactionRemoveAll', (message) => log.channel(`All reactions on message ${message.id} have been removed.`, message.channel));
client.on('channelCreate', (channel) => log.channel(`Client gained access to channel.`, channel));
client.on('channelDelete', (channel) => log.channel(`Client lost access to channel.`, channel));
client.on('channelPinsUpdate', (channel) => log.channel(`Pinned messages have been updated.`, channel));
client.on('channelUpdate', (oldChannel, newChannel) => {
	if (newChannel.type === "text") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel renamed from #${oldChannel.name} to #${newChannel.name}`, newChannel);
		if (newChannel.topic !== oldChannel.topic) log.channel(`Topic changed from "${oldChannel.topic}" to "${newChannel.topic}"`, newChannel);
		if (newChannel.nsfw !== oldChannel.nsfw) log.channel(`NSFW mode is now ${newChannel.nsfw ? 'enabled' : 'disabled'}.`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites) log.channel(`Permissions have been updated.`, newChannel);
		if (newChannel.position !== oldChannel.position) log.channel(`Channel position has changed to ${newChannel.position}`, newChannel);
	}
	if (newChannel.type === "voice") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel name changed from "${oldChannel.name}" to "${newChannel.name}"`, newChannel);
		if (newChannel.bitrate !== oldChannel.bitrate) log.channel(`Bitrate changed from "${oldChannel.bitrate}" to "${newChannel.bitrate}"`, newChannel)
		if (newChannel.userLimit !== oldChannel.userLimit) log.channel(`User limit changed from "${oldChannel.userLimit}" to "${newChannel.userLimit}"`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites)  log.channel(`Permissions have been updated.`, newChannel);
	}
});

// guild
client.on('guildBanAdd', (guild, user) => log.guild(`User ${user.id} (${user.tag}) has been banned.`, guild));
client.on('guildBanRemove', (guild, user) => log.guild(`User ${user.id} (${user.tag}) has been unbanned.`, guild));
client.on('guildMemberAdd', (member) => log.guild(`User ${member.user.id} (${member.user.tag}) joined the guild.`, member.guild));
client.on('guildMemberRemove', (member) => log.guild(`User ${member.user.id} (${member.user.tag}) left the guild.`, member.guild));
client.on('guildMemberUpdate', (oldMember, newMember) => {
	if (newMember.nickname !== oldMember.nickname) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) changed their nickname from "${oldMember.nickname || '(none)'}" to "${newMember.nickname || '(none)'}"`, newMember.guild);
	if (newMember.roles !== oldMember.roles) log.guild(`Roles on user ${newMember.user.id} (${newMember.user.tag}) have been updated.`, newMember.guild);
	if (newMember.serverMute !== oldMember.serverMute) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) has been ${newMember.serverMute ? '' : 'un-'}server-muted.`, newMember.guild);
	if (newMember.serverDeaf !== oldMember.serverDeaf) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) has been ${newMember.serverMute ? '' : 'un-'}server-deafened.`, newMember.guild);
});
client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (newMember.voiceChannel !== oldMember.voiceChannel) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) ${newMember.voiceChannel ? `joined voice channel "${newMember.voiceChannel.name}"` : 'left voice channel.'}`, newMember.guild);
});
/*client.on('presenceUpdate', (oldMember, newMember)=>{
	if (newMember.presence.status != oldMember.presence.status) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) status changed from ${oldMember.presence.status} to ${newMember.presence.status}`, newMember.guild);
	if ((newMember.presence.game && newMember.presence.game.name) != (oldMember.presence.game && oldMember.presence.game.name)) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) is now playing ${newMember.presence.game && newMember.presence.game.name} after playing ${oldMember.presence.game && oldMember.presence.game.name}`, newMember.guild);
});*/
client.on('emojiCreate', (emoji) => log.guild(`Emoji "${emoji.identifier}" has been created. URL: ${emoji.url}`, emoji.guild));
client.on('emojiDelete', (emoji) => log.guild(`Emoji "${emoji.identifier}" has been deleted. URL: ${emoji.url}`, emoji.guild));
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	if (newEmoji.name !== oldEmoji.name) log.guild(`Emoji "${oldEmoji.identifier}" has been renamed to ${newEmoji.name}`, newEmoji.guild);
});
client.on('roleCreate', role => log.guild(`Role "${role.name}" has been created. ID: ${role.id} Color: ${role.color} Permissions: ${role.permissions} Position: ${role.position}`, role.guild));
client.on('roleDelete', role => log.guild(`Role "${role.name}" has been deleted. ID: ${role.id} Color: ${role.color} Permissions: ${role.permissions} Position: ${role.position}`, role.guild));
client.on('roleUpdate', (oldRole, newRole) => {
	if (newRole.name !== oldRole.name) log.guild(`Role ${oldRole.id} (${oldRole.name}) has been renamed to "${newRole.name}"`, newRole.guild);
	if (newRole.color !== oldRole.color) log.guild(`Color of role ${oldRole.id} (${oldRole.name}) has changed from ${oldRole.color} to ${newRole.color}`, newRole.guild);
	if (newRole.position !== oldRole.position) log.guild(`Position of role ${oldRole.id} (${oldRole.name}) changed from ${oldRole.position} to ${newRole.position}`, newRole.guild);
	if (newRole.permissions !== oldRole.perissions) log.guild(`Permissions of role ${oldRole.id} (${oldRole.name}) changed from ${oldRole.permissions} to ${newRole.permissions}`, newRole.guild);
});

// client
client.on('guildCreate', (guild) => log.client(`Client joined guild ${guild.id} (${guild.name})`));
client.on('guildDelete', (guild) => log.client(`Client left guild ${guild.id} (${guild.name})`));
client.on('userUpdate', (oldUser, newUser) => {
	if (newUser.tag !== oldUser.tag) log.client(`User ${newUser.id} changed their username from "${oldUser.tag}" to "${newUser.tag}"`);
	if (newUser.displayAvatarURL !== oldUser.displayAvatarURL) log.client(`User ${newUser.id} (${newUser.tag}) changed their avatar. Old avatar: ${oldUser.displayAvatarURL} New avatar: ${newUser.displayAvatarURL}`);
});

client.on('ready', () => log.client('Client Ready'));
client.on('disconnect', (event) => log.client('Client Websocket Disconnected'));
client.on('reconnecting', () => log.client('Client Reconnecting to Websocket'));
client.on('resume', (replayed) => log.client(`Client Resumed. ${replayed}`));
client.on('warn', (info) => log.client(`WARN: ${info}`));
/*client.on('debug', (info) => log.client('Debug: '+info));*/

exitHook(() => log.client('Process Exiting'));













/* self commands */

client.on('message', message => (async function(message){
	if (message.author.id !== client.user.id) return;

	var args = message.content.split(' ');
	var txt = function(i) {return args.slice(i).join(' ');}

	if (message.content.startsWith('~')) {
        let cmd = args[0].slice(1).toLowerCase();
		switch (cmd) {
			
			case "eval":
			case ">":
				with (message) {
					let output;
					try { output = eval(txt(1)) }
					catch (error) { output = error }
					message.channel.send('`'+output+'`', {split:{char:''}});
				}
				break;

			case "exec":
			case "$":
				child_process.exec(txt(1), function (error, stdout, stderr) {
					if (error) message.channel.send(error);
					if (stdout) message.channel.send(stdout, {split:{char:''}});
					if (stderr) message.channel.send(stderr, {split:{char:''}});
				});
				break;
			
			case "ping": message.channel.send('pong'); break;

			// experimental
			case "record": {
				let id = txt(1);
				let vch = client.channels.get(id);
				if (!(vch && vch.join)) message.react('⚠️');
				else {
					vch.join().then(vcon => {
						var dp = "rec/" + new Date().toLocaleString();
						fs.mkdirSync(dp);
						let rcv = vcon.createReceiver();
						rcv.userstreams = []; // y d.js no do dis
						vcon.on("speaking", function(user, speaking){
							if (!speaking) return;
							for (let us of rcv.userstreams)
								if (us.user == user)
									return;
							let stream = rcv.createStream(user, {mode:'pcm', end:'manual'});
							rcv.userstreams.push({user, stream});
							stream.pipe(fs.createWriteStream(`${dp}/${user.tag.replace(/\//g, ':')}.pcm`));
						});
						message.react('🆗');
					});
				}
			}
			break;

			// experimental
			case "stoprec": {
				let id = txt(1);
				let vch = client.channels.get(id);
				if (!vch) message.react('⚠️');
				else {
					let vcon = vch.connection;
					if (vcon) {
						vcon.receivers.forEach(rcv => {
							if (rcv.userstreams) {
								rcv.userstreams.forEach(us => us.stream.end())
							}
						});
					}
					vch.leave();
					message.react('🆗');
				}
			}
			break;
			
		}    
	}

}).call(message, message));








/* notify me if someone mentioned a keyword */

{
	let webhook = config.mentionChannelWebhook;
	webhook = new Discord.WebhookClient(webhook.id, webhook.token);
	client.on("message", async message => {
		if (message.author.id == client.user.id || !message.guild || message.guild.muted) return;
		for (let keyword of config.mentionKeywords) {
			if (message.content.toLowerCase().includes(keyword)) {
				webhook.send(`<@${client.user.id}> https://discordapp.com/channels/${message.guild ? message.guild.id + "/" : ""}${message.channel.id}/${message.id}`, {embeds:[{
					color: (message.member && message.member.displayColor) || undefined,
					author: {
						name: (message.member && message.member.displayName) || message.author.username,
						icon_url: message.author.avatarURL
					},
					description: message.content,
					timestamp: message.createdAt,
					image: (message.attachments.first() && message.attachments.first().width) ? {url:message.attachments.first().url} : undefined,
					footer: {
						text: `${message.guild.name} ▶︎ #${message.channel.name}`
					}
				}]});
				break;
			}
		}
	});
}








/* embed linked messages */

client.on("message", async function (message) {
	if (message.author.id !== client.user.id) return;
	let mlm = message.content.match(/https:\/\/discordapp\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/);
	if (!mlm) return;
	let lmc = client.channels.get(mlm[2]);
	if (!lmc) return;
	let lm = await lmc.fetchMessage(mlm[3]);
	if (!lm) return;
	let lme = {
		color: (lm.member && lm.member.displayColor) || undefined,
		author: {
			name: (lm.member && lm.member.displayName) || lm.author.username,
			icon_url: lm.author.avatarURL
		},
		description: lm.content,
		timestamp: lm.createdAt,
		image: (lm.attachments.first() && lm.attachments.first().width) ? {url:lm.attachments.first().url} : undefined,
		footer: {
			text: (lm.guild && lm.channel != message.channel) ? `${lm.guild != message.guild ? `${lm.guild.name} ▶︎ ` : ''}#${lm.channel.name}` : undefined
		}
	};
	let mlpi = message.content.indexOf(mlm[0]) + mlm[0].length;
	let mmc = message.content.substring(0, mlpi) + ` <@${lm.author.id}>` + message.content.substring(mlpi);
	await message.edit(mmc, {embed: lme});
	// mentions in edits don't have effect; little hack to work-around :jacc:
	(await message.channel.send(`<@${lm.author.id}>`)).delete();
});




/* fake nitro for solitary emoji */

client.on("message", async message => {
	if (message.author == client.user && message.content.startsWith(':') && message.content.endsWith(':')) {
		let name = message.content.slice(1, -1);
		let emoji = client.emojis.find(x => x.name == name);
		if (!emoji) return;
		message.delete();
		if (!fs.existsSync('.emojicache')) fs.mkdirSync('.emojicache');
		let cachedpath = `.emojicache/${emoji.url.split('/').pop()}`;
		if (fs.existsSync(cachedpath)) {
			await message.channel.send(new Discord.Attachment(cachedpath));
		} else {
			let emojibuf = (await require('snekfetch').get(emoji.url)).body;
			let rszbuf;
			if (emoji.animated) {
				rszbuf = await new Promise(function(resolve,reject){
					let cp = require("child_process").execFile("gifsicle", ['-', '--resize-touch', '48x48'], {encoding: 'buffer'}, function(err,stdout,stderr){
						if (err) return reject(err);
						resolve(stdout);
					});
					cp.stdin.write(emojibuf);
					cp.stdin.end();
				});
			} else {
				rszbuf = await require('sharp')(emojibuf).resize(48,48,{fit:'inside'}).toBuffer();
			}
			await message.channel.send(new Discord.Attachment(rszbuf, `${emoji.name}.${emoji.url.split('.').pop()}`));
			fs.writeFileSync(cachedpath, rszbuf);
		}
	}
});


