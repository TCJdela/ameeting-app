import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onFileUpload: (file: File) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete, 
  onFileUpload 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 录音计时器
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // 清理音频URL
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      toast.success('录音已开始');
    } catch (error) {
      console.error('录音启动失败:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast.info('录音已恢复');
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast.info('录音已暂停');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // 延迟执行，确保录音完全停止
      setTimeout(() => {
        if (audioBlob) {
          onRecordingComplete(audioBlob, recordingTime);
          toast.success(`录音完成，时长: ${formatTime(recordingTime)}`);
        }
      }, 100);
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        onFileUpload(file);
        toast.success(`已选择音频文件: ${file.name}`);
      } else {
        toast.error('请选择有效的音频文件');
      }
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">会议录音</h2>
        <p className="text-gray-600">点击开始录音，或上传已有的音频文件</p>
      </div>

      {/* 录音控制区域 */}
      <div className="flex flex-col items-center space-y-6">
        {/* 录音按钮和时间显示 */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <button
              onClick={isRecording ? undefined : startRecording}
              disabled={isRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }`}
            >
              <Mic className={`w-8 h-8 text-white ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
            
            {isRecording && (
              <div className="absolute -inset-2 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
            )}
          </div>
          
          {isRecording && (
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-red-500">
                {formatTime(recordingTime)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isPaused ? '已暂停' : '正在录音...'}
              </div>
            </div>
          )}
        </div>

        {/* 录音控制按钮 */}
        {isRecording && (
          <div className="flex space-x-4">
            <button
              onClick={pauseRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? '继续' : '暂停'}</span>
            </button>
            
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>停止</span>
            </button>
          </div>
        )}

        {/* 文件上传区域 */}
        <div className="w-full">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">或上传音频文件</p>
            <p className="text-sm text-gray-500 mb-4">支持 MP3、WAV、M4A 格式</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 录音预览 */}
        {audioUrl && (
          <div className="w-full p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">录音预览</span>
              <button
                onClick={resetRecording}
                className="text-sm text-red-500 hover:text-red-600"
              >
                清除
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={playRecording}
                className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
              >
                {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  时长: {formatTime(recordingTime)}
                </div>
              </div>
            </div>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};