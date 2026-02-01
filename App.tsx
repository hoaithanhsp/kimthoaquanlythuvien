import React, { useState, useEffect } from 'react';
import { Book, Loan, Category, LoanStatus } from './types';
import Dashboard from './components/Dashboard';
import BookManager from './components/BookManager';
import LoanManager from './components/LoanManager';
import SearchAssistant from './components/SearchAssistant';
import ApiKeyModal from './components/ApiKeyModal';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import { getStoredApiKey, getStoredModel, saveApiKey, saveModel } from './services/geminiService';
import { LayoutDashboard, Book as BookIcon, Users, Sparkles, Menu, X, Library, LogOut } from 'lucide-react';

// MOCK DATA INITIALIZATION
const INITIAL_BOOKS: Book[] = [
  { id: "VH0001", title: "Số đỏ", author: "Vũ Trọng Phụng", category: Category.VH, total: 5, available: 3 },
  { id: "VH0002", title: "Nhà giả kim", author: "Paulo Coelho", category: Category.VH, total: 8, available: 5 },
  { id: "KH0001", title: "Bài tập Toán nâng cao 10", author: "Nguyễn Văn A", category: Category.KH, total: 10, available: 7 },
  { id: "LS0001", title: "Đại Việt sử ký toàn thư", author: "Ngô Sĩ Liên", category: Category.LS, total: 3, available: 3 },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: "L001", bookId: "VH0001", bookTitle: "Số đỏ", studentName: "Nguyễn Văn Nam", studentClass: "12A1",
    loanDate: "2023-10-01", dueDate: "2023-10-15", status: LoanStatus.OVERDUE, isRenewed: false, fineAmount: 50000
  }
];

