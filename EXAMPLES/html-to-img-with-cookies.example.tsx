/**
 * EXAMPLE: HTML to Image Converter with Cookie Integration
 * 
 * This file demonstrates how to integrate cookies into your tools.
 * Replace the existing useState calls with useCookie hooks to persist preferences.
 */

"use client"

import React, { useState, useRef, useEffect } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Download, Loader2, Copy, Trash2, FileImage, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCookie } from '@/hooks/use-cookies'
import { COOKIE_NAMES, SESSION_COOKIE_OPTIONS } from '@/lib/cookies'

const HtmlToImagePage = () => {
  // ✅ BEFORE: Regular useState (lost on refresh)
  // const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png')

  // ✅ AFTER: useCookie hook (persists across sessions)
  const [imageFormat, setImageFormat] = useCookie<'png' | 'jpeg'>(
    COOKIE_NAMES.HTML_TO_IMG_FORMAT,
    'png',
    {
      expires: 365, // 1 year
      path: '/',
      secure: true,
      sameSite: 'lax',
    }
  )

  // ✅ Optionally save draft HTML (use session cookie for temporary storage)
  // Note: Be careful with large content - consider localStorage for drafts
  const [htmlInput, setHtmlInput] = useState<string>('')
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Optional: Load draft HTML from cookie on mount (if you want to save drafts)
  useEffect(() => {
    // You could load a draft here if needed
    // const draft = getCookie('html-to-img-draft')
    // if (draft) setHtmlInput(draft)
  }, [])

  // Optional: Save draft HTML to session cookie (only if user wants this feature)
  // useEffect(() => {
  //   if (htmlInput.trim()) {
  //     setCookie('html-to-img-draft', htmlInput, SESSION_COOKIE_OPTIONS)
  //   }
  // }, [htmlInput])

  const handleDownload = async () => {
    if (!previewRef.current || !htmlInput.trim()) {
      toast.error('Please enter some HTML code')
      return
    }

    setIsConverting(true)
    
    try {
      const convertFn = imageFormat === 'png' ? toPng : toJpeg
      const fileExtension = imageFormat === 'png' ? 'png' : 'jpg'
      
      const dataUrl = await convertFn(previewRef.current, {
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
      setIsConverting(false)
    } catch (error) {
      console.error('Error converting HTML to image:', error)
      toast.error('Failed to convert HTML to image. Please try again.')
      setIsConverting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlInput(e.target.value)
    // Optional: Auto-save draft to session cookie
    // setCookie('html-to-img-draft', e.target.value, SESSION_COOKIE_OPTIONS)
  }

  const handleClear = () => {
    setHtmlInput('')
    // Optional: Clear draft cookie
    // removeCookie('html-to-img-draft')
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
          {/* ✅ Cookie benefit: Your format preference is remembered! */}
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
              onClick={() => setImageFormat('png')} // ✅ Automatically saves to cookie
              className="gap-2"
            >
              <FileImage className="size-4" />
              PNG
            </Button>
            <Button
              variant={imageFormat === 'jpeg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImageFormat('jpeg')} // ✅ Automatically saves to cookie
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

/**
 * KEY CHANGES MADE:
 * 
 * 1. Imported useCookie hook and cookie utilities
 * 2. Replaced useState for imageFormat with useCookie
 *    - Format preference now persists across browser sessions
 *    - User's last choice is automatically remembered
 * 
 * 3. Optional: Draft saving (commented out)
 *    - Can save HTML input to session cookie for recovery
 *    - Use localStorage for larger content
 * 
 * BENEFITS:
 * - User doesn't need to reselect PNG/JPEG every visit
 * - Better user experience with persistent preferences
 * - No backend required - all client-side
 * 
 * NEXT STEPS:
 * Apply similar pattern to other tools:
 * - Header Processor: Save preset and custom config
 * - IP Comparator: Save UI preferences
 * - EML Converter: Save file preferences
 */

