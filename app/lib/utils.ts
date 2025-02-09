import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function compressImage(file: File, options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
}) {
  const imageCompression = (await import('browser-image-compression')).default
  return imageCompression(file, options)
} 