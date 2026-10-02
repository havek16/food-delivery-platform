import { forwardRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

type BaseProps = {
  label?: string;
  error?: string;
  hint?: string;
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, type, ...rest },
  ref
) {
  const [show, setShow] = useState(false);
  const inputId = id ?? `field-${label?.toLowerCase().replace(/\W+/g, "-") ?? Math.random().toString(36).slice(2)}`;
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          data-invalid={error ? "true" : "false"}
          className={`glass-input pr-10 ${className ?? ""}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink/50">{hint}</p>
      ) : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const inputId = id ?? `field-${label?.toLowerCase().replace(/\W+/g, "-") ?? Math.random().toString(36).slice(2)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        data-invalid={error ? "true" : "false"}
        className={`glass-input min-h-[96px] resize-y ${className ?? ""}`}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink/50">{hint}</p>
      ) : null}
    </div>
  );
});