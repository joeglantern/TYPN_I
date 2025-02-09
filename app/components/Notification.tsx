'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  created_at: string
}

export function NotificationComponent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, payload => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [...prev, newNotification])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchNotifications() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  if (!visible || notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`
              flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-[500px]
              ${notification.type === 'info' && 'bg-blue-500 text-white'}
              ${notification.type === 'success' && 'bg-green-500 text-white'}
              ${notification.type === 'warning' && 'bg-yellow-500 text-white'}
              ${notification.type === 'error' && 'bg-red-500 text-white'}
            `}
          >
            <div className="flex-1">
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 