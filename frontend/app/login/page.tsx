'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { ErrorBanner, inputClass, labelClass, primaryButtonClass } from '@/components/ui';
import { ApiError, login } from '@/lib/api';

/** Email and password sign-in. The session lives in an HttpOnly cookie set by the API. */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof ApiError && err.status === 401
          ? "That email and password don't match. Try again."
          : err instanceof ApiError
            ? err.message
            : "Couldn't reach Daily Path. Check your connection and try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Your next step is waiting."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-extrabold text-ink hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={isLoading} className={`${primaryButtonClass} w-full py-3`}>
          {isLoading ? 'Signing in…' : "Let's go"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </AuthShell>
  );
}
