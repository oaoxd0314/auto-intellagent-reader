import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { TextPosition } from '../../../../../types/post'

// 文字選擇狀態
type TextSelectionState = {
  readonly selectedText: string
  readonly selectedRange: Range | null
  readonly selectedPosition: TextPosition | null
  readonly selectedRects: DOMRect[]
  readonly selectedElement: HTMLElement | null
  readonly isMenuVisible: boolean
  readonly menuPosition: { left: number; top: number } | null
}

// 文字選擇動作
type TextSelectionActions = {
  readonly setSelection: (selection: Partial<TextSelectionState>) => void
  readonly clearSelection: () => void
  readonly showMenu: (position: { left: number; top: number }) => void
  readonly hideMenu: () => void
}

type TextSelectionContextType = TextSelectionState & TextSelectionActions

const INITIAL_STATE: TextSelectionState = {
  selectedText: '',
  selectedRange: null,
  selectedPosition: null,
  selectedRects: [],
  selectedElement: null,
  isMenuVisible: false,
  menuPosition: null
} as const

const TextSelectionContext = createContext<TextSelectionContextType | null>(null)

type TextSelectionProviderProps = {
  readonly children: ReactNode
}

export function TextSelectionProvider({ children }: TextSelectionProviderProps) {
  const [state, setState] = useState<TextSelectionState>(INITIAL_STATE)

  const setSelection = useCallback((selection: Partial<TextSelectionState>) => {
    setState(prev => ({ ...prev, ...selection }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  const showMenu = useCallback((position: { left: number; top: number }) => {
    setState(prev => ({
      ...prev,
      isMenuVisible: true,
      menuPosition: position
    }))
  }, [])

  const hideMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMenuVisible: false,
      menuPosition: null
    }))
  }, [])

  const contextValue: TextSelectionContextType = {
    ...state,
    setSelection,
    clearSelection,
    showMenu,
    hideMenu
  }

  return (
    <TextSelectionContext.Provider value={contextValue}>
      {children}
    </TextSelectionContext.Provider>
  )
}

export function useTextSelectionContext(): TextSelectionContextType {
  const context = useContext(TextSelectionContext)
  if (!context) {
    throw new Error('useTextSelectionContext must be used within TextSelectionProvider')
  }
  return context
} 