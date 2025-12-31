export type User = {
  id: string;
  email: string;
  name?: string;
  profile?: string;
};

export type DecodedToken = {
  sub: string;
  email: string;
  exp: number;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};
