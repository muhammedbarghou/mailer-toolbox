/**
 * EXAMPLE: Email Header Processor with Cookie Integration
 * 
 * This demonstrates how to save complex preferences (presets and custom configurations)
 * using cookies in a more complex tool.
 */

"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useCookie } from '@/hooks/use-cookies'
import { COOKIE_NAMES } from '@/lib/cookies'

// ... other imports ...

const PRESETS = {
  standard: {
    name: "Standard",
    description: "Remove common tracking and authentication headers",
    fieldsToRemove: {
      "Delivered-To:": true,
      "Received: by": true,
      // ... rest of config
    },
  },
  minimal: {
    name: "Minimal",
    description: "Keep only essential headers",
    fieldsToRemove: {
      // ... config
    },
  },
  custom: {
    name: "Custom",
    description: "Configure your own settings",
    fieldsToRemove: {},
  },
}

export default function EmailHeaderProcessor() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  // ✅ BEFORE: Regular useState (lost on refresh)
  // const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>("standard")
  // const [config, setConfig] = useState(PRESETS.standard)

  // ✅ AFTER: useCookie hooks (persist across sessions)
  const [selectedPreset, setSelectedPreset] = useCookie<keyof typeof PRESETS>(
    COOKIE_NAMES.HEADER_PROCESSOR_PRESET,
    'standard',
    {
      expires: 365, // 1 year
      path: '/',
      secure: true,
      sameSite: 'lax',
    }
  )

  // For custom config, we need to save the entire configuration object
  const [savedConfig, setSavedConfig] = useCookie<typeof PRESETS.standard>(
    COOKIE_NAMES.HEADER_PROCESSOR_CONFIG,
    PRESETS.standard,
    {
      expires: 365,
      path: '/',
      secure: true,
      sameSite: 'lax',
    }
  )

  // Sync config based on preset
  const [config, setConfig] = useState(PRESETS[selectedPreset])

  // Load saved config when preset changes or component mounts
  useEffect(() => {
    if (selectedPreset === 'custom') {
      // Use saved custom config if available
      if (savedConfig && Object.keys(savedConfig.fieldsToRemove).length > 0) {
        setConfig(savedConfig)
      }
    } else {
      // Use preset config
      setConfig(PRESETS[selectedPreset])
    }
  }, [selectedPreset, savedConfig])

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId)
  }, [files, selectedFileId])

  // ✅ Save preset preference when changed
  const handlePresetChange = useCallback((preset: keyof typeof PRESETS) => {
    setSelectedPreset(preset)
    if (preset === 'custom') {
      // Keep existing custom config if available
      setConfig(savedConfig)
    } else {
      setConfig(PRESETS[preset])
    }
  }, [setSelectedPreset, savedConfig])

  // ✅ Save custom config when modified
  const handleConfigChange = useCallback((newConfig: typeof PRESETS.custom) => {
    setConfig(newConfig)
    if (selectedPreset === 'custom') {
      // Save custom config to cookie
      setSavedConfig(newConfig as typeof PRESETS.standard)
    }
  }, [selectedPreset, setSavedConfig])

  // ✅ Optionally save settings panel state
  const [settingsOpen, setSettingsOpen] = useCookie(
    'header-processor-settings-open',
    false,
    {
      expires: 30, // 30 days
      path: '/',
      secure: true,
      sameSite: 'lax',
    }
  )

  // Rest of your component code...
  // When updating config in the UI, use handleConfigChange instead of setConfig

  return (
    <div className="min-h-screen bg-background">
      {/* ... existing JSX ... */}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          const newState = !showSettings
          setShowSettings(newState)
          setSettingsOpen(newState) // ✅ Save panel state to cookie
        }} 
        className="gap-2"
      >
        <Settings size={16} />
        <span className="hidden sm:inline">Settings</span>
      </Button>

      {/* ... rest of component ... */}
    </div>
  )
}

/**
 * KEY IMPLEMENTATION PATTERNS:
 * 
 * 1. Preset Selection:
 *    - Use useCookie for selectedPreset
 *    - Automatically saves when user changes preset
 * 
 * 2. Custom Configuration:
 *    - Save entire config object when preset is 'custom'
 *    - Use useEffect to sync config with preset
 *    - Only save custom config, not preset configs
 * 
 * 3. UI State:
 *    - Save settings panel open/closed state
 *    - Improves UX by remembering user's preference
 * 
 * 4. Data Flow:
 *    - Preset change → Update cookie → Sync config
 *    - Custom config change → Save to cookie → Update config
 *    - Component mount → Load from cookie → Set initial state
 * 
 * BENEFITS:
 * - User's preset choice is remembered
 * - Custom configurations are preserved
 * - Settings panel state is maintained
 * - No need to reconfigure every visit
 */

