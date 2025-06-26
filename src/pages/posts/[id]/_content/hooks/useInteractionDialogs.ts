import { useState } from 'react'

export interface UseInteractionDialogsReturn {
    // 評論對話框
    showCommentDialog: boolean
    commentText: string
    setCommentText: (text: string) => void
    openCommentDialog: () => void
    closeCommentDialog: () => void

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
    const [showReplyDialog, setShowReplyDialog] = useState(false)
    const [replyText, setReplyText] = useState('')

    const openCommentDialog = () => {
        setShowCommentDialog(true)
    }

    const closeCommentDialog = () => {
        setShowCommentDialog(false)
        setCommentText('')
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

        showReplyDialog,
        replyText,
        setReplyText,
        openReplyDialog,
        closeReplyDialog
    }
} 