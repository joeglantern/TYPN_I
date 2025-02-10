"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Menu,
  Home,
  Book,
  Calendar,
  Edit,
  Image as ImageIcon,
  MessageCircle,
  BarChart,
  Info,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const links = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/programs', label: 'Programs', Icon: Book },
  { href: '/events', label: 'Events', Icon: Calendar },
  { href: '/blog', label: 'Blog', Icon: Edit },
  { href: '/gallery', label: 'Gallery', Icon: ImageIcon },
  { href: '/chat', label: 'Chat', Icon: MessageCircle },
  { href: '/polls', label: 'Polls', Icon: BarChart },
  { href: '/about', label: 'About', Icon: Info },
  { href: '/contact', label: 'Contact', Icon: Mail },
]

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Prefetch all links when component mounts
  React.useEffect(() => {
    links.forEach((link) => {
      router.prefetch(link.href)
    })
  }, [router])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex h-14 items-center justify-between px-4 border-b">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="TYPNI Logo"
            width={32}
            height={32}
            className="animate-float"
            priority
          />
          <span className="font-bold">TYPNI</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
        </div>
      </div>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] pr-0">
        <SheetHeader className="px-6 border-b pb-4 mb-4">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={40}
              height={40}
              className="animate-float"
              priority
            />
            <SheetTitle>TYPNI</SheetTitle>
          </Link>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-2">
            <div className="space-y-1">
              {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-base rounded-md transition-colors",
                    pathname === link.href 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent"
                  )}
                >
                  <link.Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="border-t mt-auto p-4">
            <Button className="w-full" asChild>
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 