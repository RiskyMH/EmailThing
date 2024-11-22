"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type * as React from "react";

import { cn } from "@/utils/tw";

const Avatar = ({
    ref,
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    ref?: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Root>>;
}) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
    />
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = ({
    ref,
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    ref?: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Image>>;
}) => <AvatarPrimitive.Image ref={ref} className={cn("aspect-square size-full", className)} {...props} />;
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = ({
    ref,
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    ref?: React.RefObject<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
}) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            "flex size-full items-center justify-center rounded-full bg-secondary text-secondary-foreground",
            className,
        )}
        {...props}
    />
);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
