'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, search])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter) params.append('role', roleFilter)
      if (search) params.append('search', search)
      
      const res = await axios.get(`/api/admin/users?${params}`)
      setUsers(res.data.users || [])
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Chargement...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Utilisateurs</h1>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            className="input-field flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input-field w-40"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="FARMER">Agriculteur</option>
            <option value="BUYER">Acheteur</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun utilisateur</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{user.fullName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'FARMER' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">📱 {user.phone}</p>
                    {user.email && <p className="text-sm text-gray-500">✉️ {user.email}</p>}
                    <p className="text-sm text-gray-400 mt-1">
                      Inscrit le {format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {user.city && <p className="text-gray-500">📍 {user.city}</p>}
                    {user.farmerProfile && (
                      <p className="text-gray-500">🌾 {user.farmerProfile.farmName || 'Ferme'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
