/**
 * Register page
 */
"use client";

import { useStore } from "@/lib/store";
import { Bot, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BackgroundBeams } from "@/components/ui/background-beams";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const handleRegister = useStore((state) => state.handleRegister);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  const validateForm = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email address";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);

    try {
      await handleRegister({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      toast.success("Account created successfully!");
      router.push("/chat");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 relative flex flex-col items-center justify-center p-4 overflow-hidden antialiased">
      <BackgroundBeams className="opacity-50" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              DosiBridge Agent
            </span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">
            Create account
          </h1>
          <p className="text-zinc-400 text-sm">
            Get started with your personal AI agent
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                helperText="Must be at least 8 characters long"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-zinc-400">Already have an account? </span>
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
