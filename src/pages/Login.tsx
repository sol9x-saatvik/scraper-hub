import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function onSubmit(data: any) {
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
      navigate("/");
    } catch (e) {
      toast({ title: "Login error", description: String(e) });
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input {...register("username")} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
        </div>
        <div className="flex items-center justify-between">
          <Button type="submit">Login</Button>
          <Button variant="ghost" onClick={() => navigate("/signup")}>Sign up</Button>
        </div>
      </form>
    </div>
  );
}
