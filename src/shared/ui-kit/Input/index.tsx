import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed dark:bg-[#111111] dark:text-gray-300 dark:placeholder:text-gray-600",
  {
    variants: {
      variant: {
        default:
          "border-gray-200 hover:border-gray-300 focus-visible:border-gray-900 focus-visible:ring-gray-900/20 dark:border-gray-700 dark:hover:border-gray-600 dark:focus-visible:border-gray-400 dark:focus-visible:ring-gray-400/20",
        error:
          "border-[#ee0000] text-gray-700 focus-visible:border-[#ee0000] focus-visible:ring-[#ee0000]/20 dark:text-gray-300",
        disabled:
          "border-gray-200 bg-gray-50 text-gray-400 placeholder:text-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600 dark:placeholder:text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "disabled">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, variant, type = "text", label, error, helperText, disabled, id, ...props },
    ref
  ) => {
    const inputId = id || React.useId();
    const resolvedVariant = disabled ? "disabled" : error ? "error" : variant;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(inputVariants({ variant: resolvedVariant, className }))}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#ee0000]">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-gray-400 dark:text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
