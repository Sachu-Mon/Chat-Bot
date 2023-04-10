
require('./settings')
require('@adiwajshing/baileys')
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const { log } = require('console')
const axios = require('axios')
require('@adiwajshing/baileys')
const { config } = require('dotenv')
config()

const { Configuration, OpenAIApi } = require('openai')

const openAi = new OpenAIApi(
    new Configuration({
      apiKey: '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',
    })
  )

let body = ''

module.exports = Ava = async (Ava, m, chatUpdate, store) => {
    try {
    const messageType = Object.keys (m.message)[0]
    if (messageType=== 'conversation' || messageType === 'extendedTextMessage'){
        if(!m.key.fromMe){
            smg(m)
            let message = body
            let unique_id = m.key.remoteJid
            const response = await openAi.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content:  message}],
              })
              let rep = response.data.choices[0].message.content
              Ava.sendMessage(unique_id, { text: `${rep}` })
        }
    }
    } catch (err) {
        log(util.format(err))
    }
}

async function smg(m){
    try{
        if(m.message.conversation){
            body = m.message.conversation
        } else if (m.message.extendedTextMessage){
            body = m.message.extendedTextMessage.text
        }
    } catch(e){
        log(e)
    }
}

async function fetchJson (url, options){
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