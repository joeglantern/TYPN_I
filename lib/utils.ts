import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type EventCallback<T> = (data: T) => void

export class EventEmitter<T> {
  private listeners: EventCallback<T>[] = []

  emit(data: T) {
    this.listeners.forEach(listener => listener(data))
  }

  subscribe(callback: EventCallback<T>) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }
}

export function createEvent<T>() {
  return new EventEmitter<T>()
}