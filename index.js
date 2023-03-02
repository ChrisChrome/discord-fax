// Init Config
const config = require("./config.json")

// Init Constants
const Discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")



// Init Discord
const client = new Discord.Client({intents: ["Guilds"]})

client.on("ready", () => {
	console.log(`${chalk.blue("[INFO]")} Logged in as ${chalk.green(client.user.tag)}`)
});

client.login(config.discord.token)