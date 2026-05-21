import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import "../auth.css";

type LoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") ?? "null");
      if (user?.id && user?.username) navigate("/", { replace: true });
    } catch {
      localStorage.removeItem("user");
    }
  }, [navigate]);

  async function onSubmit(data: LoginForm) {
    try {
      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Login failed", description: body.message || "Invalid credentials" });
        return;
      }

      localStorage.setItem("user", JSON.stringify(body));
      toast({ title: "Login successful" });
      navigate(from, { replace: true });
    } catch (e) {
      toast({ title: "Login error", description: String(e) });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">
              <img src="/SOl9X Logo.svg" alt="" />
            </span>
            <div>
              <span className="auth-brand-name">ARGUS</span>
            </div>
          </div>
          <div className="auth-panel-copy">
            <h1>Welcome back</h1>
            <p>Access the dashboard and monitor trends, alerts, and social activity with one secure login.</p>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-card-header">
              <h2>Login</h2>
              <p>Sign in to access your account and continue monitoring social media activity.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="auth-field">
                <Label>Username</Label>
                <Input {...register("username")} />
              </div>
              <div className="auth-field">
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
              </div>
              <div className="auth-actions">
                <Button type="submit" size="lg" className="auth-submit">Login</Button>
                <Button variant="ghost" size="lg" className="auth-link" onClick={() => navigate("/signup")}>Sign up</Button>
              </div>
              <p className="auth-note">Don’t have an account? Create one to begin monitoring in minutes.</p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
