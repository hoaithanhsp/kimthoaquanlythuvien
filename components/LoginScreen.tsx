import React, { useState } from 'react';
import { LogIn, User, Lock, BookOpen, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (userName: string) => void;
}

// Thông tin đăng nhập cố định
const VALID_CREDENTIALS = {
    username: 'Trần Thị Kim Thoa',
    password: '12345'
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Giả lập delay đăng nhập
        setTimeout(() => {
            if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
                onLogin(username);
            } else {
                setError('Tên đăng nhập hoặc mật khẩu không đúng!');
                setIsLoading(false);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up">
                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img
                                src="/logo.jpg"
                                alt="Logo"
                                className="w-24 h-24 rounded-2xl shadow-lg object-cover"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                            <BookOpen className="text-blue-600" size={28} />
                            Library Manager
                        </h1>
                        <p className="text-gray-500 mt-2">Hệ thống Quản lý Thư viện Thông minh</p>
                    </div>

                    {/* School Info */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
                        <p className="font-semibold text-blue-800">Trường THPT Hoàng Diệu</p>
                        <p className="text-sm text-blue-600">Số 1 Mạc Đĩnh Chi, phường Phú Lợi, TP. Cần Thơ</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên đăng nhập
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nhập tên đăng nhập..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang đăng nhập...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-400">
                            Sản phẩm SKKN © 2026
                        </p>
                    </div>
                </div>

                {/* Author Card */}
                <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                    <img
                        src="/avatar.jpg"
                        alt="Tác giả"
                        className="w-14 h-14 rounded-full border-2 border-white shadow-lg object-cover"
                    />
                    <div className="text-white">
                        <p className="font-semibold">Trần Thị Kim Thoa</p>
                        <p className="text-sm text-white/80">Giáo viên - Tác giả ứng dụng</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
