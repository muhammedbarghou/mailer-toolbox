"use client"

import React, { useState, useRef } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Download, Loader2, Copy, Trash2, FileImage, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

const HtmlToImagePage = () => {
  const [htmlInput, setHtmlInput] = useState<string>('')
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png')
  const previewRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!previewRef.current || !htmlInput.trim()) {
      toast.error('Please enter some HTML code')
      return
    }

    setIsConverting(true)
    
    const element = previewRef.current
    const convertFn = imageFormat === 'png' ? toPng : toJpeg
    const fileExtension = imageFormat === 'png' ? 'png' : 'jpg'
    
    // Store original styles to restore later
    const originalStyles = {
      width: element.style.width,
      height: element.style.height,
      maxWidth: element.style.maxWidth,
      maxHeight: element.style.maxHeight,
      overflow: element.style.overflow,
    }
    
    // Get the parent container to check its constraints
    const parent = element.parentElement
    const parentOriginalStyles = parent ? {
      overflow: parent.style.overflow,
      maxWidth: parent.style.maxWidth,
      maxHeight: parent.style.maxHeight,
    } : null
    
    try {
      // Temporarily remove constraints to get full dimensions
      element.style.width = 'auto'
      element.style.height = 'auto'
      element.style.maxWidth = 'none'
      element.style.maxHeight = 'none'
      element.style.overflow = 'visible'
      
      if (parent) {
        parent.style.overflow = 'visible'
        parent.style.maxWidth = 'none'
        parent.style.maxHeight = 'none'
      }
      
      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Get the actual scroll dimensions of the content
      const scrollWidth = Math.max(element.scrollWidth, element.offsetWidth)
      const scrollHeight = Math.max(element.scrollHeight, element.offsetHeight)
      
      // Set explicit dimensions to ensure full capture
      element.style.width = `${scrollWidth}px`
      element.style.height = `${scrollHeight}px`
      
      // Wait for layout to update again
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const dataUrl = await convertFn(element, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        quality: imageFormat === 'jpeg' ? 0.95 : 1,
        cacheBust: true,
      })

      const link = document.createElement('a')
      link.download = `html-image-${Date.now()}.${fileExtension}`
      link.href = dataUrl
      link.click()

      toast.success(`Image downloaded as ${fileExtension.toUpperCase()}!`)
    } catch (error) {
      console.error('Error converting HTML to image:', error)
      toast.error('Failed to convert HTML to image. Please try again.')
    } finally {
      // Always restore original styles
      element.style.width = originalStyles.width || ''
      element.style.height = originalStyles.height || ''
      element.style.maxWidth = originalStyles.maxWidth || ''
      element.style.maxHeight = originalStyles.maxHeight || ''
      element.style.overflow = originalStyles.overflow || ''
      
      if (parent && parentOriginalStyles) {
        parent.style.overflow = parentOriginalStyles.overflow || ''
        parent.style.maxWidth = parentOriginalStyles.maxWidth || ''
        parent.style.maxHeight = parentOriginalStyles.maxHeight || ''
      }
      
      setIsConverting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlInput(e.target.value)
  }

  const handleClear = () => {
    setHtmlInput('')
    toast.info('HTML input cleared')
  }

  const handleCopyHTML = async () => {
    if (!htmlInput.trim()) {
      toast.error('No HTML to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(htmlInput)
      toast.success('HTML copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy HTML')
    }
  }

  const getCharacterCount = () => {
    return htmlInput.length
  }

  const getLineCount = () => {
    return htmlInput.split('\n').length
  }

  return (
    <div className="w-full min-h-screen py-8 px-6 bg-linear-to-br from-background to-muted/20">
      <div className="mb-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          HTML to Image Converter
        </h1>
        <p className="text-muted-foreground">
          Paste your HTML code and convert it to a downloadable image
        </p>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Format:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={imageFormat === 'png' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImageFormat('png')}
              className="gap-2"
            >
              <FileImage className="size-4" />
              PNG
            </Button>
            <Button
              variant={imageFormat === 'jpeg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImageFormat('jpeg')}
              className="gap-2"
            >
              <FileImage className="size-4" />
              JPEG
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>{getCharacterCount()} characters</span>
            <span>•</span>
            <span>{getLineCount()} lines</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleDownload}
            disabled={!htmlInput.trim() || isConverting}
            size="lg"
            className="gap-2"
            aria-label="Convert and download image"
          >
            {isConverting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Download as {imageFormat.toUpperCase()}
              </>
            )}
          </Button>
          <Button
            onClick={handleCopyHTML}
            disabled={!htmlInput.trim()}
            variant="outline"
            size="lg"
            className="gap-2"
            aria-label="Copy HTML to clipboard"
          >
            <Copy className="size-4" />
            Copy HTML
          </Button>
          <Button
            onClick={handleClear}
            disabled={!htmlInput.trim()}
            variant="outline"
            size="lg"
            className="gap-2"
            aria-label="Clear HTML input"
          >
            <Trash2 className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 w-full max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="size-5" />
              HTML Input
            </CardTitle>
            <CardDescription>
              Enter or paste your HTML code below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="html-input">HTML Code</Label>
                {htmlInput.trim() && (
                  <span className="text-xs text-muted-foreground">
                    {getCharacterCount()} chars
                  </span>
                )}
              </div>
              <Textarea
                id="html-input"
                value={htmlInput}
                onChange={handleInputChange}
                placeholder="<div><h1>Hello World</h1><p>This is a sample HTML</p></div>"
                className="min-h-[500px] font-mono text-sm resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              This is how your HTML will appear in the image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-4 bg-white min-h-[500px] overflow-auto shadow-inner">
              {htmlInput ? (
                <div
                  ref={previewRef}
                  data-html-preview
                  className="w-full"
                  style={{
                    color: '#000000',
                    backgroundColor: '#ffffff',
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlInput }}
                />
              ) : (
                <div 
                  ref={previewRef} 
                  data-html-preview
                  className="w-full flex items-center justify-center min-h-[450px]"
                  style={{
                    color: '#6b7280',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div className="text-center">
                    <ImageIcon className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-lg">Preview will appear here...</p>
                    <p className="text-muted-foreground/70 text-sm mt-2">Enter HTML code to see the preview</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HtmlToImagePage