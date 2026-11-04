"use client";

import { useActionState } from "react";
import { signInAdmin, type LoginState } from "../actions";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAdmin, initial);
  return (
    <form action={formAction} className="form">
      {state.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
