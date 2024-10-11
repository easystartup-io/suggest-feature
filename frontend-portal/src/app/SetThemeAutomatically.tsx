"use client"

import { useTheme } from "next-themes"
import { useEffect, useLayoutEffect } from "react"

export default function SetThemeAtuomatically({ searchParams }) {

  const theme = searchParams.theme
  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    if (theme) {
      setTheme(theme)
    }
  }, [theme, setTheme])

  return <div></div>;
}
