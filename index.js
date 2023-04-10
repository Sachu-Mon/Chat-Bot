const { default: AvaConnect, useMultiFileAuthState, DisconnectReason, Browsers,makeInMemoryStore } = require("@adiwajshing/baileys")

const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')


const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

process.on('uncaughtException', console.error)

async function StartAva() {
    const {
        state,saveCreds} = await useMultiFileAuthState(
        __dirname + "/auth" // path folder for save credentials
    )
    const Ava = AvaConnect({
        logger: pino({
			level: 'silent'
		}),
		generateHighQualityLinkPreview: true,
		browser: Browsers.macOS('Desktop'),
		auth: state,
		printQRInTerminal: true,
    })

    store.bind(Ava.ev)
    
    Ava.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        mek = chatUpdate.messages[0]
        require("./Bot")(Ava, mek, chatUpdate, store)
        } catch (e) {
            console.log(e)
        }
    })

    Ava.ev.on('connection.update', async (update) => {
		const {
			connection,
			lastDisconnect
		} = update
		if (connection === 'close') {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.badSession) {
				console.log(`Bad Session File, Please Delete Session and Scan Again`);
				Ava.logout();
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log("Connection closed, reconnecting....");
				StartAva();
			} else if (reason === DisconnectReason.connectionLost) {
				console.log("Connection Lost from Server, reconnecting...");
				StartAva();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
				Ava.logout();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(`Device Logged Out, Please Scan Again And Run.`);
				Ava.logout();
			} else if (reason === DisconnectReason.restartRequired) {
				console.log("Restart Required, Restarting...");
				StartAva();
			} else if (reason === DisconnectReason.timedOut) {
				console.log("Connection TimedOut, Reconnecting...");
				StartAva();
			} else Ava.end(`Unknown DisconnectReason: ${reason}|${connection}`)
		} else if (connection === 'connecting') {
			console.log("Connecting....")
		} else if (connection === 'open') {
			console.log("✅ Bot Active ")
		}
	})

    Ava.ev.on('creds.update', saveCreds)

    return Ava
}

StartAva()


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})