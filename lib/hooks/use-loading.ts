'use client'

import { useContext } from 'react'
import { LoadingContext } from '@/app/client-layout'

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export const withLoading = async <T,>(
  promise: Promise<T>,
  setLoading: (loading: boolean) => void
): Promise<T> => {
  try {
    setLoading(true)
    return await promise
  } finally {
    setLoading(false)
  }
} 