"use client"
import { useState, useRef, type ChangeEvent, type DragEvent } from "react"
import { Download, Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ImageData {
  offer: string | null
  privacyTerms: string | null
  footer1: string | null
  footer2: string | null
}

interface ImageDimensions {
  offer: { width: number; height: number } | null
  privacyTerms: { width: number; height: number } | null
  footer1: { width: number; height: number } | null
  footer2: { width: number; height: number } | null
}

type ImageType = keyof ImageData

export default function EmailImageCombiner() {
  const [images, setImages] = useState<ImageData>({
    offer: null,
    privacyTerms: null,
    footer1: null,
    footer2: null,
  })

  const [dimensions, setDimensions] = useState<ImageDimensions>({
    offer: null,
    privacyTerms: null,
    footer1: null,
    footer2: null,
  })

  const [combinedImage, setCombinedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<ImageType | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleDrag = (type: ImageType, e: DragEvent<HTMLDivElement>, isDragActive: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDragActive) setDragActive(type)
    else setDragActive(null)
  }

  const handleDrop = (type: ImageType, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      processImageFile(file, type)
    }
  }

  const processImageFile = (file: File, type: ImageType) => {
    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result as string
      setImages((prev) => ({ ...prev, [type]: result }))

      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setDimensions((prev) => ({
          ...prev,
          [type]: { width: img.width, height: img.height },
        }))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (type: ImageType, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      processImageFile(file, type)
    }
  }

  const removeImage = (type: ImageType) => {
    setImages((prev) => ({ ...prev, [type]: null }))
    setDimensions((prev) => ({ ...prev, [type]: null }))
    setCombinedImage(null)
  }

  const combineImages = async () => {
    if (!images.offer || !images.footer1 || !images.footer2) {
      alert("Please upload all required images first")
      return
    }

    setIsProcessing(true)

    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image()
          img.crossOrigin = "anonymous" // added crossOrigin for CORS safety
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error("Failed to load image"))
          img.src = src
        })
      }

      const offerImg = await loadImage(images.offer)
      const footer1Img = await loadImage(images.footer1)
      const footer2Img = await loadImage(images.footer2)
      const privacyTermsImg = images.privacyTerms ? await loadImage(images.privacyTerms) : null

      const widths = [offerImg.width, footer1Img.width, footer2Img.width]
      if (privacyTermsImg) widths.push(privacyTermsImg.width)
      const maxWidth = Math.max(...widths)

      const heights = [offerImg.height, footer1Img.height, footer2Img.height]
      if (privacyTermsImg) heights.push(privacyTermsImg.height)
      const totalHeight = heights.reduce((sum, h) => sum + h, 0)

      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas element not found")

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Failed to get canvas context")

      canvas.width = maxWidth
      canvas.height = totalHeight

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, maxWidth, totalHeight)

      let currentY = 0

      const drawCentered = (img: HTMLImageElement) => {
        const x = (maxWidth - img.width) / 2
        ctx.drawImage(img, x, currentY, img.width, img.height)
        currentY += img.height
      }

      drawCentered(offerImg)
      if (privacyTermsImg) {
        drawCentered(privacyTermsImg)
      }
      drawCentered(footer1Img)
      drawCentered(footer2Img)

      const combined = canvas.toDataURL("image/png")
      setCombinedImage(combined)
    } catch (error) {
      console.error("Error combining images:", error)
      alert("Failed to combine images. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!combinedImage) return
    const link = document.createElement("a")
    link.download = "combined-email.png"
    link.href = combinedImage
    link.click()
  }

  interface ImageUploadBoxProps {
    type: ImageType
    label: string
    description: string
    image: string | null
    dims: { width: number; height: number } | null
  }

  const ImageUploadBox = ({ type, label, description, image, dims }: ImageUploadBoxProps) => (
    <div
      onDragOver={(e) => handleDrag(type, e, true)}
      onDragLeave={(e) => handleDrag(type, e, false)}
      onDrop={(e) => handleDrop(type, e)}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
        dragActive === type ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(type, e)}
        className="hidden"
        id={`upload-${type}`}
      />
      {!image ? (
        <label htmlFor={`upload-${type}`} className="cursor-pointer block">
          <Upload className="mx-auto mb-2 " size={32} />
          <p className="text-sm font-semibold text-gray-400">{label}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </label>
      ) : (
        <div className="relative">
          <Image
            src={image || "/placeholder.svg"}
            alt={label}
            width={100}
            height={100}
            className="max-h-40 mx-auto rounded object-contain"
          />
          <button
            onClick={() => removeImage(type)}
            className="absolute top-1 right-1 bg-red-500  rounded-full p-1 hover:bg-red-600 transition-colors"
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
          <p className="text-xs text-green-600 mt-2 font-medium">✓ Uploaded</p>
          {dims && (
            <p className="text-xs text-gray-500 mt-1">
              {dims.width} × {dims.height}px
            </p>
          )}
        </div>
      )}
    </div>
  )

  const allImagesUploaded = images.offer && images.footer1 && images.footer2

  return (
    <div className="min-h-screen  p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
              <ImageIcon className="text-blue-600" size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Email Image Combiner</h1>
            <p className=" text-lg">Combine your offer with legal footers into a single email image</p>
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <ImageUploadBox
              type="offer"
              label="Email Offer"
              description="Main promotional content"
              image={images.offer}
              dims={dimensions.offer}
            />
            <ImageUploadBox
              type="privacyTerms"
              label="Privacy & Terms"
              description="Privacy and terms of service (optional)"
              image={images.privacyTerms}
              dims={dimensions.privacyTerms}
            />
            <ImageUploadBox
              type="footer1"
              label="ADV UNSUB"
              description="Advertisement unsubscribe footer"
              image={images.footer1}
              dims={dimensions.footer1}
            />
            <ImageUploadBox
              type="footer2"
              label="OPTDOWN"
              description="Opt-down footer"
              image={images.footer2}
              dims={dimensions.footer2}
            />
          </div>

          {/* Combine Button */}
          <div className="flex justify-center mb-10">
            <Button
              onClick={combineImages}
              disabled={!allImagesUploaded || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Combine Images
                </>
              )}
            </Button>
          </div>

          {/* Combined Result */}
          {combinedImage && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Combined Result</h2>
              <div className="bg-gray-50 rounded-lg p-8 max-w-2xl mx-auto border border-gray-200">
                <img
                  src={combinedImage || "/placeholder.svg"}
                  alt="Combined email"
                  className="w-full rounded-lg shadow-md mb-6"
                />
                <Button
                  onClick={downloadImage}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Combined Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
