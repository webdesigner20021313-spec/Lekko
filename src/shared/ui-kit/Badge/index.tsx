import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-4 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-white",
        secondary:
          "border-transparent bg-[#DBEAFE] text-[#1E40AF]",
        outline:
          "border-gray-200 bg-white text-gray-700",
        success:
          "border-transparent bg-[#D1FAE5] text-[#065F46]",
        warning:
          "border-transparent bg-[#FEF3C7] text-[#92400E]",
        danger:
          "border-transparent bg-[#FEE2E2] text-[#991B1B]",
        info:
          "border-transparent bg-[#DBEAFE] text-[#1E40AF]",
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
