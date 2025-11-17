import express from 'express'
import crypto from 'crypto'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

function setNoStore(res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
}

async function initHandler(req: express.Request, res: express.Response) {
  try {
    setNoStore(res)
    const token = req.header('x-admin-token') || ''
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ success: false, error: 'unauthorized' })
    }

    const bucket = await supabase.storage.getBucket('audio-files')
    if (!bucket.data) {
      const created = await supabase.storage.createBucket('audio-files', { public: false })
      if (created.error) {
        return res.status(500).json({ success: false, error: 'create bucket failed' })
      }
    }

    let defaultUserId = process.env.DEFAULT_USER_ID || ''
    if (defaultUserId) {
      const exists = await supabase.from('users').select('id').eq('id', defaultUserId).single()
      if (exists.error) defaultUserId = ''
    }

    if (!defaultUserId) {
      const id = crypto.randomUUID()
      const email = `default+${Date.now()}@ameeting.local`
      const name = 'Default User'
      const password_hash = crypto.randomBytes(32).toString('hex')
      const ins = await supabase.from('users').insert({ id, email, name, password_hash }).select('id').single()
      if (ins.error) {
        return res.status(500).json({ success: false, error: 'create user failed' })
      }
      defaultUserId = ins.data.id
    }

    return res.json({ success: true, bucket: 'audio-files', defaultUserId })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'server error' })
  }
}

router.post('/init', initHandler)
router.get('/init', initHandler)

export default router