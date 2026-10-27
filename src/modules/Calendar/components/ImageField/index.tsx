import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { messageOf, showError } from '@/lib/toast'
import { imageSrc, uploadImage } from '../../services/api'
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from '../../constants/tpo'

interface ImageFieldProps {
  value: string
  onChange: (imageUrl: string) => void
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * A poster or banner for the event. It is uploaded the moment it is picked, so
 * the form only ever holds the stored path — publishing stays one plain call.
 */
const ImageField = ({ value, onChange }: ImageFieldProps) => {
  const input = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      showError('Upload a PNG, JPG, GIF or WebP image.')
      return
    }
    if (file.size > IMAGE_MAX_BYTES) {
      showError('The image must be 2 MB or smaller.')
      return
    }

    setIsUploading(true)
    try {
      onChange(await uploadImage(await readAsDataUrl(file)))
    } catch (error) {
      showError(messageOf(error))
    } finally {
      setIsUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Image (optional)</Label>

      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-md border">
          <img src={imageSrc(value)} alt="Event" className="max-h-48 w-full object-cover" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconOnly
            aria-label="Remove image"
            className="absolute right-2 top-2 [background-color:var(--ds-color-bg-surface)]"
            onClick={() => onChange('')}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          disabled={isUploading}
          onClick={() => input.current?.click()}
        >
          {isUploading ? <Spinner size="sm" /> : <ImagePlus className="size-4" />}
          {isUploading ? 'Uploading…' : 'Attach an image'}
        </Button>
      )}

      <p className="text-xs [color:var(--ds-color-text-secondary)]">PNG, JPG, GIF or WebP, up to 2 MB.</p>
    </div>
  )
}

export default ImageField
