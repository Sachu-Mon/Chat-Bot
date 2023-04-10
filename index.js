const {
	default: AvaConnect,
	useMultiFileAuthState,
	DisconnectReason,
	Browsers,
	makeInMemoryStore,
	getContentType,
	jidDecode,
	proto
} = require("@adiwajshing/baileys")
const {
	log
} = require('console')
const pino = require('pino')
const {
	Boom
} = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')


const store = makeInMemoryStore({
	logger: pino().child({
		level: 'silent',
		stream: 'store'
	})
})

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

process.on('uncaughtException', console.error)

async function StartAva() {
	const {
		state,
		saveCreds
	} = await useMultiFileAuthState(
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
			let m = smsg(Ava, mek, store)
			require("./Bot")(Ava, m, chatUpdate, store)
		} catch (e) {
			console.log(e)
		}
	})

	Ava.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}

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

	/**
	 * 
	 * @param {*} jid 
	 * @param {*} message 
	 * @param {*} forceForward 
	 * @param {*} options 
	 * @returns 
	 */
	Ava.copyNForward = async (jid, message, forceForward = false, options = {}) => {
		let vtype
		if (options.readViewOnce) {
			message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
			vtype = Object.keys(message.message.viewOnceMessage.message)[0]
			delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
			delete message.message.viewOnceMessage.message[vtype].viewOnce
			message.message = {
				...message.message.viewOnceMessage.message
			}
		}

		let mtype = Object.keys(message.message)[0]
		let content = await generateForwardMessageContent(message, forceForward)
		let ctype = Object.keys(content)[0]
		let context = {}
		if (mtype != "conversation") context = message.message[mtype].contextInfo
		content[ctype].contextInfo = {
			...context,
			...content[ctype].contextInfo
		}
		const waMessage = await generateWAMessageFromContent(jid, content, options ? {
			...content[ctype],
			...options,
			...(options.contextInfo ? {
				contextInfo: {
					...content[ctype].contextInfo,
					...options.contextInfo
				}
			} : {})
		} : {})
		await Ava.relayMessage(jid, waMessage.message, {
			messageId: waMessage.key.id
		})
		return waMessage
	}


	/**
	 * Serialize Message
	 * @param {WAConnection} conn 
	 * @param {Object} m 
	 * @param {store} store 
	 */
	function smsg(conn, m, store) {
		if (!m) return m
		let M = proto.WebMessageInfo
		if (m.key) {
			m.id = m.key.id
			m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
			m.chat = m.key.remoteJid
			m.fromMe = m.key.fromMe
			m.isGroup = m.chat.endsWith('@g.us')
			m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
			if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || ''
		}
		if (m.message) {
			m.mtype = getContentType(m.message)
			m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
			m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
			let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
			m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
			if (m.quoted) {
				let type = getContentType(quoted)
				m.quoted = m.quoted[type]
				if (['productMessage'].includes(type)) {
					type = getContentType(m.quoted)
					m.quoted = m.quoted[type]
				}
				if (typeof m.quoted === 'string') m.quoted = {
					text: m.quoted
				}
				m.quoted.mtype = type
				m.quoted.id = m.msg.contextInfo.stanzaId
				m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
				m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
				m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant)
				m.quoted.fromMe = m.quoted.sender === (conn.user && conn.user.id)
				m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
				m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
				m.getQuotedObj = m.getQuotedMessage = async () => {
					if (!m.quoted.id) return false
					let q = await store.loadMessage(m.chat, m.quoted.id, conn)
					return exports.smsg(conn, q, store)
				}

			}
		}


		return m
	}

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