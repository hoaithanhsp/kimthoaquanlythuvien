import React, { useState } from 'react';
import { getBookRecommendations, RecommendationsResult } from '../services/geminiService';
import { Sparkles, Search, BookOpen, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface SearchAssistantProps {
  currentBookTitles: string[];
}

interface Recommendation {
  title: string;
  author: string;
  reason: string;
  category: string;
}

const SearchAssistant: React.FC<SearchAssistantProps> = ({ currentBookTitles }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setError(null);
    setUsedModel(null);

    const data = await getBookRecommendations(query, currentBookTitles);

    if (data.error) {
      setError(data.error);
    } else if (data.recommendations) {
      setResults(data.recommendations);
      if (data.usedModel) {
        setUsedModel(data.usedModel);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full text-indigo-600 mb-2">
          <Sparkles size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Trợ Lý Thư Viện AI</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Nhập sở thích, môn học hoặc chủ đề bạn quan tâm. AI sẽ gợi ý những cuốn sách phù hợp nhất cho bạn.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="VD: Sách hay về lịch sử Việt Nam, Tiểu thuyết trinh thám..."
          className="w-full pl-6 pr-14 py-4 rounded-full border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 shadow-sm text-lg outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader className="animate-spin" /> : <Search />}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-red-700">Lỗi</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success with Model Info */}
      {usedModel && results.length > 0 && (
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-sm text-gray-500">
          <CheckCircle size={16} className="text-green-500" />
          <span>Đã sử dụng model: <span className="font-medium">{usedModel}</span></span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((book, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start justify-between mb-2">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold uppercase">
                {book.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{book.title}</h3>
            <p className="text-sm text-gray-500 mb-3">Tác giả: {book.author}</p>
            <div className="bg-gray-50 p-3 rounded-lg flex gap-3">
              <BookOpen className="text-gray-400 shrink-0" size={20} />
              <p className="text-gray-600 text-sm italic">"{book.reason}"</p>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && hasSearched && results.length === 0 && !error && (
        <div className="text-center text-gray-500 mt-8">
          Không tìm thấy gợi ý nào. Hãy thử từ khóa khác xem sao!
        </div>
      )}
    </div>
  );
};

export default SearchAssistant;

