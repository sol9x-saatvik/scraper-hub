import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Sign up</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input {...register("username")} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" {...register("email")} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" {...register("password")} />
        </div>
        <div className="flex items-center justify-between">
          <Button type="submit">Create account</Button>
          <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
        </div>
      </form>
    </div>
  );
}
