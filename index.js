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
			await rest.put(
				Routes.applicationCommands(config.discord.clientID), {
					body: commands,
				}
			);
			console.log(`${colors.cyan("[INFO]")} Successfully registered commands.`);
		} catch (error) {
			console.error(error);
		}
	})();

});

// Init
console.log(`${colors.cyan("[INFO]")} Starting...`)
// Start timer to see how long startup takes
const initTime = Date.now()
// Login
client.login(config.discord.token)