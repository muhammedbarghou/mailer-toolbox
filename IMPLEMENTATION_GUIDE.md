# Cookie Implementation Guide

## Quick Start

### Step 1: The utilities are ready!
The cookie utilities have been created in:
- `lib/cookies.ts` - Core cookie functions
- `hooks/use-cookies.ts` - React hooks for components

### Step 2: Integrate into your tools

#### Simple Example (HTML to Image Converter)
```typescript
// Before
const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png')

// After
import { useCookie } from '@/hooks/use-cookies'
import { COOKIE_NAMES } from '@/lib/cookies'

const [imageFormat, setImageFormat] = useCookie<'png' | 'jpeg'>(
  COOKIE_NAMES.HTML_TO_IMG_FORMAT,
  'png',
  {
    expires: 365,
    path: '/',
    secure: true,
    sameSite: 'lax',
  }
)
```

That's it! The format preference is now saved automatically.

### Step 3: Apply to each tool

#### 1. HTML to Image Converter ✅ (Easiest)
- **File**: `app/html-to-img/page.tsx`
- **Change**: Replace `useState` for `imageFormat` with `useCookie`
- **See**: `EXAMPLES/html-to-img-with-cookies.example.tsx`

#### 2. Email Header Processor ✅ (Medium)
- **File**: `app/header-processor/page.tsx`
- **Changes**:
  - Save `selectedPreset` with `useCookie`
  - Save `config` when preset is 'custom'
  - Save `showSettings` state
- **See**: `EXAMPLES/header-processor-with-cookies.example.tsx`

#### 3. IP Comparator ✅ (Medium)
- **File**: `app/ip-comparator/page.tsx`
- **Changes**:
  - Save UI preferences (optional)
  - Consider saving recent IP lists (be careful with data size)

#### 4. EML to TXT Converter ✅ (Easy)
- **File**: `app/eml-to-txt-converter/page.tsx`
- **Changes**:
  - Save file upload preferences
  - Save download naming preferences

### Step 4: Add Recent Tools Tracking (Optional)

Add to your navigation component:

```typescript
import { useRecentTools } from '@/hooks/use-cookies'
import { useEffect } from 'react'

export default function Navbar() {
  const { recentTools, addRecentTool } = useRecentTools(5)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/') {
      addRecentTool(pathname)
    }
  }, [pathname, addRecentTool])

  // Display recent tools in UI if desired
  // ...
}
```

---

## Implementation Checklist

### Phase 1: Core Preferences (Do First)
- [ ] HTML to Image: Format preference
- [ ] Header Processor: Preset preference
- [ ] Header Processor: Custom config (when custom preset)
- [ ] Header Processor: Settings panel state

### Phase 2: UI Enhancements (Do Next)
- [ ] Add recent tools tracking to navbar
- [ ] Save collapsed/expanded states
- [ ] Save UI preferences (tooltips, etc.)

### Phase 3: Advanced Features (Optional)
- [ ] Draft saving (use localStorage for large content)
- [ ] User analytics
- [ ] Performance preferences

---

## Testing

### Test Checklist
1. ✅ Set a preference (e.g., PNG format)
2. ✅ Refresh the page
3. ✅ Preference should be remembered
4. ✅ Clear cookies
5. ✅ Should return to default

### Browser DevTools
1. Open DevTools → Application → Cookies
2. Verify cookies are being set
3. Check expiration dates
4. Verify cookie values are correct

---

## Common Patterns

### Pattern 1: Simple Preference
```typescript
const [preference, setPreference] = useCookie('pref-name', 'default-value')
```

### Pattern 2: Complex Object
```typescript
const [config, setConfig] = useCookie<ConfigType>('config-name', defaultConfig)
```

### Pattern 3: Conditional Saving
```typescript
const [preset, setPreset] = useCookie('preset', 'default')

useEffect(() => {
  if (preset === 'custom') {
    // Save custom config only when preset is custom
    setCookie('custom-config', JSON.stringify(config))
  }
}, [preset, config])
```

---

## Troubleshooting

### Cookies not persisting?
- Check browser settings (cookies enabled)
- Verify `secure: true` works with HTTPS (or set to `false` for localhost)
- Check expiration date is set correctly

### Cookies too large?
- Use `localStorage` for larger data (>4KB)
- Split data into multiple cookies
- Compress data before storing

### SSR Issues?
- All cookie functions check `typeof window === 'undefined'`
- Hooks handle SSR automatically
- No action needed

---

## Security Best Practices

1. ✅ **Never store sensitive data** (file contents, emails, personal info)
2. ✅ **Use secure cookies** (HTTPS only)
3. ✅ **Set appropriate expiration** (1 year for preferences, session for drafts)
4. ✅ **Use SameSite=Lax** (prevents CSRF attacks)
5. ✅ **Validate cookie data** when reading (don't trust client data)

---

## Next Steps

1. Start with HTML to Image converter (simplest)
2. Test thoroughly in your browser
3. Apply to other tools one by one
4. Add recent tools tracking
5. Consider adding a cookie consent banner if needed for GDPR

---

## Questions?

Refer to:
- `COOKIE_ANALYSIS.md` - Detailed analysis and recommendations
- `EXAMPLES/` - Working code examples
- `lib/cookies.ts` - Utility function documentation
- `hooks/use-cookies.ts` - Hook documentation

