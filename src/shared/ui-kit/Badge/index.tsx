import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-4 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-white dark:bg-white dark:text-gray-900",
        secondary:
          "border-transparent bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]",
        outline:
          "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
        success:
          "border-transparent bg-[#D1FAE5] text-[#065F46] dark:bg-[#064E3B]/40 dark:text-[#6EE7B7]",
        warning:
          "border-transparent bg-[#FEF3C7] text-[#92400E] dark:bg-[#78350F]/40 dark:text-[#FCD34D]",
        danger:
          "border-transparent bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/40 dark:text-[#FCA5A5]",
        info:
          "border-transparent bg-[#DBEAFE] text-[#1E40AF] dark:bg-[#1E3A8A]/40 dark:text-[#93C5FD]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
