import OpenAI from 'openai';
import { supabase } from './lib/supabase.js';
import multer from 'multer';
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB限制
  }
});

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 开始转写任务
router.post('/start', async (req, res) => {
  try {
    const { audioId, language = 'zh' } = req.body;

    if (!audioId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少音频文件ID' 
      });
    }

    // 获取音频文件信息
    const { data: audioFile, error: audioError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', audioId)
      .single();

    if (audioError || !audioFile) {
      return res.status(404).json({ 
        success: false, 
        error: '音频文件不存在' 
      });
    }

    // 检查是否已有转写记录
    const { data: existingTranscript } = await supabase
      .from('transcripts')
      .select('*')
      .eq('audio_file_id', audioId)
      .single();

    if (existingTranscript) {
      return res.json({ 
        success: true, 
        transcriptId: existingTranscript.id,
        message: '转写任务已存在'
      });
    }

    // 创建转写记录
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        audio_file_id: audioId,
        user_id: audioFile.user_id,
        language,
        status: 'processing',
        progress: 0
      })
      .select()
      .single();

    if (transcriptError) {
      throw transcriptError;
    }

    // 异步执行转写任务
    processTranscription(audioFile, transcript.id);

    res.json({ 
      success: true, 
      transcriptId: transcript.id,
      message: '转写任务已启动'
    });

  } catch (error) {
    console.error('启动转写任务失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '转写任务启动失败' 
    });
  }
});

// 处理转写任务
export async function processTranscription(audioFile: any, transcriptId: string) {
  try {
    console.log('开始处理转写任务:', transcriptId);

    // 更新进度
    await supabase
      .from('transcripts')
      .update({ progress: 0.1 })
      .eq('id', transcriptId);

    // 下载音频文件
    const { data: fileData } = await supabase.storage
      .from('audio-files')
      .download(audioFile.filename);

    if (!fileData) {
      throw new Error('无法下载音频文件');
    }

    // 更新进度
    await supabase
      .from('transcripts')
      .update({ progress: 0.3 })
      .eq('id', transcriptId);

    // 转换音频文件为Buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    
    // 创建临时文件
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `${transcriptId}.webm`);
    fs.writeFileSync(tempFilePath, buffer);

    // 更新进度
    await supabase
      .from('transcripts')
      .update({ progress: 0.5 })
      .eq('id', transcriptId);

    // 调用OpenAI Whisper API进行转写
    console.log('调用Whisper API进行转写...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'zh',
      response_format: 'verbose_json'
    });

    console.log('转写结果:', transcription);

    // 更新进度
    await supabase
      .from('transcripts')
      .update({ progress: 0.8 })
      .eq('id', transcriptId);

    // 保存转写结果
    const { error: updateError } = await supabase
      .from('transcripts')
      .update({
        original_text: transcription.text,
        edited_text: transcription.text,
        status: 'completed',
        progress: 1.0
      })
      .eq('id', transcriptId);

    if (updateError) {
      throw updateError;
    }

    // 清理临时文件
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    console.log('转写任务完成:', transcriptId);

  } catch (error) {
    console.error('转写处理失败:', error);
    
    // 更新状态为失败
    await supabase
      .from('transcripts')
      .update({
        status: 'failed',
        progress: 0
      })
      .eq('id', transcriptId);
  }
}

// 获取转写结果
router.get('/result/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!transcript) {
      return res.status(404).json({ 
        success: false, 
        error: '转写记录不存在' 
      });
    }

    res.json({ 
      success: true, 
      data: transcript 
    });

  } catch (error) {
    console.error('获取转写结果失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取转写结果失败' 
    });
  }
});

// 更新转写文本
router.put('/update', async (req, res) => {
  try {
    const { transcribeId, text } = req.body;

    if (!transcribeId || !text) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要参数' 
      });
    }

    const { error } = await supabase
      .from('transcripts')
      .update({
        edited_text: text,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcribeId);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      message: '转写文本已更新' 
    });

  } catch (error) {
    console.error('更新转写文本失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新转写文本失败' 
    });
  }
});

export default router;