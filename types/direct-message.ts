export type DirectConversation = {
  id: string;
  participantOne: string;
  participantTwo: string;
  createdAt: string;
  updatedAt: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export const DIRECT_MESSAGE_MAX_LENGTH = 2000;
