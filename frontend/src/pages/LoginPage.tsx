import axios from "axios";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resolveLoginError(error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) return "Неверный email или пароль";
      if (!error.response) return "Не удалось подключиться к backend. Проверьте адрес API и CORS.";
    }

    return "Не удалось выполнить вход. Повторите попытку.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password.trim());
    } catch (error) {
      setError(resolveLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(role: "artist" | "admin") {
    const demoEmail = role === "artist" ? "artist@kamik.ru" : "admin@kamik.ru";
    const demoPassword = role === "artist" ? "artist123" : "admin123";

    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (error) {
      setError(resolveLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen relative overflow-hidden"
      style={{ background: "#06050F", color: "#E5E7EB" }}
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-fuchsia-600/6 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.45)]">
            <span className="text-white font-black text-base tracking-wider">K</span>
          </div>
          <div>
            <div className="text-white font-bold text-xl leading-none tracking-wide">KAMIK</div>
            <div className="text-[#6C6890] text-xs mt-0.5">Label Portal</div>
          </div>
        </div>

        <div className="rounded-2xl p-6 border border-[#1C1A3B] bg-[#09071C] shadow-[0_0_40px_rgba(139,92,246,0.08)]">
          <h1 className="text-white font-semibold text-lg mb-6 text-center">Войти в систему</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[#9B98BC] text-sm block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F0D22] border border-[#1C1A3B] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors"
                placeholder="artist@kamik.ru"
              />
            </div>
            <div>
              <label className="text-[#9B98BC] text-sm block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0F0D22] border border-[#1C1A3B] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#1C1A3B]">
            <p className="text-[#4A4469] text-xs text-center mb-3">Быстрый вход для демо</p>
            <div className="flex gap-2">
              <button
                onClick={() => quickLogin("artist")}
                disabled={loading}
                className="flex-1 text-xs bg-[#0F0D22] border border-[#1C1A3B] hover:border-violet-500 text-[#9B98BC] hover:text-white rounded-lg py-2 transition-colors disabled:opacity-50"
              >
                Артист MAKO
              </button>
              <button
                onClick={() => quickLogin("admin")}
                disabled={loading}
                className="flex-1 text-xs bg-[#0F0D22] border border-[#1C1A3B] hover:border-emerald-500 text-[#9B98BC] hover:text-white rounded-lg py-2 transition-colors disabled:opacity-50"
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
