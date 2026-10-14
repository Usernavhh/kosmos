import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './SupabaseClient';

export interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  language?: string;
  level?: string;
}

export class AuthManager {
  private user: User | null = null;
  private session: Session | null = null;
  private profile: UserProfile | null = null;
  private listeners: ((user: User | null, profile: UserProfile | null) => void)[] = [];

  async init(): Promise<void> {
    // Joriy sessiyani olish
    const { data } = await supabase.auth.getSession();
    this.session = data.session;
    this.user = data.session?.user ?? null;

    if (this.user) {
      await this.loadProfile();
    }

    // Auth o'zgarishlarini eshitish
    supabase.auth.onAuthStateChange(async (_event, session) => {
      this.session = session;
      this.user = session?.user ?? null;

      if (this.user) {
        await this.loadProfile();
      } else {
        this.profile = null;
      }

      this.notify();
    });
  }

  private async loadProfile() {
    if (!this.user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error) {
        console.warn('[auth] Profil yuklanmadi:', error.message);
        return;
      }
      this.profile = data as UserProfile;
    } catch (e) {
      console.warn('[auth] Profil xatosi:', e);
    }
  }

  private notify() {
    for (const cb of this.listeners) cb(this.user, this.profile);
  }

  onChange(cb: (user: User | null, profile: UserProfile | null) => void) {
    this.listeners.push(cb);
    cb(this.user, this.profile);
  }

  getUser(): User | null {
    return this.user;
  }

  getProfile(): UserProfile | null {
    return this.profile;
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  /** Email va parol bilan kirish */
  async signInWithEmail(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  }

  /** Email va parol bilan ro'yxatdan o'tish */
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw new Error(error.message);
  }

  /** Google orqali kirish */
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  }

  /** Chiqish */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.user = null;
    this.session = null;
    this.profile = null;
    this.notify();
  }

  /** Profilni yangilash */
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.user) throw new Error('Kirish kerak');
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', this.user.id);
    if (error) throw new Error(error.message);
    await this.loadProfile();
    this.notify();
  }
}