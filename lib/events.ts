import { createEvent } from './utils'

export interface AuthState {
  session: any | null
  isAdmin: boolean
}

export const authStateChange = createEvent<AuthState>()

// Helper function to emit auth state change
export const emitAuthStateChange = (session: any | null, isAdmin: boolean) => {
  authStateChange.emit({ session, isAdmin })
} 
