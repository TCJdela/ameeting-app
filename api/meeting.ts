import OpenAI from 'openai';
import { supabase } from './lib/supabase.js';
import express from 'express';

const router = express.Router();

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 生成会议纪要
router.post('/generate', async (req, res) => {
  try {
    const { transcribeId, template = 'standard' } = req.body;

    if (!transcribeId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少转写记录ID' 
      });
    }

    // 获取转写记录
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', transcribeId)
      .single();

    if (transcriptError || !transcript) {
      return res.status(404).json({ 
        success: false, 
        error: '转写记录不存在' 
      });
    }

    // 获取音频文件信息
    const { data: audioFile, error: audioError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', transcript.audio_file_id)
      .single();

    if (audioError || !audioFile) {
      return res.status(404).json({ 
        success: false, 
        error: '音频文件不存在' 
      });
    }

    // 使用转写后的文本，如果没有则使用原始文本
    const textToProcess = transcript.edited_text || transcript.original_text;

    if (!textToProcess) {
      return res.status(400).json({ 
        success: false, 
        error: '没有可处理的转写文本' 
      });
    }

    console.log('开始生成会议纪要，文本长度:', textToProcess.length);

    // 调用GPT生成会议纪要
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的会议纪要生成助手。请根据提供的会议转写文本，生成一份结构化的会议纪要。

要求：
1. 提取会议的关键信息、讨论要点、决策事项
2. 识别行动项，包括负责人和截止时间（如果有）
3. 总结会议的主要结论和下一步计划
4. 保持客观、简洁、专业的表达
5. 使用中文输出

请按以下格式输出：

# 会议纪要

## 会议基本信息
- 会议主题：
- 会议时间：
- 参会人员：

## 讨论要点
[列出主要讨论内容]

## 决策事项
[列出会议中做出的重要决策]

## 行动项
[列出需要执行的具体任务，包括负责人和截止时间]

## 下一步计划
[列出后续的工作安排]`
        },
        {
          role: 'user',
          content: `请根据以下会议转写生成会议纪要：\n\n${textToProcess}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const meetingContent = completion.choices[0].message.content;

    if (!meetingContent) {
      throw new Error('GPT生成内容为空');
    }

    console.log('会议纪要生成完成');

    // 进一步分析提取关键信息
    const keyPoints = await extractKeyPoints(textToProcess);
    const actionItems = await extractActionItems(textToProcess);
    const decisions = await extractDecisions(textToProcess);

    // 创建会议纪要记录
    const { data: meetingNote, error: noteError } = await supabase
      .from('meeting_notes')
      .insert({
        transcript_id: transcribeId,
        user_id: transcript.user_id,
        content: meetingContent,
        key_points: keyPoints,
        action_items: actionItems,
        decisions: decisions,
        template_type: template
      })
      .select()
      .single();

    if (noteError) {
      throw noteError;
    }

    res.json({ 
      success: true, 
      meetingNoteId: meetingNote.id,
      data: meetingNote 
    });

  } catch (error) {
    console.error('生成会议纪要失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '生成会议纪要失败' 
    });
  }
});

// 提取关键要点
async function extractKeyPoints(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '请从以下会议转写中提取3-5个最重要的关键要点，每个要点用一句话概括，用中文回答。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('提取关键要点失败:', error);
    return '';
  }
}

// 提取行动项
async function extractActionItems(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '请从以下会议转写中提取所有行动项，包括任务内容、负责人和截止时间（如果有），用中文回答，按列表格式输出。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('提取行动项失败:', error);
    return '';
  }
}

// 提取决策事项
async function extractDecisions(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '请从以下会议转写中提取所有重要的决策事项，用中文回答，按列表格式输出。'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('提取决策事项失败:', error);
    return '';
  }
}

export default router;