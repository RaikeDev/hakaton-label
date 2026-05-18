import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(role: "artist" | "admin") {
    setEmail(role === "artist" ? "artist@kamik.ru" : "admin@kamik.ru");
    setPassword(role === "artist" ? "artist123" : "admin123");
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "#08080E", color: "#E5E7EB" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-base tracking-wider">K</span>
          </div>
          <div>
            <div className="text-white font-bold text-xl leading-none">KAMIK</div>
            <div className="text-[#6B7280] text-xs mt-0.5">Label Portal</div>
          </div>
        </div>

        <div className="rounded-2xl p-6 border border-[#1E1E35] bg-[#0D0D1A]">
          <h1 className="text-white font-semibold text-lg mb-6 text-center">Войти в систему</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#9CA3AF] text-sm block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#131320] border border-[#1E1E35] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors"
                placeholder="artist@kamik.ru"
              />
            </div>
            <div>
              <label className="text-[#9CA3AF] text-sm block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#131320] border border-[#1E1E35] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          {/* Quick login buttons for demo */}
          <div className="mt-5 pt-4 border-t border-[#1E1E35]">
            <p className="text-[#4B5563] text-xs text-center mb-3">Быстрый вход для демо</p>
            <div className="flex gap-2">
              <button
                onClick={() => quickLogin("artist")}
                className="flex-1 text-xs bg-[#131320] border border-[#1E1E35] hover:border-violet-500 text-[#9CA3AF] hover:text-white rounded-lg py-2 transition-colors"
              >
                Артист MAKO
              </button>
              <button
                onClick={() => quickLogin("admin")}
                className="flex-1 text-xs bg-[#131320] border border-[#1E1E35] hover:border-emerald-500 text-[#9CA3AF] hover:text-white rounded-lg py-2 transition-colors"
              >
                Админ лейбла
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
