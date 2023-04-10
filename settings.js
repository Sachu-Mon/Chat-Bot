const fs = require('fs')
const chalk = require('chalk')

global.chatgpt = true
global.avabot = false 
global.chatsonic = false

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})
