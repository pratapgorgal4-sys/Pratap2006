
import React, { useState } from 'react';
import { Message, Role, MessageType } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <div className="space-y-3">
             <img 
               src={message.content} 
               alt="Generated" 
               className="rounded-2xl w-full max-w-sm shadow-lg border border-gray-100 hover:scale-[1.01] transition-transform duration-300"
             />
             {message.metadata?.prompt && <p className="text-[10px] text-gray-400 font-medium italic">Prompt: {message.metadata.prompt}</p>}
          </div>
        );
      case MessageType.EDIT:
        return (
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Source</p>
                  <img src={message.metadata?.sourceImage} className="rounded-xl w-full border border-gray-100" alt="Original" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase font-bold text-orange-500 mb-1">Enhanced</p>
                  <img src={message.content} className="rounded-xl w-full border border-orange-200 shadow-md shadow-orange-50" alt="Edited" />
                </div>
             </div>
             {message.metadata?.prompt && <p className="text-[10px] text-gray-400 italic">Edit: {message.metadata.prompt}</p>}
          </div>
        );
      case MessageType.VIDEO:
        return (
          <div className="space-y-3">
            <video src={message.content} controls className="rounded-2xl w-full max-w-md shadow-lg border border-gray-100" />
            <p className="text-[10px] text-gray-400 italic">Synthesis: {message.metadata?.prompt}</p>
          </div>
        );
      case MessageType.CODE:
        return (
          <div className="group relative">
            <div className="font-mono text-[13px] bg-gray-50 p-5 rounded-2xl border border-gray-200 overflow-x-auto selection:bg-orange-100 custom-scrollbar text-gray-800">
              <pre><code>{message.content}</code></pre>
            </div>
            <button onClick={copyToClipboard} className="absolute top-3 right-3 p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px] text-gray-800">
              {message.content || "..."}
            </div>
            {message.metadata?.groundingChunks && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                  {message.metadata.groundingChunks.map((chunk: any, i: number) => (
                    chunk.web && (
                      <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-all truncate max-w-[200px]">
                        {chunk.web.title}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex w-full mb-8 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center text-lg shadow-md
          ${isUser ? 'bg-gray-800 text-white ml-4' : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white mr-4'}`}>
          {isUser ? '👤' : '🇮🇳'}
        </div>

        <div className="flex flex-col space-y-1">
          <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
             <span className={`text-[10px] font-bold uppercase tracking-widest ${isUser ? 'text-gray-400' : 'text-orange-500'}`}>
              {isUser ? 'You' : 'AI India'}
            </span>
          </div>
          <div className={`relative px-5 py-4 rounded-3xl transition-all duration-300
            ${isUser 
              ? 'bg-orange-50 text-gray-900 rounded-tr-none shadow-sm border border-orange-100' 
              : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'}`}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
