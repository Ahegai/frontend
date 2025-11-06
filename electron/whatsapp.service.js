import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import qrcode from 'qrcode'
import pkg from 'whatsapp-web.js'
const { LocalAuth, MessageMedia, Client: WhatsAppClient } = pkg

/**
 * Сервис для управления WhatsApp клиентом для Electron.
 * Управляется из главного процесса (main.js).
 * Генерирует события (qr, ready, disconnected) через EventEmitter.
 */
export class WhatsAppService extends EventEmitter {
  client = null
  isInitializing = false
  isReady = false
  instanceId = ''
  logger = console

  constructor () {
    super()
    this.instanceId = Math.random().toString(36).slice(7)
    this.logger.log(`[ID: ${this.instanceId}] WhatsAppService создан (режим Electron).`)
  }

  async initAuth () {
    this.logger.log(`[ID: ${this.instanceId}] Начало инициализации`)
    if (this.isReady || this.isInitializing) {
      this.logger.log(`[ID: ${this.instanceId}] Инициализация уже запущена.`)
      return
    }

    try {
      this.isInitializing = true
      this.logger.log(`[ID: ${this.instanceId}] 🚀 Начинается инициализация...`)

      this.client = new WhatsAppClient({
        authStrategy: new LocalAuth({ dataPath: 'sessions' }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      })

      this.setupEventHandlers()
      await this.client.initialize()
    } catch (error) {
      this.logger.error(`[ID: ${this.instanceId}] Критическая ошибка инициализации`, error)
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
        this.logger.log(`[ID: ${this.instanceId}] 📲 Сгенерирован QR-код.`)
        this.emit('qr', qrImage)
      } catch (error) {
        this.logger.error(`[ID: ${this.instanceId}] Ошибка QR-кода`, error)
      }
    })

    this.client.on('ready', () => {
      this.logger.log(`[ID: ${this.instanceId}] 🔌 Клиент WhatsApp готов!`)
      this.isReady = true
      this.isInitializing = false
      this.emit('ready')
    })

    this.client.on('authenticated', () => {
      this.logger.log(`[ID: ${this.instanceId}] ✅ WhatsApp аутентифицирован`)
      this.emit('authenticated')
    })

    this.client.on('auth_failure', msg => {
      this.logger.error(`[ID: ${this.instanceId}] ❌ Ошибка аутентификации: ` + msg)
      this.isInitializing = false
      this.isReady = false
      this.emit('auth_failure', msg)
    })

    this.client.on('disconnected', reason => {
      this.logger.warn(`[ID: ${this.instanceId}] 🔌 WhatsApp отключен: ` + reason)
      this.isReady = false
      this.client = null
      this.emit('disconnected', reason)
    })
  }

  async sendMessage (phone, message, media) {
    this.ensureReady()
    const chatId = phone.includes('@') ? phone : `${phone}@c.us`
    this.logger.log(`[ID: ${this.instanceId}] Отправка на ${chatId}`)

    try {
      if (media && (media.url || media.path || media.buffer)) {
        let msgMedia
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
        } else {
          throw new Error('Unsupported media object')
        }

        const options = {}
        if (message) {
          options.caption = message
        }
        return this.client.sendMessage(chatId, msgMedia, options)
      }

      return this.client.sendMessage(chatId, message ?? '')
    } catch (error) {
      this.logger.error(`[ID: ${this.instanceId}] Ошибка отправки на ${chatId}`, error)
      throw error
    }
  }

  getStatus () {
    return {
      instanceId: this.instanceId,
      isReady: this.isReady,
      isInitializing: this.isInitializing,
    }
  }

  getInfo () {
    this.ensureReady()
    return this.client?.info ?? null
  }

  ensureReady () {
    if (!this.isReady || !this.client) {
      this.logger.warn(`[ID: ${this.instanceId}] Попытка действия до готовности клиента.`)
      throw new Error('Клиент WhatsApp не готов.')
    }
  }

  async destroy () {
    this.logger.log(`[ID: ${this.instanceId}] Завершение работы...`)
    if (this.client) {
      await this.client.destroy().catch(error =>
        this.logger.error('Ошибка при уничтожении клиента', error),
      )
      this.client = null
    }
  }
}
