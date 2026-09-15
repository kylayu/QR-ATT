import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = true;

const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

let initialized = false;

async function initializeAuth() {
  if (initialized) return;

  initialized = true;
  globalLoading = true;
  notify();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to get Supabase session:', error);
    globalSession = null;
    globalUser = null;
  } else {
    globalSession = data.session;
    globalUser = data.session?.user ?? null;
  }

  globalLoading = false;
  notify();
}

supabase.auth.onAuthStateChange((_event, session) => {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;

  notify();
});

initializeAuth();

export function setAuth(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;

  notify();
}

export function useAuth(): AuthState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => {
      forceRender((n) => n + 1);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
  };
}

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profile?.full_name ?? '',
        role: profile?.role ?? 'student',
      },
    },
  });

  if (error) {
    return { data, error };
  }

  if (data.session && profile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        role: profile.role,
      })
      .eq('id', data.session.user.id);

    if (profileError) {
      console.error(
        'Profile update failed:',
        profileError.message
      );
    }
  }

  if (data.session) {
    setAuth(data.session);
  }

  return { data, error };
}

export async function signIn(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (!error && data.session) {
    setAuth(data.session);
  }

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (!error) {
    setAuth(null);
  }

  return { error };
}