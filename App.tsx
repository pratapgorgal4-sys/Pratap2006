
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import Auth from './components/Auth';
import { Message, Role, ChatSession, MessageType, User } from './types';
import { sendMessageStream, transcribeAudio, generateImage, generateVideo, editImage } from './services/geminiService';

const themes = [
  { id: 'cosmic', name: 'White Silk', icon: '☁️' },
  { id: 'grid', name: 'Clean Grid', icon: '📏' },
  { id: 'golden', name: 'Soft Amber', icon: '☀️' },
  { id: 'navy', name: 'Cool Sky', icon: '💎' },
  { id: 'aurora', name: 'Vibrant Aurora', icon: '🌈' }
];

const tools = [
  { id: MessageType.TEXT, name: 'Chat', icon: '💬' },
  { id: MessageType.SEARCH, name: 'Search', icon: '🔍' },
  { id: MessageType.IMAGE, name: 'Create', icon: '🎨' },
  { id: MessageType.EDIT, name: 'Edit', icon: '🪄' },
  { id: MessageType.VIDEO, name: 'Video', icon: '🎬' },
  { id: MessageType.CODE, name: 'Code', icon: '💻' }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [currentTool, setCurrentTool] = useState<MessageType>(MessageType.TEXT);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ai_india_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedChats = localStorage.getItem(`ai_india_chats_${user.email}`);
      if (savedChats) {
        setSessions(JSON.parse(savedChats));
      } else {
        const newId = Date.now().toString();
        const initialSession = [{ id: newId, title: 'Initial Chat', messages: [], updatedAt: new Date() }];
        setSessions(initialSession);
        setCurrentSessionId(newId);
      }
    } else {
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`ai_india_chats_${user.email}`, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    const mesh = document.getElementById('mesh');
    if (mesh) mesh.className = `bg-mesh theme-${themes[currentThemeIndex].id}`;
  }, [currentThemeIndex]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [sessions, isStreaming, videoStatus]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('ai_india_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ai_india_session');
  };

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    setSessions(prev => [{ id: newId, title: 'New Conversation', messages: [], updatedAt: new Date() }, ...prev]);
    setCurrentSessionId(newId);
    setUploadedImage(null);
  }, []);

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setUploadedImage(null);
  };

  const addMessage = (role: Role, type: MessageType, content: string, metadata?: any) => {
    const newMessage: Message = { id: Date.now().toString(), role, type, content, timestamp: new Date(), metadata };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { 
      ...s, 
      messages: [...s.messages, newMessage], 
      updatedAt: new Date(),
      title: (s.messages.length === 0 && type === MessageType.TEXT) ? (content.length > 25 ? content.substring(0, 25) + '...' : content) : s.title
    } : s));
    return newMessage.id;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        if (currentTool !== MessageType.EDIT) setCurrentTool(MessageType.EDIT);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSessionId || isStreaming || !isOnline) return;

    const userText = inputValue.trim();
    const activeTool = currentTool;
    const sourceImg = uploadedImage;

    setInputValue('');
    setUploadedImage(null);
    addMessage(Role.USER, activeTool, userText, sourceImg ? { sourceImage: sourceImg } : undefined);

    if (activeTool === MessageType.TEXT || activeTool === MessageType.SEARCH || activeTool === MessageType.CODE) {
      setIsStreaming(true);
      const modelMessageId = addMessage(Role.MODEL, activeTool, "");
      let accumulatedText = "";
      try {
        const stream = sendMessageStream(currentSession?.messages || [], userText, activeTool === MessageType.SEARCH);
        for await (const chunk of stream) {
          accumulatedText += (chunk as any).text;
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return { ...s, messages: s.messages.map(m => m.id === modelMessageId ? { 
                ...m, 
                content: accumulatedText,
                metadata: { ...m.metadata, groundingChunks: (chunk as any).grounding }
              } : m) };
            }
            return s;
          }));
        }
      } catch (e) { console.error(e); } finally { setIsStreaming(false); }
    } 
    else if (activeTool === MessageType.IMAGE) {
      setIsStreaming(true);
      try {
        const imageUrl = await generateImage(userText);
        addMessage(Role.MODEL, MessageType.IMAGE, imageUrl, { prompt: userText });
      } catch (e) { addMessage(Role.MODEL, MessageType.TEXT, "Image generation failed."); } finally { setIsStreaming(false); }
    } 
    else if (activeTool === MessageType.EDIT) {
      if (!sourceImg) {
        addMessage(Role.MODEL, MessageType.TEXT, "Please upload an image first for editing.");
        return;
      }
      setIsStreaming(true);
      try {
        const editedUrl = await editImage(sourceImg.split(',')[1], userText);
        addMessage(Role.MODEL, MessageType.EDIT, editedUrl, { prompt: userText, sourceImage: sourceImg });
      } catch (e) { addMessage(Role.MODEL, MessageType.TEXT, "Editing failed."); } finally { setIsStreaming(false); }
    }
    else if (activeTool === MessageType.VIDEO) {
      if (!(await window.aistudio.hasSelectedApiKey())) await window.aistudio.openSelectKey();
      setIsStreaming(true);
      try {
        const videoUrl = await generateVideo(userText, setVideoStatus);
        addMessage(Role.MODEL, MessageType.VIDEO, videoUrl, { prompt: userText });
      } catch (e) { addMessage(Role.MODEL, MessageType.TEXT, "Video synthesis failed."); } finally { setIsStreaming(false); setVideoStatus(null); }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        audioChunksRef.current = [];
        mr.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
        mr.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
          const base64 = await new Promise<string>(r => {
            const reader = new FileReader();
            reader.onloadend = () => r((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
          });
          setIsTranscribing(true);
          const text = await transcribeAudio(base64, mr.mimeType);
          setInputValue(p => p ? p + ' ' + text : text);
          setIsTranscribing(false);
          stream.getTracks().forEach(t => t.stop());
        };
        mr.start();
        setIsRecording(true);
      } catch (e) { alert("Mic access denied."); }
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-transparent overflow-hidden text-gray-900 selection:bg-orange-100">
      <Sidebar 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onSelectSession={handleSelectSession} 
        onNewChat={handleNewChat}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col relative bg-white/20">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-gray-100/50 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 focus:outline-none"
              aria-label="Toggle Tools Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">Multimodal Agent</span>
              <span className="text-sm font-bold text-gray-700 truncate max-w-[150px] md:max-w-[250px]">{currentSession?.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setCurrentThemeIndex(p => (p + 1) % themes.length)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all text-xs border border-gray-200">
               <span>{themes[currentThemeIndex].icon}</span>
             </button>
             <div className={`hidden sm:flex px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-red-600 border-red-100 bg-red-50'}`}>
                {isOnline ? 'Online' : 'Offline'}
             </div>
             <button 
               onClick={handleLogout}
               className="md:hidden p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100"
               aria-label="Logout"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
             </button>
          </div>
        </header>

        {/* Tool Overlay Menu */}
        {isToolMenuOpen && (
          <div className="absolute top-16 left-4 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 min-w-[160px]">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-3 py-1">Functions</div>
              <div className="grid grid-cols-1 gap-0.5">
                {tools.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => {
                      setCurrentTool(t.id);
                      setIsToolMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-2.5 rounded-xl transition-all text-sm font-semibold ${currentTool === t.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
                <div className="h-px bg-gray-100 my-1 mx-2 md:hidden"></div>
                <button 
                  onClick={handleLogout}
                  className="md:hidden flex items-center w-full px-4 py-2.5 rounded-xl transition-all text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          {currentSession?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-10 animate-in fade-in zoom-in duration-1000">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative w-20 h-20 bg-white/80 backdrop-blur-xl rounded-3xl flex items-center justify-center text-4xl shadow-2xl border border-white/50">🇮🇳</div>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 bg-gradient-to-r from-orange-600 via-gray-800 to-emerald-600 bg-clip-text text-transparent">Namaste, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-500 text-xl max-w-md leading-relaxed">I am AI India Pro. Access visionary functions from the menu to start your journey.</p>
              <div className="mt-12 flex gap-4 flex-wrap justify-center opacity-60">
                <div className="px-4 py-2 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">Generation</div>
                <div className="px-4 py-2 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">Editing</div>
                <div className="px-4 py-2 rounded-full bg-white/50 border border-white/50 text-[10px] font-bold uppercase tracking-widest text-gray-400">Synthesis</div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full">
              {currentSession?.messages.map((m) => <ChatMessage key={m.id} message={m} />)}
              {(isStreaming || videoStatus) && (
                <div className="flex items-center gap-3 text-[10px] text-orange-600 font-bold uppercase tracking-widest ml-14 py-4 animate-pulse">
                  <span className="flex space-x-1">
                    <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  </span>
                  {videoStatus || "Generating response..."}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto">
            {uploadedImage && (
              <div className="mb-3 flex items-center gap-3 bg-orange-50 p-2.5 rounded-xl border border-orange-100 animate-in slide-in-from-bottom-2">
                <img src={uploadedImage} className="h-12 w-12 object-cover rounded-lg border border-white" alt="Upload" />
                <div className="flex-1">
                  <p className="text-[9px] font-bold uppercase text-orange-600">Editing Mode Active</p>
                  <p className="text-[11px] text-gray-600">Enter instructions to modify this photo.</p>
                </div>
                <button onClick={() => setUploadedImage(null)} className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            )}
            
            <div className="relative group">
              <div className="relative flex items-end gap-2 bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </button>
                <button onClick={toggleRecording} className={`p-3.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={currentTool === MessageType.EDIT ? "Modifications..." : `Using ${currentTool.toUpperCase()}...`}
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none py-3 text-sm font-medium h-auto max-h-32"
                />
                <button onClick={handleSend} disabled={!inputValue.trim() || isStreaming} className={`p-3.5 w-12 h-12 rounded-xl transition-all flex items-center justify-center ${inputValue.trim() && !isStreaming ? 'bg-gray-900 text-white shadow-md active:scale-95' : 'bg-gray-100 text-gray-300'}`}>
                  {isStreaming ? <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div> : <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}
                </button>
              </div>
            </div>
            <p className="text-center text-[9px] text-gray-400 mt-4 font-bold uppercase tracking-widest">Powered by AI India • Secured Local Storage</p>
          </div>
        </div>
      </main>
      
      {/* Click outside to close Tool Menu */}
      {isToolMenuOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsToolMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
