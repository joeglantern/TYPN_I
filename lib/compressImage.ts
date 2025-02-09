import imageCompression from 'browser-image-compression'

interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker: boolean
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  }
): Promise<File> {
  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    throw error
  }
} 