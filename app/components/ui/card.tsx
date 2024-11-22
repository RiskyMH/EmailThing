import type * as React from "react";

import { cn } from "@/utils/tw";

const Card = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.RefObject<HTMLDivElement>;
}) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
);
Card.displayName = "Card";

const CardHeader = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.RefObject<HTMLDivElement>;
}) => <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
CardHeader.displayName = "CardHeader";

const CardTitle = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
    ref?: React.RefObject<HTMLParagraphElement>;
}) => <h3 ref={ref} className={cn("font-semibold text-2xl leading-none tracking-tight", className)} {...props} />;
CardTitle.displayName = "CardTitle";

const CardDescription = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
    ref?: React.RefObject<HTMLParagraphElement>;
}) => <p ref={ref} className={cn("text-muted-foreground text-sm", className)} {...props} />;
CardDescription.displayName = "CardDescription";

const CardContent = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.RefObject<HTMLDivElement>;
}) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
CardContent.displayName = "CardContent";

const CardFooter = ({
    ref,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.RefObject<HTMLDivElement>;
}) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
