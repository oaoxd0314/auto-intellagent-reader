import { useState } from 'react'
import type { TextPosition } from '../../../../../types/post'

export interface UseInteractionDialogsReturn {
    // 評論對話框
    showCommentDialog: boolean
    commentText: string
    setCommentText: (text: string) => void
    openCommentDialog: (selectedText: string, position: TextPosition) => void
    closeCommentDialog: () => void
    selectedTextForComment: string | null
    selectedPositionForComment: TextPosition | null

    // 回覆對話框
    showReplyDialog: boolean
    replyText: string
    setReplyText: (text: string) => void
    openReplyDialog: () => void
    closeReplyDialog: () => void
}

export function useInteractionDialogs(): UseInteractionDialogsReturn {
    const [showCommentDialog, setShowCommentDialog] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [selectedTextForComment, setSelectedTextForComment] = useState<string | null>(null)
    const [selectedPositionForComment, setSelectedPositionForComment] = useState<TextPosition | null>(null)
    const [showReplyDialog, setShowReplyDialog] = useState(false)
    const [replyText, setReplyText] = useState('')

    const openCommentDialog = (selectedText: string, position: TextPosition) => {
        setSelectedTextForComment(selectedText)
        setSelectedPositionForComment(position)
        setShowCommentDialog(true)
    }

    const closeCommentDialog = () => {
        setShowCommentDialog(false)
        setCommentText('')
        setSelectedTextForComment(null)
        setSelectedPositionForComment(null)
    }

    const openReplyDialog = () => {
        setShowReplyDialog(true)
    }

    const closeReplyDialog = () => {
        setShowReplyDialog(false)
        setReplyText('')
    }

    return {
        showCommentDialog,
        commentText,
        setCommentText,
        openCommentDialog,
        closeCommentDialog,
        selectedTextForComment,
        selectedPositionForComment,

        showReplyDialog,
        replyText,
        setReplyText,
        openReplyDialog,
        closeReplyDialog
    }
} 