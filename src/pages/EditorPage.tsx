import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Edit3, Save, Download, Share2, ArrowLeft } from 'lucide-react';
import { exportToPDF, exportToMarkdown, exportToWord } from '../utils/export';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meetingNote, setMeetingNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word' | 'markdown'>('pdf');

  useEffect(() => {
    if (id) {
      loadMeetingNote();
    }
  }, [id]);

  const loadMeetingNote = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_notes')
        .select(`
          *,
          transcripts (
            *,
            audio_files (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setMeetingNote(data);
      setEditedContent(data.content);
      setIsLoading(false);
    } catch (error) {
      console.error('加载会议纪要失败:', error);
      toast.error('无法加载会议纪要');
      navigate('/history');
    }
  };

  const saveMeetingNote = async () => {
    try {
      const { error } = await supabase
        .from('meeting_notes')
        .update({
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMeetingNote({ ...meetingNote, content: editedContent });
      setIsEditing(false);
      toast.success('会议纪要已保存');
    } catch (error) {
      console.error('保存会议纪要失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const exportMeetingNote = async () => {
    try {
      if (!meetingNote?.content) {
        toast.error('没有可导出的内容');
        return;
      }

      const title = meetingNote.title || '会议纪要';
      
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(meetingNote.content, title);
          break;
        case 'word':
          await exportToWord(meetingNote.content, title);
          break;
        case 'markdown':
          await exportToMarkdown(meetingNote.content, title);
          break;
        default:
          throw new Error('不支持的导出格式');
      }

      toast.success('会议纪要导出成功');
    } catch (error) {
      console.error('导出会议纪要失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载会议纪要...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!meetingNote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">会议纪要不存在</p>
            <button
              onClick={() => navigate('/history')}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              返回历史记录
            </button>
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
          {/* 头部 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/history')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  会议纪要
                </h1>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* 导出格式选择 */}
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="markdown">Markdown</option>
                </select>
                
                <button
                  onClick={exportMeetingNote}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </button>
                
                {isEditing ? (
                  <button
                    onClick={saveMeetingNote}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                )}
              </div>
            </div>

            {/* 会议信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">创建时间：</span>
                {formatDate(meetingNote.created_at)}
              </div>
              <div>
                <span className="font-medium">更新时间：</span>
                {formatDate(meetingNote.updated_at)}
              </div>
              <div>
                <span className="font-medium">模板类型：</span>
                {meetingNote.template_type}
              </div>
              <div>
                <span className="font-medium">音频文件：</span>
                {meetingNote.transcripts?.audio_files?.original_name || '未知'}
              </div>
            </div>
          </div>

          {/* 关键信息摘要 */}
          {(meetingNote.key_points || meetingNote.action_items || meetingNote.decisions) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {meetingNote.key_points && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">关键要点</h3>
                  <div className="text-gray-700 whitespace-pre-wrap text-sm">
                    {meetingNote.key_points}
                  </div>
                </div>
              )}
              
              {meetingNote.action_items && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">行动项</h3>
                  <div className="text-gray-700 whitespace-pre-wrap text-sm">
                    {meetingNote.action_items}
                  </div>
                </div>
              )}
              
              {meetingNote.decisions && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">决策事项</h3>
                  <div className="text-gray-700 whitespace-pre-wrap text-sm">
                    {meetingNote.decisions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 会议纪要内容 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">会议纪要内容</h2>
              {isEditing && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  编辑模式
                </span>
              )}
            </div>
            
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                placeholder="编辑会议纪要内容..."
              />
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {meetingNote.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};