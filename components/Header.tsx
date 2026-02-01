import React from 'react';
import { Settings, Key } from 'lucide-react';

interface HeaderProps {
    hasApiKey: boolean;
    onSettingsClick: () => void;
    currentModel?: string;
}

const Header: React.FC<HeaderProps> = ({ hasApiKey, onSettingsClick, currentModel }) => {
    return (
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Empty space for balance or can add breadcrumb */}
            </div>

            <div className="flex items-center gap-4">
                {/* Current Model Badge */}
                {hasApiKey && currentModel && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm text-gray-600 font-medium">
                            {currentModel.replace('gemini-', '').replace('-latest', '')}
                        </span>
                    </div>
                )}

                {/* API Key Warning */}
                {!hasApiKey && (
                    <span className="text-red-500 text-sm font-medium animate-pulse hidden sm:block">
                        ⚠️ Cần nhập API key để sử dụng AI
                    </span>
                )}

                {/* Settings Button */}
                <button
                    onClick={onSettingsClick}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${hasApiKey
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                >
                    {hasApiKey ? <Settings size={18} /> : <Key size={18} />}
                    <span className="font-medium">
                        {hasApiKey ? 'Cài đặt' : 'Nhập API Key'}
                    </span>
                </button>
            </div>
        </header>
    );
};

export default Header;
