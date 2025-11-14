import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '../components/AudioRecorder';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const RecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    try {
      setIsProcessing(true);
      
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.webm`;
      
      // 上传音频文件到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 获取音频文件URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      // 创建音频文件记录
      const { data: audioFile, error: dbError } = await supabase
        .from('audio_files')
        .insert({
          filename: fileName,
          original_name: fileName,
          file_size: blob.size,
          file_path: publicUrl,
          duration: Math.floor(duration),
          title: `会议录音 ${new Date().toLocaleString()}`
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      toast.success('音频文件上传成功，开始转写...');
      
      // 开始转写任务
      await startTranscription(audioFile.id);
      
      // 跳转到转写页面
      navigate(`/transcribe/${audioFile.id}`);
      
    } catch (error) {
      console.error('处理录音失败:', error);
      toast.error('音频处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // 验证文件类型
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('不支持的音频格式，请上传 MP3、WAV 或 M4A 文件');
        return;
      }

      // 验证文件大小 (最大 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('文件过大，请上传小于 100MB 的音频文件');
        return;
      }

      // 上传文件到Supabase Storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `upload-${timestamp}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 获取音频文件URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      // 创建音频文件记录
      const { data: audioFile, error: dbError } = await supabase
        .from('audio_files')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          file_path: publicUrl,
          duration: 0, // 上传文件无法自动获取时长
          title: file.name.replace(/\.[^/.]+$/, '') // 移除扩展名
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      toast.success('音频文件上传成功，开始转写...');
      
      // 开始转写任务
      await startTranscription(audioFile.id);
      
      // 跳转到转写页面
      navigate(`/transcribe/${audioFile.id}`);
      
    } catch (error) {
      console.error('文件上传失败:', error);
      toast.error('文件上传失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const startTranscription = async (audioFileId: string) => {
    try {
      // 调用后端API开始转写
      const response = await fetch('/api/transcribe/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioId: audioFileId,
          language: 'zh'
        })
      });

      if (!response.ok) {
        throw new Error('转写任务启动失败');
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('转写任务启动失败:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">会议录音</h1>
            <p className="text-lg text-gray-600">
              录制会议音频或上传现有音频文件，我们将自动转换为文字
            </p>
          </div>

          {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-700">正在处理音频文件...</p>
              </div>
            </div>
          )}

          <AudioRecorder 
            onRecordingComplete={handleRecordingComplete}
            onFileUpload={handleFileUpload}
          />

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">使用提示</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                确保在安静的环境中录音，以获得最佳的转写效果
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                支持的音频格式：MP3、WAV、M4A，文件大小不超过100MB
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                录音完成后，系统会自动进行语音转文字处理
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};