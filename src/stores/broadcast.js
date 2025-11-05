import { defineStore } from 'pinia'
import api from '@/api/axios'

/*
  Broadcast API

  Example GET /broadcast response:
  [
    {
      "id": 42,
      "message": "Hello everyone",
      "total_recipients": 120,
      "sent_at": "2025-10-09T12:34:56.000Z",
      "sent_by_user": { "id": 3, "username": "admin" },
      "filter_country": { "id": 1, "title": "USA" },
      "filter_event": { "id": 7, "title": "Conference 2025" }
    },
    ...
  ]

*/

export const useBroadcastStore = defineStore('broadcast', {
  state: () => ({
    items: [],
    loading: false,
    sending: false,
    error: null,
  }),

  actions: {
    async fetchAll () {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/broadcast')
        this.items = Array.isArray(data) ? data : []
        return data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne (id) {
      this.error = null
      try {
        const { data } = await api.get(`/broadcast/${id}`)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async send (payload) {
      this.sending = true
      this.error = null
      try {
        let res
        // if caller passed FormData (file upload), send multipart/form-data
        if (typeof FormData !== 'undefined' && payload instanceof FormData) {
          res = await api.post('/broadcast/send', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          // otherwise send JSON.
          // If payload contains media.buffer as binary (ArrayBuffer/TypedArray/Buffer),
          // convert it to base64 string so backend receives { buffer, mime, filename }.
          if (payload && payload.media && payload.media.buffer) {
            const buf = payload.media.buffer
            // if it's already a string, assume base64 and leave as-is
            if (typeof buf !== 'string') {
              // Node Buffer
              if (typeof Buffer !== 'undefined' && Buffer.isBuffer(buf)) {
                payload.media.buffer = buf.toString('base64')
              } else {
                // ArrayBuffer or TypedArray
                let uint8
                if (ArrayBuffer.isView(buf)) {
                  uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
                } else if (buf instanceof ArrayBuffer) {
                  uint8 = new Uint8Array(buf)
                }

                if (uint8) {
                  // convert to binary string in chunks to avoid stack issues
                  const CHUNK_SIZE = 1 << 15
                  let binary = ''
                  for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
                    const slice = uint8.subarray(i, i + CHUNK_SIZE)
                    binary += String.fromCharCode.apply(null, slice)
                  }
                  // btoa is available in browsers; encode to base64
                  payload.media.buffer = btoa(binary)
                }
              }
            }
          }

          // Support media: { url } or media: { buffer: base64, mime, filename }
          res = await api.post('/broadcast/send', payload)
        }

        const data = res.data
        // push new broadcast to items if it looks like an object with id
        if (data && data.id) {
          this.items.unshift(data)
        }
        return data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.sending = false
      }
    },
  },
})
