'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function FarmerNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications')
      setNotifications(res.data.notifications || [])
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (err) {
      // ignore
    }
  }

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      toast.error('Erreur')
    }
  }

  if (loading) {
    return (
      <FarmerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </FarmerLayout>
    )
  }

  return (
    <FarmerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucune notification</h3>
            <p className="text-gray-400 mt-2">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`bg-white rounded-2xl p-4 border ${
                  notif.isRead ? 'border-gray-100' : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1" onClick={() => !notif.isRead && markAsRead(notif.id)}>
                    <p className="font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(notif.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FarmerLayout>
  )
}
