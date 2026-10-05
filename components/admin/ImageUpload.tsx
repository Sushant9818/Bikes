'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import { UploadButton } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxFiles?: number
}

export default function ImageUpload({ images, onImagesChange, maxFiles = 10 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleRemoveImage = useCallback(
    (index: number) => {
      onImagesChange(images.filter((_, i) => i !== index))
    },
    [images, onImagesChange]
  )

  const canUpload = images.length < maxFiles

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUpload && (
        <UploadButton<OurFileRouter>
          endpoint="bikeImage"
          onClientUploadComplete={(res) => {
            const newImages = res.map((file) => file.url)
            onImagesChange([...images, ...newImages])
            setUploading(false)
          }}
          onUploadError={(error: Error) => {
            alert(`Upload error: ${error.message}`)
            setUploading(false)
          }}
          onUploadBegin={() => {
            setUploading(true)
          }}
          appearance={{
            button: 'w-full ut-uploading:opacity-50 ut-uploading:cursor-not-allowed',
            container: 'w-full',
            allowedContent: 'text-xs',
          }}
          content={{
            button({ ready }) {
              if (!ready) {
                return <Loader2 className="mr-2 h-4 w-4 inline animate-spin" />
              }
              return (
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Click to upload or drag and drop
                </div>
              )
            },
            allowedContent({ isUploading }) {
              if (isUploading) {
                return <p className="text-xs">Uploading...</p>
              }
              return <p className="text-xs">PNG, JPG, GIF up to 4MB</p>
            },
          }}
        />
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={image}
                  alt={`Bike image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 rounded-full p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {images.length} / {maxFiles} images
      </div>
    </div>
  )
}
