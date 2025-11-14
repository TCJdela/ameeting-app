import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, FileText, Clock, Download, Users, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Mic className="w-8 h-8 text-blue-500" />,
      title: '智能录音',
      description: '高质量录音，支持实时转写和多种音频格式'
    },
    {
      icon: <FileText className="w-8 h-8 text-green-500" />,
      title: 'AI转写',
      description: '准确的语音转文字，支持中文和多种语言'
    },
    {
      icon: <Zap className="w-8 h-8 text-purple-500" />,
      title: '智能生成',
      description: '自动提取关键信息、行动项和决策点'
    },
    {
      icon: <Download className="w-8 h-8 text-orange-500" />,
      title: '多格式导出',
      description: '支持PDF、Word、Markdown等多种格式导出'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            智能会议纪要工具
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            自动记录、转写和生成会议纪要，让每一次会议都高效有序
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/record"
              className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Mic className="w-5 h-5 mr-2" />
              开始录音
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              查看历史记录
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            核心功能
          </h2>
          <p className="text-lg text-gray-600">
            一站式智能会议记录解决方案
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            如何使用
          </h2>
          <p className="text-lg text-gray-600">
            简单三步，快速生成专业会议纪要
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  录制或上传音频
                </h3>
                <p className="text-gray-600">
                  使用我们的录音功能录制会议，或上传现有的音频文件
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  自动转写和编辑
                </h3>
                <p className="text-gray-600">
                  AI自动将语音转换为文字，您可以编辑和校正转写结果
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  生成和导出纪要
                </h3>
                <p className="text-gray-600">
                  智能生成会议纪要，支持多种格式导出和分享
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            立即开始体验
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            免费试用，无需信用卡，让会议记录变得简单高效
          </p>
          <Link
            to="/record"
            className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Mic className="w-5 h-5 mr-2" />
            免费开始
          </Link>
        </div>
      </div>
    </div>
  );
};