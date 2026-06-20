/**
 * 버튼 컴포넌트 — Ritual UI Kit 스타일 적용.
 */
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // ritual-button 베이스 + 공통 속성
  "ritual-button inline-flex items-center justify-center gap-2 whitespace-nowrap text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "primary",
        destructive: "danger",
        outline:     "",              // 베이스 그대로
        secondary:   "",
        ghost:       "ghost",
        link:        "!border-none !bg-transparent !shadow-none text-primary underline-offset-4 hover:underline hover:!transform-none",
      },
      size: {
        default: "h-10 px-4",
        sm:      "h-8 px-3 text-[15px]",
        lg:      "h-12 px-7 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
