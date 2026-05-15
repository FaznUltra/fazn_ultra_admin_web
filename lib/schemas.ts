import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['player', 'admin']),
  email_verified: z.boolean(),
  auth_provider: z.enum(['local', 'google', 'apple']),
  balance: z.string().optional(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const GameSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string(),
  platforms: z.array(z.string()),
  thumbnail_url: z.string().nullable(),
  score_type: z.enum(['numeric', 'win_loss', 'time']),
  active: z.boolean(),
  created_by: z.string().nullable(),
  created_at: z.string(),
});

export const GameOptionsSchema = z.object({
  categories: z.array(z.string()),
  platforms: z.array(z.string()),
  scoreTypes: z.array(z.string()),
});

export const GamesListResponseSchema = z.object({ games: z.array(GameSchema) });
export const GameResponseSchema = z.object({ game: GameSchema });

export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Game = z.infer<typeof GameSchema>;
export type GameOptions = z.infer<typeof GameOptionsSchema>;
export type CreateGameInput = {
  name: string;
  category: string;
  platforms: string[];
  scoreType: 'numeric' | 'win_loss' | 'time';
};
