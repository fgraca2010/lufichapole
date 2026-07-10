"use client";

import { useState } from "react";

export function CampoSenha({
  id,
  name,
  label,
  autoComplete,
  required = true,
  placeholder,
}: {
  id?: string;
  name: string;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id ?? name} className="text-sm font-medium text-terciaria">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id ?? name}
          name={name}
          type={visivel ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-md border border-terciaria/30 px-3 py-2 pr-16"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-2 flex items-center px-2 text-xs font-medium text-terciaria underline"
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
        >
          {visivel ? "Esconder" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}
