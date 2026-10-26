import { supabase } from '@/lib/supabase';
import { Chat, ChatMember, Message, Profile, MessageType } from '@/types/database';

export async function findOrCreateDirectChat(userId: string, otherUserId: string): Promise<string | null> {
  const { data: existingMembers } = await supabase
    .from('chat_members')
    .select('chat_id')
    .eq('user_id', userId);

  if (!existingMembers || existingMembers.length === 0) {
    return await createDirectChat(userId, otherUserId);
  }

  const chatIds = existingMembers.map((m) => m.chat_id);

  const { data: otherMembers } = await supabase
    .from('chat_members')
    .select('chat_id')
    .eq('user_id', otherUserId)
    .in('chat_id', chatIds);

  if (otherMembers && otherMembers.length > 0) {
    const { data: chat } = await supabase
      .from('chats')
      .select('*')
      .eq('id', otherMembers[0].chat_id)
      .eq('type', 'direct')
      .maybeSingle();
    if (chat) return chat.id;
  }

  return await createDirectChat(userId, otherUserId);
}

async function createDirectChat(userId: string, otherUserId: string): Promise<string | null> {
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({ type: 'direct', created_by: userId })
    .select()
    .single();
  if (chatError || !chat) return null;

  const { error: memberError } = await supabase
    .from('chat_members')
    .insert([
      { chat_id: chat.id, user_id: userId },
      { chat_id: chat.id, user_id: otherUserId },
    ]);
  if (memberError) return null;

  return chat.id;
}

export async function getUserChats(userId: string) {
  const { data: memberships } = await supabase
    .from('chat_members')
    .select('chat_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) return [];

  const chatIds = memberships.map((m) => m.chat_id);

  const { data: chats } = await supabase
    .from('chats')
    .select('*')
    .in('id', chatIds)
    .order('created_at', { ascending: false });

  if (!chats) return [];

  const result = [];
  for (const chat of chats as Chat[]) {
    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chat.id);

    const memberUserIds = (members as ChatMember[] | null)?.map((m) => m.user_id) || [];

    const otherUserId = memberUserIds.find((id) => id !== userId);

    let otherProfile: Profile | null = null;
    if (otherUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .maybeSingle();
      otherProfile = profile as Profile | null;
    }

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    result.push({
      ...chat,
      members: members || [],
      other_member: otherProfile,
      last_message: lastMsg as Message | null,
    });
  }

  result.sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return result;
}

export async function getChatMessages(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) return [];
  return data as Message[];
}

export async function getChatMembers(chatId: string) {
  const { data, error } = await supabase
    .from('chat_members')
    .select('user_id')
    .eq('chat_id', chatId);
  if (error || !data) return [];
  return data as ChatMember[];
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string | null,
  messageType: MessageType,
  media?: {
    media_url?: string;
    media_name?: string;
    media_size?: number;
    media_duration?: number;
    location_lat?: number;
    location_lng?: number;
  }
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
      message_type: messageType,
      ...media,
    })
    .select()
    .single();
  if (error) console.error('Send message error:', error);
  return data as Message | null;
}

export async function searchUserByPhone(phone: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phone)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function searchUsersByName(query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .limit(20);
  if (error) return [];
  return data as Profile[];
}
