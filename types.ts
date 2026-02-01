export enum Category {
  VH = 'Văn học',
  KH = 'Khoa học',
  LS = 'Lịch sử - Địa lý',
  TA = 'Tiếng Anh',
  KT = 'Kỹ năng sống',
  TK = 'Tham khảo',
  KN = 'Kiến thức chung'
}

export enum LoanStatus {
  ACTIVE = 'Đang mượn',
  RETURNED = 'Đã trả',
  OVERDUE = 'Quá hạn'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  total: number;
  available: number;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  studentName: string;
  studentClass: string;
  loanDate: string; // ISO Date string
  dueDate: string; // ISO Date string
  returnDate?: string; // ISO Date string
  status: LoanStatus;
  isRenewed: boolean;
  fineAmount: number;
}

export interface Stats {
  totalBooks: number;
  totalCopies: number;
  activeLoans: number;
  overdueLoans: number;
}
