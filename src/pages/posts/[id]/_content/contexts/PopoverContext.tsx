import { createContext, useContext, useState, ReactNode } from 'react'
import type { PostInteraction, TextPosition } from '../../../../../types/post'

export type PopoverType = 'menu' | 'comment' | 'highlight'

export interface PopoverTarget {
  type: PopoverType
  element: HTMLElement
  rect: DOMRect
  // 可選屬性，根據不同類型使用
  interaction?: PostInteraction
  selectedText?: string
  position?: TextPosition
}

interface PopoverContextType {
  target: PopoverTarget | null
  setTarget: (target: PopoverTarget | null) => void
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined)

export function PopoverProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PopoverTarget | null>(null)

  return (
    <PopoverContext.Provider value={{ target, setTarget }}>
      {children}
    </PopoverContext.Provider>
  )
}

export function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (context === undefined) {
    throw new Error('usePopoverContext must be used within a PopoverProvider')
  }
  return context
} 