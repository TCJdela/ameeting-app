import express from 'express'
import multer from 'multer'
import path from 'path'
import { supabase } from './lib/supabase.js'
import { processTranscription } from './transcribe.js'

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '缺少音频文件' })
    }

    const defaultUserId = process.env.DEFAULT_USER_ID || ''
    if (!defaultUserId) {
      return res.status(500).json({ success: false, error: '服务未配置默认用户ID(DEFAULT_USER_ID)' })
    }

    const ext = path.extname(req.file.originalname) || '.webm'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const storagePath = `uploads/${defaultUserId}/${filename}`

    const { error: uploadErr } = await supabase.storage.from('audio-files').upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    })
    if (uploadErr) {
      return res.status(500).json({ success: false, error: '上传存储失败' })
    }

    const { data: audioRow, error: insertErr } = await supabase
      .from('audio_files')
      .insert({
        user_id: defaultUserId,
        filename: filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
        file_path: storagePath,
        duration: 0,
        title: req.file.originalname
      })
      .select()
      .single()

    if (insertErr || !audioRow) {
      return res.status(500).json({ success: false, error: '保存音频记录失败' })
    }

    const { data: transcript, error: tErr } = await supabase
      .from('transcripts')
      .insert({
        audio_file_id: audioRow.id,
        user_id: defaultUserId,
        language: 'zh',
        status: 'processing',
        progress: 0
      })
      .select()
      .single()

    if (tErr || !transcript) {
      return res.status(500).json({ success: false, error: '创建转写任务失败' })
    }

    processTranscription({ filename: audioRow.file_path, user_id: defaultUserId }, transcript.id)

    return res.json({ success: true, transcriptId: transcript.id })
  } catch (e) {
    return res.status(500).json({ success: false, error: '服务器错误' })
  }
})

export default router