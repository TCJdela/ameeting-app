import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { FileText, Calendar, Clock, Download, Trash2, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [meetingNotes, setMeetingNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadMeetingNotes();
  }, []);

  const loadMeetingNotes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('meeting_notes')
        .select(`
          *,
          transcripts (
            *,
            audio_files (*)
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) {
        throw error;
      }

      setMeetingNotes(data || []);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast.error('无法加载历史记录');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMeetingNote = async (id: string) => {
    if (!confirm('确定要删除这条会议纪要吗？此操作不可恢复。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('meeting_notes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // 从列表中移除
      setMeetingNotes(prev => prev.filter(note => note.id !== id));
      toast.success('会议纪要已删除');
    } catch (error) {
      console.error('删除会议纪要失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredNotes = meetingNotes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    return (
      note.content?.toLowerCase().includes(searchLower) ||
      note.key_points?.toLowerCase().includes(searchLower) ||
      note.action_items?.toLowerCase().includes(searchLower) ||
      note.transcripts?.audio_files?.original_name?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载历史记录...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题和搜索 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">历史记录</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索会议纪要内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* 排序选项 */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">按时间排序</option>
                  <option value="title">按标题排序</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {sortOrder === 'asc' ? '升序' : '降序'}
                </button>
              </div>
            </div>
          </div>

          {/* 会议纪要列表 */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? '没有找到匹配的会议纪要' : '暂无会议纪要'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? '尝试调整搜索关键词' : '开始录制您的第一个会议吧！'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/record')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  开始录音
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        会议纪要
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                        {note.transcripts?.audio_files?.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(note.transcripts.audio_files.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/editor/${note.id}`)}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMeetingNote(note.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 关键信息预览 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {note.key_points && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">关键要点</h4>
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {note.key_points}
                        </div>
                      </div>
                    )}
                    
                    {note.action_items && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">行动项</h4>
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {note.action_items}
                        </div>
                      </div>
                    )}
                    
                    {note.decisions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">决策事项</h4>
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {note.decisions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 内容预览 */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">内容预览</h4>
                    <div className="text-sm text-gray-600 line-clamp-4">
                      {note.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};