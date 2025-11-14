import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Mic, FileText, History, Settings, Upload, Play, Pause, Square, Download, Edit3, Save, X } from 'lucide-react'

// 主页组件
function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            自动会议纪要工具
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            智能录音转会议纪要系统
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 录音功能 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                实时录音
              </h3>
              <p className="text-gray-600 mb-6">
                直接录制会议音频，自动转换为文字
              </p>
              <button
                onClick={() => navigate('/record')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                开始录音
              </button>
            </div>
          </div>

          {/* 文件上传 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                上传音频
              </h3>
              <p className="text-gray-600 mb-6">
                上传现有音频文件，生成会议纪要
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                上传文件
              </button>
            </div>
          </div>
        </div>

        {/* 功能特点 */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">AI智能转写</h4>
              <p className="text-gray-600">使用OpenAI Whisper技术，准确识别语音内容</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Settings className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">智能总结</h4>
              <p className="text-gray-600">自动生成会议纪要，提取关键信息</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Download className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">多格式导出</h4>
              <p className="text-gray-600">支持PDF、Word、Markdown格式导出</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 录音页面组件
function RecordPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcriptId, setTranscriptId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('开始录音')
    } catch (error) {
      toast.error('无法访问麦克风')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success('录音结束')
    }
  }

  const uploadAudio = async () => {
    if (!audioBlob) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        setTranscriptId(result.transcriptId)
        toast.success('音频上传成功，开始转写...')
        
        // 等待转写完成
        setTimeout(() => {
          window.location.href = `/transcribe/${result.transcriptId}`
        }, 2000)
      } else {
        toast.error('上传失败')
      }
    } catch (error) {
      toast.error('上传出错')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              实时录音
            </h2>

            <div className="text-center">
              <div className={`rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-blue-100'
              }`}>
                <Mic className={`w-16 h-16 ${
                  isRecording ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>

              <div className="space-y-4">
                {!isRecording && !audioBlob && (
                  <button
                    onClick={startRecording}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    开始录音
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    停止录音
                  </button>
                )}

                {audioBlob && !isProcessing && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">录音已完成，准备上传</p>
                    </div>
                    <button
                      onClick={uploadAudio}
                      className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      上传并转写
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">正在处理中...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主应用组件
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        {/* 导航栏 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-900">
                会议纪要工具
              </Link>
              <div className="flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
                  首页
                </Link>
                <Link to="/history" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">
                  历史记录
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 路由 */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/record" element={<RecordPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App