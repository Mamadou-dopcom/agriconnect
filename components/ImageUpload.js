'use client'
import { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ImageUpload({ 
  value = [], 
  onChange, 
  max = 5,
  accept = 'image/*',
  placeholder = 'Ajouter une image'
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (value.length + files.length > max) {
      toast.error(`Maximum ${max} images autorisées`)
      return
    }

    setUploading(true)
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} est trop volumineux (max 5MB)`)
          continue
        }

        const reader = new FileReader()
        
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        onChange([...value, base64])
      }
    } catch (err) {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = (index) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((img, index) => (
          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        
        {value.length < max && (
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <span className="text-xs text-gray-400">...</span>
            ) : (
              <span className="text-2xl text-gray-400">+</span>
            )}
          </label>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {value.length}/{max} images • Max 5MB par image
      </p>
    </div>
  )
}
