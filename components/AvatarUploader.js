'use client'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export default function AvatarUploader({ value, onChange, placeholder = '👤' }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const processFile = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir une image valide')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop volumineuse (max 5MB)')
      return
    }

    try {
      const base64 = await readFileAsBase64(file)
      onChange(base64)
    } catch {
      toast.error('Erreur lors du chargement de l\'image')
    }
  }

  const handleInputChange = async (e) => {
    const file = e.target.files?.[0]
    await processFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    await processFile(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl overflow-hidden">
          {value ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            placeholder
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-xl p-4 text-sm transition-colors ${
            dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <p className="text-gray-600 mb-2">Glissez-déposez votre photo ici</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Parcourir les fichiers
          </button>
        </div>
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-red-600 text-sm hover:underline"
        >
          Supprimer la photo
        </button>
      )}
    </div>
  )
}
