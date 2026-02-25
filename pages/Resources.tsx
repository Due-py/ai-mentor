import React, { useState } from 'react';
import { useMemory } from '../contexts/MemoryContext';
import { discoverResources } from '../services/geminiService';
import { Search, ExternalLink, BookOpen, Video, Award, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Resource } from '../types';

export const Resources: React.FC = () => {
  const { memory, apiKey, saveResource, removeResource } = useMemory();
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return alert("Cần có API Key để sử dụng.");
    setLoading(true);
    const discovered = await discoverResources(query, memory);
    setResults(discovered);
    setLoading(false);
  };

  const isSaved = (id: string) => memory.savedResources.some(r => r.id === id);

  const toggleSave = (resource: Resource) => {
    if (isSaved(resource.id)) {
      removeResource(resource.id);
    } else {
      saveResource(resource);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'exercise': return <Award className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-sage-500" />;
    }
  };

  // Determine which list to display
  const displayList = activeTab === 'search' ? results : memory.savedResources;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="font-serif text-3xl font-bold text-slate-900 mb-2">Kho tài liệu</h2>
        <p className="text-slate-500">Tài liệu học thuật uy tín được AI tuyển chọn.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-cream-200">
        <button 
          onClick={() => setActiveTab('search')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'search' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
        >
          Tìm kiếm mới
          {activeTab === 'search' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'saved' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
        >
          Đã lưu ({memory.savedResources.length})
          {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full"></div>}
        </button>
      </div>

      {/* Search Bar (Only visible in search tab) */}
      {activeTab === 'search' && (
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Bạn muốn tìm tài liệu môn gì hôm nay?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-cream-300 bg-white shadow-sm focus:ring-2 focus:ring-slate-800 focus:outline-none transition-all text-lg"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-cream-50 px-6 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={loading || !query}
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Tìm kiếm'}
          </button>
        </form>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayList.map((res, idx) => (
          <div key={res.id || idx} className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-cream-50 rounded-lg group-hover:bg-cream-100 transition-colors">
                {getIcon(res.type)}
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider h-fit ${res.authority === 'High' ? 'bg-sage-100 text-sage-700' : 'bg-gray-100 text-gray-600'}`}>
                  {res.authority === 'High' ? 'Uy tín' : 'Tham khảo'}
                </span>
                <button 
                  onClick={() => toggleSave(res)}
                  className={`p-1.5 rounded-full transition-colors ${isSaved(res.id) ? 'bg-slate-800 text-yellow-400' : 'bg-cream-100 text-slate-400 hover:bg-cream-200'}`}
                  title={isSaved(res.id) ? "Bỏ lưu" : "Lưu tài liệu"}
                >
                  {isSaved(res.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">{res.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-1 line-clamp-3">{res.description}</p>
            
            <a 
              href={res.url} 
              target="_blank" 
              rel="noreferrer"
              className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-slate-800 hover:underline"
            >
              Xem tài liệu <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
        
        {displayList.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 opacity-50">
            {activeTab === 'search' ? (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Nhập từ khóa để tìm kiếm tài liệu.</p>
              </>
            ) : (
               <>
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Bạn chưa lưu tài liệu nào.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};