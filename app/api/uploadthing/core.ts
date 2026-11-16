import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { requireAdmin } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  bikeImage: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      // Require admin authentication
      await requireAdmin()
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      console.log('File uploaded:', file)
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
