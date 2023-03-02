// Init Config
const config = require("./config.json")

// Init Constants
const Discord = require("discord.js")
const {
	REST,
	Routes
} = require('discord.js');
const rest = new REST({
	version: '10'
}).setToken(config.discord.token);
const fs = require("fs")
const path = require("path")
const colors = require("colors")
const {NodeSSH} = require('node-ssh')
const ssh = new NodeSSH()
const phoneRegex = /^1?([1-9])(\d{9})/

// Init Discord
const client = new Discord.Client({intents: ["Guilds"]})

client.on("ready", () => {
	console.log(`${colors.cyan("[INFO]")} Logged in as ${colors.green(client.user.tag)}`)
	// Log startup time in seconds
	console.log(`${colors.cyan("[INFO]")} Startup took ${colors.green((Date.now() - initTime) / 1000)} seconds.`)
	// Load Commands
	console.log(`${colors.cyan("[INFO]")} Loading Commands...`)
	const commands = require('./commands.json');
	(async () => {
		try {
			console.log(`${colors.cyan("[INFO]")} Registering Commands...`)
			let start = Date.now()
			// For every guild
			for (const guild of client.guilds.cache.values()) {
				// Register commands
				await rest.put(
					Routes.applicationGuildCommands(client.user.id, guild.id), {
						body: commands
					},
				);
			}
			console.log(`${colors.cyan("[INFO]")} Successfully registered commands. Took ${colors.green((Date.now() - start) / 1000)} seconds.`);
		} catch (error) {
			console.error(error);
		}
	})();

});

client.on("interactionCreate", async interaction => {
	if (!interaction.isCommand()) return;
	switch(interaction.commandName) {
		case "fax": // Allows a user to send a PDF to a fax number
			if (!interaction.options.get("to").value.toString().match(phoneRegex)) return interaction.reply({content: "Invalid phone number.", ephemeral: true});
			if (interaction.options.get("to").value !== interaction.options.get("confirm").value) return interaction.reply({content: "Phone numbers do not match.", ephemeral: true});
			if (!interaction.options.get("file").value) return interaction.reply({content: "No file provided, how'd you even do that???", ephemeral: true});
			if (interaction.options.get("file").attachment.contentType != "application/pdf") return interaction.reply({content: "File is not a PDF.", ephemeral: true});
			interaction.reply({content: "Getting Ready...", ephemeral: true}).then(async () => {

				// Start doing SSH stuff
				await ssh.execCommand("mkdir -p /tmp/fax/send")
				await ssh.execCommand(`wget -O /tmp/fax/send/${interaction.options.get("to").value}.pdf ${interaction.options.get("file").attachment.url}`)
				await ssh.execCommand(`cd /tmp/fax/send && gs -q -dNOPAUSE -dBATCH -sDEVICE=tiffg4 -sPAPERSIZE=letter -sOutputFile=${interaction.options.get("to").value}.tiff ${interaction.options.get("to").value}.pdf`)
				await ssh.execCommand(`chown asterisk:asterisk /tmp/fax/send/${interaction.options.get("to").value}.tiff`)
				await ssh.execCommand(`rm /tmp/fax/send/${interaction.options.get("to").value}.pdf`)
				interaction.editReply({content: "Sending...", ephemeral: true});
				await ssh.execCommand(`/var/lib/asterisk/bin/callback ${interaction.options.get("to").value} sendfax.s.1 0 0 ${config.fax.callerId}`);
			});
			break;
	}
});

// Init SSH and connect to Discord
console.log(`${colors.cyan("[INFO]")} Starting...`)
// Start timer to see how long startup takes
const initTime = Date.now()
ssh.connect(config.ssh).then(() => {
	console.log(`${colors.cyan("[INFO]")} Connected to SSH server.`)
	client.login(config.discord.token)
})

// Take over Ctrl+C
process.on('SIGINT', function() {
	console.log(`${colors.cyan("[INFO]")} Shutting down...`)
	ssh.dispose()
	process.exit()
});