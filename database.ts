export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file' | 'location';
export type ChatType = 'direct' | 'group';
export type CallType = 'voice' | 'video';
export type CallStatus = 'completed' | 'missed' | 'declined' | 'failed';

export interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  phone_number: string | null;
  country_code: string;
  bio: string;
  avatar_url: string | null;
  last_seen: string;
  is_online: boolean;
  created_at: string;
  email: string | null;
  email_verified: boolean;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string | null;
  display_name: string;
  phone_number: string | null;
  country_code: string;
  created_at: string;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string | null;
  created_by: string;
  created_at: string;
}

export interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  media_duration: number | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export interface CallRecord {
  id: string;
  chat_id: string | null;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  duration: number | null;
  created_at: string;
}

export interface ChatWithDetails extends Chat {
  members: ChatMember[];
  last_message?: Message | null;
  other_member?: Profile | null;
}

export interface MessageWithSender extends Message {
  sender?: Profile | null;
}
