import React, { useState } from 'react';
import { Book, Loan, LoanStatus } from '../types';
import { Search, RotateCcw, Clock, AlertTriangle, Trash2, Edit2, History } from 'lucide-react';

interface LoanManagerProps {
  books: Book[];
  loans: Loan[];
  onBorrow: (bookId: string, studentName: string, studentClass: string) => void;
  onReturn: (loanId: string) => void;
  onRenew: (loanId: string) => void;
  onUpdateLoan: (loanId: string, updates: Partial<Loan>) => void;
  onDeleteLoan: (loanId: string) => void;
}

const LoanManager: React.FC<LoanManagerProps> = ({ books, loans, onBorrow, onReturn, onRenew, onUpdateLoan, onDeleteLoan }) => {
  const [activeTab, setActiveTab] = useState<'borrow' | 'list' | 'history'>('list');
  const [borrowSearch, setBorrowSearch] = useState('');

  // Borrow Form State
  const [selectedBookId, setSelectedBookId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Helpers
  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN');
  const formatDateForInput = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

  const availableBooks = books.filter(b => b.available > 0 &&
    (b.title.toLowerCase().includes(borrowSearch.toLowerCase()) || b.id.toLowerCase().includes(borrowSearch.toLowerCase()))
  );

  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE);
  const historyLoans = loans.filter(l => l.status === LoanStatus.RETURNED);

  const handleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookId && studentName && studentClass) {
      // Check limits
      const studentActiveLoans = activeLoans.filter(l => l.studentName.toLowerCase() === studentName.toLowerCase());
      if (studentActiveLoans.length >= 3) {
        alert("❌ Học sinh đã mượn tối đa 3 cuốn sách!");
        return;
      }
      onBorrow(selectedBookId, studentName, studentClass);
      setSelectedBookId('');
      setStudentName('');
      setStudentClass('');
      setActiveTab('list');
      alert("✅ Đăng ký mượn sách thành công!");
    }
  };

  // Mở modal sửa phiếu mượn
  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setEditStudentName(loan.studentName);
    setEditStudentClass(loan.studentClass);
    setEditDueDate(formatDateForInput(loan.dueDate));
    setIsEditModalOpen(true);
  };

  // Xử lý submit form sửa phiếu mượn
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoan) return;

    onUpdateLoan(editingLoan.id, {
      studentName: editStudentName,
      studentClass: editStudentClass,
      dueDate: new Date(editDueDate).toISOString()
    });
    setIsEditModalOpen(false);
    setEditingLoan(null);
    alert('✅ Đã cập nhật phiếu mượn!');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 px-1 ${activeTab === 'list' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Danh sách Mượn
        </button>
        <button
          onClick={() => setActiveTab('borrow')}
          className={`pb-3 px-1 ${activeTab === 'borrow' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          Đăng ký Mượn
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 flex items-center gap-1 ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
        >
          <History size={16} /> Lịch sử
        </button>
      </div>

      {activeTab === 'borrow' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-4">✍️ Phiếu Mượn Sách</h3>
          <form onSubmit={handleBorrow} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tìm sách</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Nhập tên sách..."
                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={borrowSearch}
                    onChange={e => setBorrowSearch(e.target.value)}
                  />
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableBooks.map(book => (
                    <div
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className={`p-2 cursor-pointer hover:bg-blue-50 text-sm flex justify-between ${selectedBookId === book.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''}`}
                    >
                      <span className="font-medium truncate">{book.title}</span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">{book.id}</span>
                    </div>
                  ))}
                  {availableBooks.length === 0 && <div className="p-2 text-sm text-gray-500">Không có sách phù hợp</div>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên học sinh</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                <input
                  required
                  type="text"
                  placeholder="VD: 12A1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={studentClass}
                  onChange={e => setStudentClass(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!selectedBookId}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Xác nhận Mượn
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Sách</th>
                <th className="p-4 font-semibold text-gray-600">Học Sinh</th>
                <th className="p-4 font-semibold text-gray-600">Ngày Mượn - Hạn Trả</th>
                <th className="p-4 font-semibold text-gray-600 text-center">Trạng Thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{loan.bookTitle}</div>
                    <div className="text-xs text-gray-400">ID: {loan.bookId}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{loan.studentName}</div>
                    <div className="text-xs text-gray-500">{loan.studentClass}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{formatDate(loan.loanDate)}</div>
                    <div className="text-gray-400">➜ {formatDate(loan.dueDate)}</div>
                  </td>
                  <td className="p-4 text-center">
                    {loan.status === LoanStatus.OVERDUE ? (
                      <div className="flex flex-col items-center text-red-600">
                        <span className="bg-red-100 px-2 py-1 rounded text-xs font-bold mb-1">QUÁ HẠN</span>
                        <span className="text-xs">{formatMoney(loan.fineAmount)}</span>
                      </div>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">ĐANG MƯỢN</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(loan)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Sửa thông tin"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!loan.isRenewed && loan.status !== LoanStatus.OVERDUE && (
                      <button
                        onClick={() => onRenew(loan.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Gia hạn"
                      >
                        <Clock size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => onReturn(loan.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Trả sách"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      onClick={() => onDeleteLoan(loan.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Xóa phiếu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {activeLoans.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Hiện không có sách nào đang được mượn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Sách</th>
                <th className="p-4 font-semibold text-gray-600">Học Sinh</th>
                <th className="p-4 font-semibold text-gray-600">Ngày Mượn - Trả</th>
                <th className="p-4 font-semibold text-gray-600 text-center">Phí Phạt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{loan.bookTitle}</div>
                    <div className="text-xs text-gray-400">ID: {loan.bookId}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{loan.studentName}</div>
                    <div className="text-xs text-gray-500">{loan.studentClass}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{formatDate(loan.loanDate)}</div>
                    <div className="text-green-600">➜ {loan.returnDate ? formatDate(loan.returnDate) : '-'}</div>
                  </td>
                  <td className="p-4 text-center">
                    {loan.fineAmount > 0 ? (
                      <span className="text-red-600 font-medium">{formatMoney(loan.fineAmount)}</span>
                    ) : (
                      <span className="text-green-600 text-sm">Không phạt</span>
                    )}
                  </td>
                </tr>
              ))}
              {historyLoans.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Chưa có lịch sử mượn trả nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Loan Modal */}
      {isEditModalOpen && editingLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Edit2 className="text-blue-600" /> Sửa Phiếu Mượn
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sách</label>
                <input
                  disabled
                  type="text"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500"
                  value={editingLoan.bookTitle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên học sinh</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editStudentClass}
                  onChange={e => setEditStudentClass(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn trả</label>
                <input
                  required
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingLoan(null);
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
    </div>
  );
};

export default LoanManager;
