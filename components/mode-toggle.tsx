"use client"

import { useTheme } from "next-themes"
import { useState } from 'react';
import { ThemeSwitcher } from '@/components/ui/shadcn-io/theme-switcher';


export function ModeToggle() {
  const { setTheme } = useTheme()


  return (
    <ThemeSwitcher defaultValue="system" onChange={setTheme}  />
  )
}
