export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;

  profiles?: Profile;
  likes?: Like[];
  like_count?: number;
  is_liked?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostWithDetails extends Post {
  profiles: Profile;
  like_count: number;
  is_liked: boolean;
}
