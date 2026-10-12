'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import { ErrorBanner, inputClass, labelClass, primaryButtonClass } from '@/components/ui';
import { ApiError, register } from '@/lib/api';

// Matches the API's Identity password policy.
const MIN_PASSWORD_LENGTH = 12;

/** Account creation; signs the user in right after. */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register(email, password, name);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach Daily Path. Check your connection and try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Start your path"
      subtitle="Big goals, broken into one clear step at a time."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div>
          <label htmlFor="register-name" className={labelClass}>
            Your name
          </label>
          <input
            id="register-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-email" className={labelClass}>
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className={labelClass}>
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="register-password-hint"
            className={inputClass}
          />
          <p id="register-password-hint" className="mt-1.5 text-xs text-ink-muted">
            At least {MIN_PASSWORD_LENGTH} characters. A short phrase works great.
          </p>
        </div>

        <button type="submit" disabled={isLoading} className={`${primaryButtonClass} w-full py-3`}>
          {isLoading ? 'Setting things up…' : 'Create my account'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </AuthShell>
  );
}
