import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const TranscribePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<any>(null);
  const [audioFile, setAudioFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadAudioFile();
      checkTranscriptionStatus();
    }
  }, [id]);

  // 监听转写状态变化
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`transcription-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcripts',
          filter: `audio_file_id=eq.${id}`
        },
        (payload) => {
          console.log('转写状态变化:', payload);
          if (payload.new) {
            const newData = payload.new as any;
            setTranscript(newData);
            setProgress(newData.progress || 0);
            setEditedText(newData.edited_text || newData.original_text || '');
            
            if (newData.status === 'completed') {
              setIsLoading(false);
              toast.success('转写完成！');
            } else if (newData.status === 'failed') {
              setIsLoading(false);
              toast.error('转写失败，请重试');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadAudioFile = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setAudioFile(data);
    } catch (error) {
      console.error('加载音频文件失败:', error);
      toast.error('无法加载音频文件');
      navigate('/record');
    }
  };

  const checkTranscriptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('audio_file_id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // 记录不存在不算错误
        throw error;
      }

      if (data) {
        setTranscript(data);
        setProgress(data.progress || 0);
        setEditedText(data.edited_text || data.original_text || '');
        
        if (data.status === 'completed') {
          setIsLoading(false);
        } else if (data.status === 'failed') {
          setIsLoading(false);
          toast.error('转写失败，请重试');
        }
      } else {
        // 如果还没有转写记录，创建新的转写任务
        await startTranscription();
      }
    } catch (error) {
      console.error('检查转写状态失败:', error);
      toast.error('无法获取转写状态');
    }
  };

  const startTranscription = async () => {
    try {
      const response = await fetch('/api/transcribe/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioId: id,
          language: 'zh'
        })
      });

      if (!response.ok) {
        throw new Error('转写任务启动失败');
      }

      const result = await response.json();
      console.log('转写任务已启动:', result);
      
    } catch (error) {
      console.error('启动转写失败:', error);
      toast.error('转写任务启动失败');
      setIsLoading(false);
    }
  };

  const saveTranscription = async () => {
    try {
      if (!transcript) return;

      const { error } = await supabase
        .from('transcripts')
        .update({
          edited_text: editedText,
          updated_at: new Date().toISOString()
        })
        .eq('id', transcript.id);

      if (error) {
        throw error;
      }

      toast.success('转写文本已保存');
      setIsEditing(false);
      
    } catch (error) {
      console.error('保存转写失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const generateMeetingNotes = async () => {
    try {
      if (!transcript) {
        toast.error('请等待转写完成');
        return;
      }

      const response = await fetch('/api/meeting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcribeId: transcript.id,
          template: 'standard'
        })
      });

      if (!response.ok) {
        throw new Error('会议纪要生成失败');
      }

      const result = await response.json();
      navigate(`/editor/${result.meetingNoteId}`);
      
    } catch (error) {
      console.error('生成会议纪要失败:', error);
      toast.error('生成会议纪要失败，请重试');
    }
  };

  if (isLoading && !transcript) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在准备转写...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">语音转文字</h1>
              <div className="flex space-x-3">
                {transcript?.status === 'completed' && (
                  <button
                    onClick={generateMeetingNotes}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    生成会议纪要
                  </button>
                )}
                {isEditing ? (
                  <button
                    onClick={saveTranscription}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    保存
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    编辑
                  </button>
                )}
              </div>
            </div>

            {/* 音频文件信息 */}
            {audioFile && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">音频文件信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">文件名：</span>
                    {audioFile.original_name}
                  </div>
                  <div>
                    <span className="font-medium">时长：</span>
                    {audioFile.duration ? `${Math.floor(audioFile.duration / 60)}:${(audioFile.duration % 60).toString().padStart(2, '0')}` : '未知'}
                  </div>
                  <div>
                    <span className="font-medium">大小：</span>
                    {(audioFile.file_size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div>
                    <span className="font-medium">上传时间：</span>
                    {new Date(audioFile.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* 转写进度 */}
            {transcript && transcript.status === 'processing' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">转写进度</span>
                  <span className="text-sm text-gray-500">{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 转写结果 */}
            {transcript && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">转写结果</h3>
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="编辑转写文本..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {editedText || '暂无转写内容'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* 状态指示 */}
            {transcript && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    transcript.status === 'completed' ? 'bg-green-500' :
                    transcript.status === 'processing' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {transcript.status === 'completed' ? '转写完成' :
                     transcript.status === 'processing' ? '正在转写...' :
                     '转写失败'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {transcript.language === 'zh' ? '中文' : '其他语言'}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};