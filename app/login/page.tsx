"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email və ya şifrə səhvdir");
      setLoading(false);
      return;
    }

    // Admin yoxsa adi üzv?
    const role = data.user?.app_metadata?.role;
    if (role === "admin") {
      router.push("/crm");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Natoure CRM</h1>
          <p className="text-gray-400 text-sm mt-1">Admin panelə daxil ol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="admin@natoure.az"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Şifrə</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Yüklənir..." : "Daxil ol"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-2">
            Hələ üzv deyilsiniz?{" "}
            <Link href="/qeydiyyat" className="text-blue-400 hover:text-blue-300 font-medium">
              Qeydiyyat
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
