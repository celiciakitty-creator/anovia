export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  githubHandle: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileInput = {
  displayName: string;
  githubHandle: string;
  avatarUrl: string;
};
