
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  CODE = 'code',
  EDIT = 'edit',
  SEARCH = 'search'
}

export interface User {
  email: string;
  name: string;
  password?: string;
}

export interface Message {
  id: string;
  role: Role;
  type: MessageType;
  content: string; // text or base64/url for media
  timestamp: Date;
  metadata?: {
    prompt?: string;
    status?: 'pending' | 'completed' | 'failed';
    thumbnail?: string;
    sourceImage?: string;
    groundingChunks?: any[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}
