
import React from 'react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, currentSessionId, onSelectSession, onNewChat, user, onLogout }) => {
  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-xl border-r border-gray-200/50 w-64 md:w-72 hidden md:flex z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-tr from-orange-500 via-gray-100 to-green-600 p-[1.5px] rounded-lg">
            <div className="bg-white p-1 rounded-lg">
              🇮🇳
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            AI <span className="text-orange-500">INDIA</span>
          </h1>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-gray-200 active:scale-95 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
          Conversation History
        </div>
        {sessions.length === 0 ? (
          <div className="text-xs text-gray-400 px-2 italic">No chats found</div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group flex items-center gap-3 text-sm font-medium ${
                currentSessionId === session.id
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${currentSessionId === session.id ? 'bg-orange-500' : 'bg-gray-200 group-hover:bg-gray-300'}`}></div>
              <span className="truncate">{session.title}</span>
            </button>
          ))
        )}
      </div>

      <div className="p-4 mt-auto border-t border-gray-100 space-y-3">
        {user && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
