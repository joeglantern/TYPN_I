import { Loader2, type LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends Omit<LucideProps, 'ref'> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} {...props} />
  )
} 