import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import "../auth.css";

export default function Signup() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function onSubmit(data: any) {
    try {
      const res = await fetch("http://localhost:8081/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, email: data.email, password: data.password }),
      });

      const body = await res.json();
      if (!res.ok) {
        toast({ title: "Signup failed", description: body.message || "Could not create account" });
        return;
      }

      toast({ title: "Signup successful" });
      navigate("/login");
    } catch (e) {
      toast({ title: "Signup error", description: String(e) });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-brand">
            <span className="auth-brand-icon">S</span>
            <div>
              <span>SCRAPER HUB</span>
            </div>
          </div>
          <div className="auth-panel-copy">
            <h1>Create your account</h1>
            <p>Register now to start tracking social conversations, generate alerts, and analyze trends instantly.</p>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-card-header">
              <h2>Sign up</h2>
              <p>Set up your account and join the dashboard to monitor feeds across multiple channels.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="auth-field">
                <Label>Username</Label>
                <Input {...register("username")} />
              </div>
              <div className="auth-field">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="auth-field">
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
              </div>
              <div className="auth-actions">
                <Button type="submit" size="lg" className="auth-submit">Create account</Button>
                <Button variant="ghost" size="lg" className="auth-link" onClick={() => navigate("/login")}>Login</Button>
              </div>
              <p className="auth-note">Already have an account? Use the login link to return to the portal.</p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
