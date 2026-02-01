import React, { useState, useRef } from 'react';
import { Book, Category } from '../types';
import { Search, Plus, Trash2, Edit2, Book as BookIcon, Upload, FileText, Loader2, CheckSquare, Square } from 'lucide-react';
import { parseFile, ACCEPT_FILE_TYPES } from '../services/fileParserService';
import { extractBooksFromText, ExtractedBook } from '../services/geminiService';

interface BookManagerProps {
  books: Book[];
  onAddBook: (book: Omit<Book, 'id'>) => void;
  onDeleteBook: (id: string) => void;
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
}

const BookManager: React.FC<BookManagerProps> = ({ books, onAddBook, onDeleteBook, onUpdateBook }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form State for Add
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.VH);
  const [newTotal, setNewTotal] = useState(1);

  // Form State for Edit
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCategory, setEditCategory] = useState<Category>(Category.VH);
  const [editTotal, setEditTotal] = useState(1);
  const [editAvailable, setEditAvailable] = useState(1);

  // Import File State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [extractedBooks, setExtractedBooks] = useState<ExtractedBook[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
  const [importedFileName, setImportedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBook({
      title: newTitle,
      author: newAuthor,
      category: newCategory,
      total: newTotal,
      available: newTotal // Initially all available
    });
    setIsModalOpen(false);
    // Reset
    setNewTitle('');
    setNewAuthor('');
    setNewTotal(1);
  };

  // Mở modal sửa với dữ liệu sách hiện tại
  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category);
    setEditTotal(book.total);
    setEditAvailable(book.available);
    setIsEditModalOpen(true);
  };

  // Xử lý submit form sửa sách
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    onUpdateBook(editingBook.id, {
      title: editTitle,
      author: editAuthor,
      category: editCategory,
      total: editTotal,
      available: editAvailable
    });
    setIsEditModalOpen(false);
    setEditingBook(null);
    alert('✅ Đã cập nhật sách thành công!');
  };

  // Xử lý upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);
    setExtractedBooks([]);
    setSelectedBooks(new Set());
    setImportedFileName(file.name);

    try {
      // Parse file
      const parseResult = await parseFile(file);
      if (!parseResult.success) {
        setImportError(parseResult.error || 'Lỗi đọc file');
        setImportLoading(false);
        return;
      }

      // Extract books using AI
      const extractResult = await extractBooksFromText(
        parseResult.content,
        parseResult.type === 'table'
      );

      if (extractResult.error) {
        setImportError(extractResult.error);
      } else if (extractResult.books.length === 0) {
        setImportError('Không tìm thấy sách nào trong file. Hãy đảm bảo file chứa thông tin sách.');
      } else {
        setExtractedBooks(extractResult.books);
        // Select all by default
        setSelectedBooks(new Set(extractResult.books.map((_, i) => i)));
      }
    } catch (error: any) {
      setImportError(`Lỗi: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Toggle chọn sách
  const toggleBookSelection = (index: number) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedBooks(newSelected);
  };

  // Toggle chọn tất cả
  const toggleSelectAll = () => {
    if (selectedBooks.size === extractedBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(extractedBooks.map((_, i) => i)));
    }
  };

  // Map category string to Category enum
  const mapToCategory = (cat: string): Category => {
    const categoryMap: Record<string, Category> = {
      'Văn học': Category.VH,
      'Khoa học': Category.KH,
      'Lịch sử - Địa lý': Category.LS,
      'Tiếng Anh': Category.TA,
      'Kỹ năng sống': Category.KT,
      'Tham khảo': Category.TK,
      'Kiến thức chung': Category.KN
    };
    return categoryMap[cat] || Category.TK;
  };

  // Import sách đã chọn
  const handleImportSelected = () => {
    const booksToImport = extractedBooks.filter((_, i) => selectedBooks.has(i));
    let importedCount = 0;

    booksToImport.forEach(book => {
      onAddBook({
        title: book.title,
        author: book.author || 'Chưa rõ',
        category: mapToCategory(book.category),
        total: book.quantity || 1,
        available: book.quantity || 1
      });
      importedCount++;
    });

    alert(`✅ Đã import thành công ${importedCount} cuốn sách!`);
    setIsImportModalOpen(false);
    setExtractedBooks([]);
    setSelectedBooks(new Set());
    setImportedFileName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-800">📚 Quản Lý Sách</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload size={20} /> Import từ File
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> Thêm Sách Mới
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Tìm sách theo tên, tác giả hoặc mã..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Books List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mã Sách</th>
              <th className="p-4 font-semibold text-gray-600">Tên Sách & Tác Giả</th>
              <th className="p-4 font-semibold text-gray-600">Thể Loại</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Tình Trạng</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBooks.map(book => (
              <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-sm text-gray-500">{book.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{book.title}</div>
                  <div className="text-sm text-gray-500">{book.author}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {book.category}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${book.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {book.available} / {book.total} quyển
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(book)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Sửa sách"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteBook(book.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBooks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Không tìm thấy sách nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookIcon className="text-blue-600" /> Thêm Sách Mới
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sách</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as Category)}
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTotal}
                    onChange={e => setNewTotal(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thêm Sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {isEditModalOpen && editingBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit2 className="text-blue-600" /> Sửa Thông Tin Sách
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã sách</label>
                <input
                  disabled
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                  value={editingBook.id}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sách</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editAuthor}
                  onChange={e => setEditAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as Category)}
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tổng số lượng</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editTotal}
                    onChange={e => setEditTotal(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Còn lại</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={editTotal}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editAvailable}
                    onChange={e => setEditAvailable(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBook(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import File Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-fade-in-up max-h-[90vh] overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-green-600" /> Import Sách từ File
            </h3>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_FILE_TYPES}
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* File Upload Area */}
            {extractedBooks.length === 0 && !importLoading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">Kéo thả file hoặc click để chọn</p>
                <p className="text-sm text-gray-400 mt-2">Hỗ trợ: Word (.docx), PDF (.pdf), Excel (.xlsx, .xls)</p>
              </div>
            )}

            {/* Loading State */}
            {importLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={48} className="animate-spin text-green-600 mb-4" />
                <p className="text-gray-600">Đang phân tích file "{importedFileName}"...</p>
                <p className="text-sm text-gray-400 mt-1">AI đang trích xuất danh sách sách</p>
              </div>
            )}

            {/* Error State */}
            {importError && !importLoading && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                <p className="font-medium">❌ {importError}</p>
                <button
                  onClick={() => {
                    setImportError(null);
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 text-sm underline"
                >
                  Thử lại với file khác
                </button>
              </div>
            )}

            {/* Extracted Books Preview */}
            {extractedBooks.length > 0 && !importLoading && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">
                    📁 {importedFileName} • Tìm thấy <strong>{extractedBooks.length}</strong> sách
                  </p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedBooks.size === extractedBooks.length ? (
                      <><CheckSquare size={16} /> Bỏ chọn tất cả</>
                    ) : (
                      <><Square size={16} /> Chọn tất cả</>
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left w-8"></th>
                        <th className="p-2 text-left">Tên sách</th>
                        <th className="p-2 text-left">Tác giả</th>
                        <th className="p-2 text-left">Thể loại</th>
                        <th className="p-2 text-center w-16">SL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {extractedBooks.map((book, index) => (
                        <tr
                          key={index}
                          onClick={() => toggleBookSelection(index)}
                          className={`cursor-pointer hover:bg-gray-50 ${selectedBooks.has(index) ? 'bg-green-50' : ''}`}
                        >
                          <td className="p-2 text-center">
                            {selectedBooks.has(index) ? (
                              <CheckSquare size={18} className="text-green-600" />
                            ) : (
                              <Square size={18} className="text-gray-400" />
                            )}
                          </td>
                          <td className="p-2 font-medium">{book.title}</td>
                          <td className="p-2 text-gray-600">{book.author || 'Chưa rõ'}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{book.category}</span>
                          </td>
                          <td className="p-2 text-center">{book.quantity || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setExtractedBooks([]);
                  setSelectedBooks(new Set());
                  setImportError(null);
                  setImportedFileName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Đóng
              </button>

              {extractedBooks.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    Chọn file khác
                  </button>
                  <button
                    onClick={handleImportSelected}
                    disabled={selectedBooks.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Import {selectedBooks.size} sách
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManager;
