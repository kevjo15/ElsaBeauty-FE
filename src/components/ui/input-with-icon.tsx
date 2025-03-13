import React from "react";
import { cn } from "@/lib/utils";

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ icon, className, iconClassName, containerClassName, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          containerClassName
        )}
      >
        {icon && (
          <div className={cn("mr-2 flex items-center", iconClassName)}>
            {icon}
          </div>
        )}
        <input
          className={cn(
            "flex w-full bg-transparent p-0 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };
