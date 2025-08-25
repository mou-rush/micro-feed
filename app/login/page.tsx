"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  validateAuth,
  validateField,
  createClientAuthSchema,
} from "@/lib/client-validation";

interface FormErrors {
  email?: string;
  password?: string;
  username?: string;
  general?: string;
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const supabase = createClient();

  const validateFormField = (
    field: "email" | "password" | "username",
    value: string
  ) => {
    const schema = createClientAuthSchema(isSignUp);
    const error = validateField(schema, field, value);

    setErrors((prev) => ({
      ...prev,
      [field]: error || undefined,
    }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateFormField("email", value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validateFormField("password", value);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (isSignUp) {
      validateFormField("username", value);
    }
  };

  const handleModeChange = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    if (!isSignUp) {
      if (username.trim()) {
        validateFormField("username", username);
      }
    } else {
      setErrors((prev) => {
        const { username, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = isSignUp
      ? { email, password, username: username.trim() }
      : { email, password };

    const validation = validateAuth(formData, isSignUp);

    if (!validation.success) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.user.email_confirmed_at) {
          alert("Check your email for verification link!");
          return;
        }

        if (data.user) {
          router.push("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrors({
        general: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== "general" && errors[key as keyof FormErrors]
  );
  const isFormValid =
    !hasFieldErrors &&
    email.trim() &&
    password.trim() &&
    (!isSignUp || username.trim());

  const signUpSignInButtonText = isSignUp ? "Sign Up" : "Sign In";

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary">Micro Feed</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className={`input pl-10 ${
                      errors.username
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    placeholder="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`input pl-10 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`input pl-10 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : signUpSignInButtonText}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleModeChange}
              className="text-primary hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
