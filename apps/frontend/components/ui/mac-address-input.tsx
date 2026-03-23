"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface MacAddressInputProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

function parseToOctets(val: string): string[] {
  if (!val) return ["", "", "", "", "", ""]
  const clean = val.replace(/[:\-]/g, "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase()
  return Array.from({ length: 6 }, (_, i) => clean.slice(i * 2, i * 2 + 2))
}

export function MacAddressInput({ value = "", onChange, className }: MacAddressInputProps) {
  const [octets, setOctets] = useState<string[]>(() => parseToOctets(value))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setOctets(parseToOctets(value))
  }, [value])

  function emit(newOctets: string[]) {
    const mac = newOctets.every(o => o === "") ? "" : newOctets.join(":")
    onChange?.(mac)
  }

  function handleChange(index: number, raw: string) {
    const hex = raw.replace(/[^0-9A-Fa-f]/g, "").toUpperCase().slice(0, 2)
    const newOctets = [...octets]
    newOctets[index] = hex
    setOctets(newOctets)
    emit(newOctets)
    if (hex.length === 2 && index < 5) {
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && octets[index] === "" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
      inputRefs.current[index - 1]?.select()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
      inputRefs.current[index - 1]?.select()
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const clean = pasted.replace(/[:\-\s]/g, "").replace(/[^0-9A-Fa-f]/g, "").toUpperCase().slice(0, 12)
    const newOctets = Array.from({ length: 6 }, (_, i) => clean.slice(i * 2, i * 2 + 2))
    setOctets(newOctets)
    emit(newOctets)
    const lastIndex = Math.min(Math.ceil(clean.length / 2) - 1, 5)
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus()
      inputRefs.current[lastIndex]?.select()
    }
  }

  const octetClass = cn(
    "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "h-8 w-9 rounded-lg border bg-transparent text-center font-mono text-sm uppercase",
    "transition-colors outline-none focus-visible:ring-3",
    "placeholder:text-muted-foreground"
  )

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {octets.map((octet, i) => (
        <div key={i} className="flex items-center">
          <input
            ref={el => { inputRefs.current[i] = el }}
            type="text"
            inputMode="text"
            value={octet}
            maxLength={2}
            placeholder="00"
            className={octetClass}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onFocus={e => e.target.select()}
            onPaste={handlePaste}
          />
          {i < 5 && (
            <span className="mx-0.5 text-muted-foreground font-mono text-sm select-none">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
