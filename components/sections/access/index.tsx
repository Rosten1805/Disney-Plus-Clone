"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Button from "../../elements/button";

type Mode = "sign-in" | "register";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.27-2.09 3.58-5.17 3.58-8.84Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.76-2.11-6.71-4.94H1.27v3.11A11.996 11.996 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29V6.6H1.27A12 12 0 0 0 0 12c0 1.93.46 3.76 1.27 5.4l4.02-3.11Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.6l4.02 3.11C6.24 6.88 8.88 4.77 12 4.77Z"
    />
  </svg>
);

const Access = () => {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verified = new URLSearchParams(window.location.search).get(
      "verified"
    );
    if (verified === "1") {
      setNotice("Email confirmed — you can sign in now");
    } else if (verified === "0") {
      setError("That confirmation link is invalid or has expired");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPreviewUrl(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Could not create the account");
          return;
        }

        setNotice(data.message ?? "Check your email to confirm your account");
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
        setMode("sign-in");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Incorrect email or password"
            : result.error
        );
        return;
      }

      window.location.href = "/";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto mb-12 w-full max-w-lg space-y-6 px-6">
      <div className="relative mx-auto aspect-video w-1/2">
        <Image
          src="/assets/images/disney-plus-logo.png"
          alt="Disney Logo"
          fill
          sizes="500px"
          priority
          className="object-contain"
        />
      </div>
      <h1 className="text-center font-bold tablet:text-2xl">
        Home of your favorite stories
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" ? (
          <input
            required
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded bg-action-dark px-4 py-3 text-sm text-typography-light outline-none"
          />
        ) : null}
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded bg-action-dark px-4 py-3 text-sm text-typography-light outline-none"
        />
        <input
          required
          type="password"
          placeholder="Password"
          minLength={mode === "register" ? 8 : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded bg-action-dark px-4 py-3 text-sm text-typography-light outline-none"
        />

        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        {notice ? <p className="text-xs text-green-400">{notice}</p> : null}
        {previewUrl ? (
          <p className="text-xs opacity-fade">
            No SMTP configured — preview the confirmation email{" "}
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="underline">
              here
            </a>
            .
          </p>
        ) : null}

        <Button variant={{ name: "secondary" }} isFull>
          {isSubmitting
            ? "Please wait..."
            : mode === "sign-in"
              ? "Sign In"
              : "Create Account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 opacity-fade">
        <div className="h-px flex-1 bg-typography-light" />
        <span className="text-xs">or</span>
        <div className="h-px flex-1 bg-typography-light" />
      </div>

      <Button
        variant={{ name: "secondary" }}
        isFull
        onClick={() => signIn("google")}>
        <span className="inline-flex items-center gap-2">
          <GoogleIcon />
          Continue with Google
        </span>
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "register" : "sign-in");
          setError(null);
          setNotice(null);
          setPreviewUrl(null);
        }}
        className="block w-full text-center text-xs underline opacity-fade">
        {mode === "sign-in"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>

      <p className="text-center text-ms font-bold">
        Created by: Cristina Cañadas Gómez - Limón
      </p>
    </section>
  );
};

export default Access;
