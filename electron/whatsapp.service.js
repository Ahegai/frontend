import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as chromeFinder from '@perfsee/chrome-finder'
import { app } from 'electron'
import log from 'electron-log'
import puppeteer from 'puppeteer'
import qrcode from 'qrcode'
import pkg from 'whatsapp-web.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { Client: WhatsAppClient, MessageMedia, LocalAuth } = pkg

export class WhatsAppService extends EventEmitter {
  client = null
  isInitializing = false
  isReady = false
  instanceId = ''
  logger = console

  constructor () {
    super()
    this.instanceId = Math.random().toString(36).slice(7)
    log.info(`[ID: ${this.instanceId}] WhatsAppService создан.`)
  }

  async initAuth (sessionsPath = null) {
    if (this.isReady || this.isInitializing) {
      return
    }
    this.isInitializing = true

    try {
      // --- dataPath для LocalAuth ---
      let dataPath = sessionsPath
      if (!dataPath) {
        dataPath = path.resolve(
          app.isPackaged
            ? path.join(process.resourcesPath, 'sessions')
            : path.join(__dirname, 'sessions'),
        )
      }
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true })
      }
      log.info('Сессии хранятся в:', dataPath)
      log.info('Прод сессияя хранятся в:', process.resourcesPath)

      let executablePath

      try {
        const chromeInfo = await chromeFinder.findChrome()
        executablePath = chromeInfo?.executablePath || puppeteer.executablePath()
        log.info(`[ID: ${this.instanceId}] Найден Chrome через chrome-finder:`, executablePath)
      } catch {
        executablePath = puppeteer.executablePath()
        log.info(`[ID: ${this.instanceId}] Используем Chromium Puppeteer:`, executablePath)
      }
      log.info(`[ID: ${this.instanceId}] Используем Chromium:`, executablePath)
      log.info('Chromium хранятся в:', executablePath)

      // --- инициализация WhatsAppClient ---
      this.client = new WhatsAppClient({
        authStrategy: new LocalAuth({ dataPath }),
        puppeteer: {
          executablePath,
          headless: false,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          timeout: 60_000,
        },
      })

      this.setupEventHandlers()
      await this.client.initialize()
      log.info('Сессии хранятся в:', dataPath)
      log.info('Client: ', this.client?.info)
    } catch (error) {
      log.error(`[ID: ${this.instanceId}] Ошибка инициализации`, error)
      this.isInitializing = false
      this.isReady = false
      this.emit('error', error.message)
      throw error
    }
  }

  setupEventHandlers () {
    if (!this.client) {
      return
    }

    this.client.on('qr', async qr => {
      try {
        const qrImage = await qrcode.toDataURL(qr)
        this.emit('qr', qrImage)
      } catch (error) {
        log.error('Ошибка QR-кода', error)
      }
    })

    this.client.on('ready', () => {
      this.isReady = true
      this.isInitializing = false
      this.emit('ready')
    })

    this.client.on('authenticated', () => this.emit('authenticated'))
    this.client.on('auth_failure', msg => {
      this.isReady = false
      this.isInitializing = false
      this.emit('auth_failure', msg)
    })
    this.client.on('disconnected', reason => {
      this.isReady = false
      this.client = null
      this.emit('disconnected', reason)
    })
  }

  async sendMessage (phone, message, media) {
    this.ensureReady()
    const chatId = phone.includes('@') ? phone : `${phone}@c.us`

    try {
      let msgMedia = null
      if (media) {
        if (media.url) {
          msgMedia = await MessageMedia.fromUrl(media.url)
        } else if (media.path) {
          if (!fs.existsSync(media.path)) {
            throw new Error('Media file not found: ' + media.path)
          }
          const b64 = fs.readFileSync(media.path, { encoding: 'base64' })
          msgMedia = new MessageMedia(media.mime, b64, media.filename || path.basename(media.path))
        } else if (media.buffer) {
          const b64 = media.buffer.toString('base64')
          msgMedia = new MessageMedia(media.mime, b64, media.filename || 'file')
        }
      }

      if (msgMedia) {
        return this.client.sendMessage(chatId, msgMedia, { caption: message })
      }
      return this.client.sendMessage(chatId, message ?? '')
    } catch (error) {
      log.error('Ошибка отправки', error)
      throw error
    }
  }

  getStatus () {
    return { instanceId: this.instanceId, isReady: this.isReady, isInitializing: this.isInitializing }
  }

  getInfo () {
    this.ensureReady()
    log.info(this.client)
    return this.client?.info ?? null
  }

  ensureReady () {
    if (!this.isReady || !this.client) {
      throw new Error('Клиент WhatsApp не готов.')
    }
  }

  async destroy () {
    if (this.client) {
      await this.client.destroy().catch(error => log.error('Ошибка destroy', error))
      this.client = null
    }
  }
}
