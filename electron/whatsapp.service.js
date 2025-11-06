import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chromeFinder from '@perfsee/chrome-finder'
import { app } from 'electron'
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
    this.logger.log(`[ID: ${this.instanceId}] WhatsAppService создан.`)
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
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'sessions')
            : path.join(__dirname, 'sessions'),
        )
      }
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true })
      }

      // --- executablePath для Puppeteer ---
      let executablePath = await chromeFinder()
      if (!executablePath) {
        // fallback на Chromium от Puppeteer
        executablePath = puppeteer.executablePath()
      }
      this.logger.log(`[ID: ${this.instanceId}] Используем Chromium:`, executablePath)

      // --- инициализация WhatsAppClient ---
      this.client = new WhatsAppClient({
        authStrategy: new LocalAuth({ dataPath }),
        puppeteer: {
          executablePath,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          timeout: 60_000,
        },
      })

      this.setupEventHandlers()
      await this.client.initialize()
    } catch (error) {
      this.logger.error(`[ID: ${this.instanceId}] Ошибка инициализации`, error)
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
        this.logger.error('Ошибка QR-кода', error)
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
      this.logger.error('Ошибка отправки', error)
      throw error
    }
  }

  getStatus () {
    return { instanceId: this.instanceId, isReady: this.isReady, isInitializing: this.isInitializing }
  }

  getInfo () {
    this.ensureReady()
    return this.client?.info ?? null
  }

  ensureReady () {
    if (!this.isReady || !this.client) {
      throw new Error('Клиент WhatsApp не готов.')
    }
  }

  async destroy () {
    if (this.client) {
      await this.client.destroy().catch(error => this.logger.error('Ошибка destroy', error))
      this.client = null
    }
  }
}
