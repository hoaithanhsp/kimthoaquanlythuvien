import React from 'react';
import { Book, Loan, LoanStatus, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BookOpen, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  books: Book[];
  loans: Loan[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Dashboard: React.FC<DashboardProps> = ({ books, loans }) => {
  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE);
  const overdueLoans = loans.filter(l => l.status === LoanStatus.OVERDUE);
  
  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + b.total, 0);

  // Prepare Chart Data: Books by Category
  const categoryData = Object.values(Category).map(cat => {
    return {
      name: cat,
      count: books.filter(b => b.category === cat).reduce((sum, b) => sum + b.total, 0)
    };
  });

  // Prepare Chart Data: Loan Status
  const loanStatusData = [
    { name: 'Đúng hạn', value: activeLoans.length - overdueLoans.length },
    { name: 'Quá hạn', value: overdueLoans.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">📊 Thống Kê Thư Viện</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng đầu sách</p>
            <h3 className="text-2xl font-bold">{totalBooks}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sách đang mượn</p>
            <h3 className="text-2xl font-bold">{activeLoans.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sách quá hạn</p>
            <h3 className="text-2xl font-bold">{overdueLoans.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng bản sách</p>
            <h3 className="text-2xl font-bold">{totalCopies}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold mb-4">Phân bố sách theo thể loại</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                 {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
          <h3 className="text-lg font-semibold mb-4">Tình trạng mượn trả hiện tại</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Đúng hạn</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Quá hạn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