const App: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<'dashboard' | 'books' | 'loans' | 'search'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('library_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('library_current_user') || '';
  });

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('gemini-2.5-flash-latest');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Load API config on mount
  useEffect(() => {
    const storedKey = getStoredApiKey();
    const storedModel = getStoredModel();
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setIsApiModalOpen(true); // Mở modal nếu chưa có key
    }
    setCurrentModel(storedModel);
  }, []);

  // Data State (In a real app, this would be in a Context or Redux store)
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('library_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('library_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  // Persist Data
  useEffect(() => {
    localStorage.setItem('library_books', JSON.stringify(books));
    localStorage.setItem('library_loans', JSON.stringify(loans));
  }, [books, loans]);

  // Logic: Save API Config
  const handleSaveApiConfig = (key: string, model: string) => {
    saveApiKey(key);
    saveModel(model);
    setApiKey(key);
    setCurrentModel(model);
  };

  // Logic: Login
  const handleLogin = (userName: string) => {
    setIsLoggedIn(true);
    setCurrentUser(userName);
    localStorage.setItem('library_logged_in', 'true');
    localStorage.setItem('library_current_user', userName);
  };

  // Logic: Logout
  const handleLogout = () => {
    if (window.confirm('📤 Bạn có chắc muốn đăng xuất?')) {
      setIsLoggedIn(false);
      setCurrentUser('');
      localStorage.removeItem('library_logged_in');
      localStorage.removeItem('library_current_user');
    }
  };

  // Logic: ID Generation
  const generateBookId = (category: Category) => {
    const prefixMap: Record<string, string> = {
      [Category.VH]: 'VH', [Category.KH]: 'KH', [Category.LS]: 'LS',
      [Category.TA]: 'TA', [Category.KT]: 'KT', [Category.TK]: 'TK', [Category.KN]: 'KN'
    };
    // Simple random ID for demo
    return `${prefixMap[category]}${Math.floor(Math.random() * 9000) + 1000}`;
  };

  // Logic: Add Book
  const addBook = (newBook: Omit<Book, 'id'>) => {
    const id = generateBookId(newBook.category);
    setBooks([...books, { ...newBook, id }]);
    alert(`✅ Đã thêm sách thành công!\n🆔 Mã sách: ${id}`);
  };

  // Logic: Update Book
  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks(books.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Logic: Delete Book
  const deleteBook = (id: string) => {
    if (window.confirm("⚠️ Xác nhận xóa sách này?")) {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  // Logic: Borrow Book
  const borrowBook = (bookId: string, studentName: string, studentClass: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || book.available <= 0) {
      alert("❌ Sách này hiện đã hết!");
      return;
    }

    const loanDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(loanDate.getDate() + 14);

    const newLoan: Loan = {
      id: `L${Date.now()}`,
      bookId,
      bookTitle: book.title,
      studentName,
      studentClass,
      loanDate: loanDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: LoanStatus.ACTIVE,
      isRenewed: false,
      fineAmount: 0
    };

    setLoans([...loans, newLoan]);
    updateBook(bookId, { available: book.available - 1 });
  };

  // Logic: Return Book
  const returnBook = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Calculate Fine
    const today = new Date();
    const due = new Date(loan.dueDate);
    let fine = 0;
    if (today > due) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 5000;
    }

    setLoans(loans.map(l => l.id === loanId ? {
      ...l,
      status: fine > 0 ? LoanStatus.OVERDUE : LoanStatus.RETURNED,
      returnDate: today.toISOString(),
      fineAmount: fine
    } : l));

    // Restore book availability
    const book = books.find(b => b.id === loan.bookId);
    if (book) {
      updateBook(book.id, { available: book.available + 1 });
    }

    let msg = `✅ ĐÃ TRẢ SÁCH THÀNH CÔNG!`;
    if (fine > 0) {
      msg += `\n⚠️ Sách quá hạn!\n💰 Phí phạt: ${fine.toLocaleString()}đ`;
    }
    alert(msg);
  };

  // Logic: Renew Book
  const renewBook = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    if (loan.isRenewed) {
      alert("⚠️ Chỉ được gia hạn 1 lần duy nhất!");
      return;
    }

    const newDue = new Date(loan.dueDate);
    newDue.setDate(newDue.getDate() + 7);

    setLoans(loans.map(l => l.id === loanId ? {
      ...l,
      dueDate: newDue.toISOString(),
      isRenewed: true
    } : l));
    alert("✅ Đã gia hạn thành công thêm 7 ngày!");
  };

  // Logic: Update Loan
  const updateLoan = (loanId: string, updates: Partial<Loan>) => {
    setLoans(loans.map(l => l.id === loanId ? { ...l, ...updates } : l));
  };

  // Logic: Delete Loan
  const deleteLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (window.confirm("⚠️ Xác nhận xóa phiếu mượn này?")) {
      // Nếu phiếu đang active, hoàn lại số sách
      if (loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.OVERDUE) {
        const book = books.find(b => b.id === loan.bookId);
        if (book) {
          updateBook(book.id, { available: book.available + 1 });
        }
      }
      setLoans(loans.filter(l => l.id !== loanId));
      alert("✅ Đã xóa phiếu mượn!");
    }
  };

  // Update overdue status on load (simple check)
  useEffect(() => {
    const today = new Date();
    setLoans(prevLoans => prevLoans.map(l => {
      if (l.status === LoanStatus.ACTIVE && new Date(l.dueDate) < today) {
        const diffTime = Math.abs(today.getTime() - new Date(l.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...l, status: LoanStatus.OVERDUE, fineAmount: diffDays * 5000 };
      }
      return l;
    }));
  }, []);

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveView(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === id
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSave={handleSaveApiConfig}
        initialApiKey={apiKey}
        initialModel={currentModel}
      />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 px-2 mb-10 text-blue-700">
            <Library size={32} />
            <div>
              <h1 className="text-xl font-bold leading-tight">THƯ VIỆN</h1>
              <p className="text-xs text-blue-500 font-semibold tracking-wider">THPT MANAGER</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="dashboard" label="Tổng Quan" icon={LayoutDashboard} />
            <NavItem id="books" label="Quản Lý Sách" icon={BookIcon} />
            <NavItem id="loans" label="Mượn / Trả" icon={Users} />
            <NavItem id="search" label="Gợi Ý Thông Minh" icon={Sparkles} />
          </nav>

          <div className="pt-6 border-t border-gray-100 space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <img src="/avatar.jpg" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{currentUser}</p>
                <p className="text-xs text-gray-500">Thủ thư</p>
              </div>
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header
            hasApiKey={!!apiKey}
            onSettingsClick={() => setIsApiModalOpen(true)}
            currentModel={currentModel}
          />
        </div>

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <Library size={24} /> THPT Library
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="p-2 text-gray-600"
            >
              <Sparkles size={20} />
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard books={books} loans={loans} />}
            {activeView === 'books' && (
              <BookManager
                books={books}
                onAddBook={addBook}
                onDeleteBook={deleteBook}
                onUpdateBook={updateBook}
              />
            )}
            {activeView === 'loans' && (
              <LoanManager
                books={books}
                loans={loans}
                onBorrow={borrowBook}
                onReturn={returnBook}
                onRenew={renewBook}
                onUpdateLoan={updateLoan}
                onDeleteLoan={deleteLoan}
              />
            )}
            {activeView === 'search' && (
              <SearchAssistant currentBookTitles={books.map(b => b.title)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

