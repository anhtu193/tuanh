"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "w-full rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-foreground/40";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Could not log in");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not log in");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        Username
        <input
          className={fieldClass}
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Password
        <input
          className={fieldClass}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-foreground/70">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md border border-foreground/20 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40 disabled:opacity-50"
      >
        {pending ? "Checking..." : "Login"}
      </button>
    </form>
  );
}
