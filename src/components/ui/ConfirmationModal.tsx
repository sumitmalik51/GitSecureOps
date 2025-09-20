import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'
import { animationVariants } from '../../utils/animations'
import { announceToScreenReader } from '../../utils/accessibility'
import { useEffect } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  users?: string[]
  isLoading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  users = [],
  isLoading = false
}: ConfirmationModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`Confirmation dialog opened: ${title}`)
    }
  }, [isOpen, title])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose()
    }
  }

  const handleConfirm = () => {
    announceToScreenReader('Confirmation accepted')
    onConfirm()
  }

  const handleCancel = () => {
    announceToScreenReader('Confirmation cancelled')
    onClose()
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-500/20'
        }
      case 'warning':
        return {
          icon: 'text-yellow-500',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          border: 'border-yellow-500/20'
        }
      case 'info':
        return {
          icon: 'text-blue-500',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-500/20'
        }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={!isLoading ? onClose : undefined}
          >
            {/* Modal */}
            <motion.div
              variants={animationVariants.modal}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`bg-dark-card border ${typeStyles.border} rounded-xl shadow-2xl max-w-md w-full mx-4`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              role="alertdialog"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-dark-surface ${typeStyles.icon}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h2 id="modal-title" className="text-xl font-semibold text-dark-text">
                    {title}
                  </h2>
                </div>
                {!isLoading && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-dark-surface rounded-lg transition-colors text-dark-text-muted hover:text-dark-text"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <p id="modal-description" className="text-dark-text-muted mb-4 leading-relaxed">
                  {message}
                </p>

                {/* User List (if provided) */}
                {users.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-dark-text mb-3">
                      {users.length === 1 ? 'User:' : `Users (${users.length}):`}
                    </h3>
                    <div className="bg-dark-surface rounded-lg p-3 max-h-32 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user}
                          className="flex items-center space-x-2 py-1"
                        >
                          <div className="w-2 h-2 bg-brand-primary rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-dark-text font-medium">{user}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 justify-end">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isLoading}
                    className="min-w-20"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={`min-w-20 ${typeStyles.confirmButton}`}
                    loading={isLoading}
                  >
                    {isLoading ? 'Processing...' : confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
