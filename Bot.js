require('./index.js')
require('./settings.js')
require('@adiwajshing/baileys')
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const {
	log
} = require('console')
const axios = require('axios')
require('@adiwajshing/baileys')
const {
	config
} = require('dotenv')
config()

const {
	Configuration,
	OpenAIApi
} = require('openai')

const openAi = new OpenAIApi(
	new Configuration({
		apiKey: process.env.OPEN_AI,
	})
)

const sdk = require('api')('@writesonic/v2.2#4enbxztlcbti48j');

module.exports = Ava = async (Ava, m, chatUpdate, store) => {
	try {
        var body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        var budy = (typeof m.text == 'string' ? m.text : '')
        const command = body.trim().split(/ +/).shift().toLowerCase()
        const messageType = Object.keys(m.message)[0]
        const args = body.trim().split(/ +/).slice(1)
        const pushname = m.pushName || "No Name"
        const botNumber = await Ava.decodeJid(Ava.user.id)
        const isCreator = [botNumber].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const itsMe = m.sender == botNumber ? true : false
        const text = q = args.join(" ")
        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''
        const isMedia = /image|video|sticker|audio/.test(mime)
        const sender = m.isGroup ? (mek.key.participant ? mek.key.participant : mek.participant) : mek.key.remoteJid
        const messagesD = body.slice(0).trim().split(/ +/).shift().toLowerCase()
        const type = Object.keys(mek.message)[0]
        const from = mek.key.remoteJid
        const content = JSON.stringify(mek.message)
        const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
        const isQuotedVideo = type === 'extendedTextMessage' && content.includes('videoMessage')
        const isQuotedAudio = type === 'extendedTextMessage' && content.includes('audioMessage')
        const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage')

        
        if(chatsonic){
            if (!m.fromMe) {
                const options = {
                    method: 'POST',
                    headers: {
                      accept: 'application/json',
                      'content-type': 'application/json',
                      'X-API-KEY': '99a1c8fb-aa29-471a-ac50-d13ea3c9171d'
                    },
                    body: JSON.stringify({enable_google_results: 'false', enable_memory: true, input_text: `${body}`})
                  };
                  
                  fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium', options)
                    .then(response => response.json())
                    .then(response => Ava.sendMessage(from, {
                        text: `${response.message}`
                    }))
                    .catch(err => console.error(err));
        }
        }

		if (chatgpt){
			if (!m.fromMe) {
				let message = body
				const response = await openAi.createChatCompletion({
					model: "gpt-3.5-turbo",
					messages: [{
						role: "user",
						content: message
					}],
				})
				let rep = response.data.choices[0].message.content
				Ava.sendMessage(from, {
					text: `${rep}`
				})
		}
    }
        if(avabot){
            if (!m.fromMe) {
            let message = body
            let unique_id = [m.sender]
            let rep = await fetchJson(`http://api.brainshop.ai/get?bid=168447&key=chtQrsbtURneYwU0&uid=${encodeURIComponent(unique_id)}&msg=${encodeURIComponent(message)}`)
            Ava.sendMessage(from, {
                text: `${rep.cnt}`
            })
            }
        }


    const reply = (teks) => {
        Ava.sendMessage(from, {
            text: teks,
        }, {
            quoted: m
        })
    }

    switch(command){
        case 'chatgpt':
            if (args[0] === "on") {
                if (chatgpt) return log(`It's Been Active Before`)
                chatgpt = true
                avabot = false
                chatsonic = false
                log(`ChatGPT is activated`)
            } else if (args[0] === "off") {
                if (!chatgpt) return log(`Not Activated Before`)
                chatgpt = false
                log(`ChatGPT is deactivated`)
            } else {log(`chatgpt on/off`)}
        break
        case 'avabot':
            if (args[0] === "on") {
                if (avabot) return log(`It's Been Active Before`)
                avabot = true
                chatgpt = false 
                chatsonic = false
                log(`Avabot is activated`)
            } else if (args[0] === "off") {
                if (!avabot) return log(`Not Activated Before`)
                avabot = false
                log(`Avabot is deactivated`)
            } else {log(`Avabot on/off`)}
        break
        case 'chatsonic':
            if (args[0] === "on") {
                if (chatsonic) return log(`It's Been Active Before`)
                chatsonic = true
                chatgpt = false
                avabot = false
                log(`ChatSonic is activated`)
            } else if (args[0] === "off") {
                if (!chatsonic) return log(`Not Activated Before`)
                chatsonic = false
                log(`ChatSonic is deactivated`)
            } else {log(`chatsonic on/off`)}
        break
        default:
        break
    }


	} catch (err) {
		log(util.format(err))
	}
}

async function fetchJson(url, options) {
	try {
		options ? options : {}
		const res = await axios({
			method: 'GET',
			url: url,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
			},
			...options
		})
		return res.data
	} catch (err) {
		return err
	}
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
