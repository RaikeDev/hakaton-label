import axios from "axios";
import { Lock, Mail } from "lucide-react";
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
      if (!error.response) {
        return "Не удалось подключиться к серверу. Проверьте адрес API и CORS.";
      }
    }

    return "Не удалось выполнить вход. Повторите попытку.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
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
    <main className="min-h-screen bg-[#0B0D12] text-[#E7EAF0]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] items-center justify-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-lg border border-[#202633] bg-[#10141D] shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:grid-cols-[1fr_420px]">
          <div className="hidden border-r border-[#202633] bg-[#0E1118] p-10 md:flex md:flex-col md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2A3242] bg-[#151B26] text-sm font-bold text-white">
                K
              </div>
              <div>
                <div className="text-base font-semibold leading-none text-white">KAMIK</div>
                <div className="mt-1 text-xs text-[#8B93A3]">Label Portal</div>
              </div>
            </div>

            <div className="max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8B93A3]">
                Рабочий кабинет
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">
                Отчеты, выплаты и каталог лейбла в одном интерфейсе
              </h1>
              <p className="mt-4 text-sm leading-6 text-[#A5ADBA]">
                Доступ для артистов и команды лейбла с разделением ролей и операций.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-[#8B93A3]">
              <div className="rounded-md border border-[#202633] bg-[#111722] px-3 py-2">Роялти</div>
              <div className="rounded-md border border-[#202633] bg-[#111722] px-3 py-2">Каталог</div>
              <div className="rounded-md border border-[#202633] bg-[#111722] px-3 py-2">Выплаты</div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2A3242] bg-[#151B26] text-sm font-bold text-white">
                K
              </div>
              <div>
                <div className="text-base font-semibold leading-none text-white">KAMIK</div>
                <div className="mt-1 text-xs text-[#8B93A3]">Label Portal</div>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-xl font-semibold text-white">Вход</h2>
              <p className="mt-2 text-sm text-[#8B93A3]">Используйте рабочий email и пароль.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#B5BCC9]">Email</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#586173] focus:border-[#4B8BFF]"
                    placeholder="artist@kamik.ru"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#B5BCC9]">Пароль</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 w-full rounded-md border border-[#2A3242] bg-[#0B0F16] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-[#586173] focus:border-[#4B8BFF]"
                    placeholder="Введите пароль"
                  />
                </span>
              </label>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-[#2F6FED] text-sm font-semibold text-white transition-colors hover:bg-[#3D7EFF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Вход..." : "Войти"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#202633] pt-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#747D8C]">
                Демо-доступ
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quickLogin("artist")}
                  disabled={loading}
                  className="h-10 rounded-md border border-[#2A3242] bg-[#111722] text-xs font-medium text-[#C5CBD6] transition-colors hover:border-[#3A465C] hover:bg-[#151D2A] disabled:opacity-50"
                >
                  Артист
                </button>
                <button
                  onClick={() => quickLogin("admin")}
                  disabled={loading}
                  className="h-10 rounded-md border border-[#2A3242] bg-[#111722] text-xs font-medium text-[#C5CBD6] transition-colors hover:border-[#3A465C] hover:bg-[#151D2A] disabled:opacity-50"
                >
                  Админ
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
