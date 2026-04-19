import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { loginUser } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && session) navigate("/dashboard", { replace: true });
  }, [session, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const raw = err.message || "Login gagal";
      const msg =
        raw === "Invalid login credentials"
          ? "Email atau password salah"
          : raw === "Email not confirmed"
          ? "Email belum dikonfirmasi. Cek inbox Anda."
          : raw;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-card">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dvdtjfcgg/image/upload/v1771552062/logo_dolan_sawah_e5ue30.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="font-bold text-xl text-foreground">Fa-NumTX</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Log in</h1>
            <p className="text-muted-foreground text-sm mt-1">Silakan Log in dengan Email dan Password yang Benar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div className="relative">
              <Icon icon="mdi:email-outline" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="relative">
              <Icon icon="mdi:lock-outline" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[hsl(239,84%,67%)] to-[hsl(271,81%,56%)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />}
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Right — Cover Image (desktop only) */}
      <div className="hidden lg:block lg:flex-1">
        <img
          src="https://res.cloudinary.com/dvdtjfcgg/image/upload/v1771552062/view_sqgj8j.jpg"
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
