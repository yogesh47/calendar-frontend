/**
 * TiptapEditor — the app's rich-text field, kept in `components/custom` so
 * every screen takes it from the design system instead of from `shared`.
 *
 * Copied from `@shared/components/FormComponents/FormTipTapEditor` with its
 * behaviour untouched: TipTap with a trimmed StarterKit, underline, a
 * placeholder, a debounced `onChange`, and an optional toolbar.
 */
import { Info } from '../../../icons'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useMemo, memo, useRef, useCallback, useState } from 'react'
import { TiptapEditorProps } from './TiptapEditor.types'
const markdownToHtml = (value: string): string => {
  if (!value || /<[a-z]/i.test(value)) return value
  let html = value
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/__(.+?)__/gs, '<u>$1</u>')
    .replace(/\*(?!\s)([^*\n]+?)\*/g, '<em>$1</em>')
  const paras = html.split(/\n+/).filter((p) => p.trim())
  return paras.length ? paras.map((p) => `<p>${p}</p>`).join('') : `<p>${html}</p>`
}

const TiptapEditor = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  maxLength,
  className = '',
  minHeight = '7.5rem',
  showToolbar = true,
  actions,
  toolbarPlacement = 'bottom',
  boxClassName = '',
  contentClassName = '',
  counterClassName = '',
}: TiptapEditorProps) => {
  // Timer ref for debouncing to prevent UI lag
  const timerRef = useRef<any>(null)

  // Tracks plain-text length so isOverLimit causes a React re-render on every keystroke.
  // editor.getText().length at render time is stale in TipTap v3 (no auto re-render on update).
  const [textLength, setTextLength] = useState(0)

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
    }),
    Underline,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
  ], [placeholder])

  // Immediate sync helper for formatting actions and blur events
  const syncImmediate = useCallback((editorInstance: Editor) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const html = editorInstance.getHTML()
    if (html !== value) onChange?.(html)
  }, [onChange, value])

  // Ref so handleKeyDown/handlePaste always see the latest maxLength without recreating the editor
  const maxLengthRef = useRef(maxLength)
  useEffect(() => { maxLengthRef.current = maxLength }, [maxLength])

  const editor = useEditor({
    extensions,
    content: markdownToHtml(value || ''),
    editable: !disabled,

    onUpdate: ({ editor }) => {
      const text = editor.getText()
      const len = text.length

      // Hard truncate: if content exceeds limit, strip back to limit immediately
      if (maxLengthRef.current && len > maxLengthRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current)
        const truncated = text.slice(0, maxLengthRef.current)
        editor.commands.setContent(`<p>${truncated}</p>`, { emitUpdate: false })
        setTextLength(maxLengthRef.current)
        onChange?.(`<p>${truncated}</p>`)
        return
      }

      setTextLength(len)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const html = editor.getHTML()
        if (html !== value) onChange?.(html)
      }, 500)
    },

    onBlur: ({ editor }) => {
      syncImmediate(editor)
      onBlur?.()
    },

    editorProps: {
      // Block typing when at limit
      handleKeyDown: (view, event) => {
        if (!maxLengthRef.current) return false
        // Allow control keys, navigation, backspace, delete, shortcuts
        if (
          event.key.length !== 1 ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) return false
        // Block if adding one char would exceed limit (account for selection replacement)
        const { doc, selection } = view.state
        const selectedText = selection.empty ? '' : doc.textBetween(selection.from, selection.to, '')
        const currentLen = doc.textContent.length - selectedText.length
        return currentLen >= maxLengthRef.current
      },
      // Truncate paste to fit remaining characters
      handlePaste: (view, event) => {
        if (!maxLengthRef.current) return false
        const pasted = event.clipboardData?.getData('text/plain') || ''
        if (!pasted) return false
        const { doc, selection } = view.state
        const selectedText = selection.empty ? '' : doc.textBetween(selection.from, selection.to, '')
        const currentLen = doc.textContent.length - selectedText.length
        const remaining = maxLengthRef.current - currentLen
        if (remaining <= 0) return true
        if (pasted.length > remaining) {
          view.dispatch(
            view.state.tr.insertText(pasted.slice(0, remaining), selection.from, selection.to)
          )
          return true
        }
        return false
      },
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none text-sm text-gray-900 leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_p]:mb-2 [&_p.is-editor-empty:first-child]:before:text-gray-400 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none',
      },
    },
  }, [extensions])

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Sync editor content with external value changes (e.g. form resets, initial load)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentHTML = editor.getHTML()
    if (value !== currentHTML && !editor.isFocused) {
      let content = markdownToHtml(value || '')
      // Hard truncate programmatic values that exceed the limit
      if (maxLengthRef.current) {
        const plain = content.replace(/<[^>]*>/g, '')
        if (plain.length > maxLengthRef.current) {
          content = `<p>${plain.slice(0, maxLengthRef.current)}</p>`
          onChange?.(content)
        }
      }
      editor.commands.setContent(content, { emitUpdate: false })
      setTextLength(editor.getText().length)
    }
  }, [value, editor])

  // Keep editable state in sync with disabled prop
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const isOverLimit = !!maxLength && textLength > maxLength
  /**
   * Full, but not over.
   *
   * Typing is blocked at the cap and a paste is trimmed to fit, which means the
   * over-limit branch below almost never fires from the keyboard — the field
   * simply stopped responding, with nothing on screen saying why. This says it.
   */
  const isAtLimit = !!maxLength && !isOverLimit && textLength >= maxLength

  /** The box takes the design system's border, radius and focus ring. */
  const getEditorClasses = (): string => {
    const base =
      'w-full rounded-[var(--ds-radius-control)] border bg-white px-[0.875rem] py-[0.625rem] transition-[border-color,box-shadow] duration-[120ms]'
    const disabledStyles = disabled ? 'opacity-60 cursor-not-allowed [background-color:var(--ds-color-bg-subtle)]' : ''

    if (error || isOverLimit) {
      return `${base} ${disabledStyles} [border-color:var(--ds-color-danger)]`
    }
    return `${base} ${disabledStyles} [border-color:var(--ds-color-border-default)] focus-within:[border-color:var(--ds-color-border-focus)] focus-within:[box-shadow:var(--ds-shadow-focus)] ${boxClassName}`
  }

  if (!editor) return null

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={getEditorClasses()}>
        {/* `flex-col-reverse` puts the toolbar above the text when asked to. */}
        <div className={`flex ${toolbarPlacement === 'top' ? 'flex-col-reverse' : 'flex-col'}`}>
        <EditorContent id={id} editor={editor} style={{ minHeight }} className={contentClassName} />

        {(showToolbar || actions) && (
          <div className="mt-2 flex items-center gap-1 border-t pt-2 [border-color:var(--ds-color-border-default)]">
            {showToolbar && (
              <>
                <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleBold().run()
                syncImmediate(editor) // Sync instantly after formatting
              }}
              isActive={editor.isActive('bold')}
              disabled={disabled}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold text-gray-700">B</span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleItalic().run()
                syncImmediate(editor) // Sync instantly after formatting
              }}
              isActive={editor.isActive('italic')}
              disabled={disabled}
              title="Italic (Ctrl+I)"
            >
              <span className="italic text-gray-700">I</span>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                editor.chain().focus().toggleUnderline().run()
                syncImmediate(editor) // Sync instantly after formatting
              }}
              isActive={editor.isActive('underline')}
              disabled={disabled}
              title="Underline (Ctrl+U)"
            >
                  <span className="underline text-gray-700">U</span>
                </ToolbarButton>
              </>
            )}

            {actions && <span className="ml-[0.5rem] flex items-center">{actions}</span>}
          </div>
        )}
        </div>
      </div>

      {/* One line under the box: the message on the left, the counter on the
          right — the error used to sit on its own row below the counter, which
          read as two disconnected footnotes. */}
      {Boolean(maxLength || error || isOverLimit) && (
        <div className="mt-1 flex items-start justify-between gap-[0.75rem]">
          <span className="min-w-0">
            {(error || isOverLimit) ? (
              // The same line every plain input draws (ResumeFieldError), so an
              // editor's complaint reads no differently from a text field's.
              <p className="text-[0.75rem] font-medium leading-[1rem] [color:var(--ds-color-danger)]">
                {error || `Cannot exceed ${maxLength} characters. Please shorten your text.`}
              </p>
            ) : isAtLimit ? (
              // Full is not an error — nothing is wrong, there is just no room left.
              <p className="flex items-center gap-1 text-xs [color:var(--color-gray-600)]">
                <Info className="size-[0.875rem] shrink-0" />
                {`You have reached the ${maxLength} character limit for this field. Shorten what is here to add more.`}
              </p>
            ) : null}
          </span>

          {maxLength ? (
            <p
              className={`shrink-0 text-right text-xs ${isOverLimit ? '[color:var(--ds-color-danger)]' : '[color:var(--color-gray-400)]'} ${counterClassName}`}
            >
              {textLength}/{maxLength}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

const ToolbarButton = memo(({ onClick, isActive, disabled, children, title }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      w-7 h-7 rounded flex items-center justify-center text-sm font-medium transition-all
      ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
  </button>
))

export default memo(TiptapEditor)





// import { useEditor, EditorContent, Editor } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'
// import Underline from '@tiptap/extension-underline'
// import Placeholder from '@tiptap/extension-placeholder'
// import { useEffect, useMemo } from 'react'
// import { TiptapEditorProps } from './Formtiptapeditor.types'

// const TiptapEditor = ({
//   label,
//   value,
//   onChange,
//   onBlur,
//   placeholder = '',
//   required = false,
//   error = '',
//   disabled = false,
//   maxLength,
//   className = '',
//   minHeight = '120px',
//   showToolbar = true,
// }: TiptapEditorProps) => {



//   // Memoize extensions to prevent recreation
//   const extensions = useMemo(() => [
//     StarterKit.configure({
//       heading: false,
//       bulletList: false,
//       orderedList: false,
//       listItem: false,
//       blockquote: false,
//       codeBlock: false,
//       horizontalRule: false,
//       strike: false,
//     }),
//     Underline,
//     Placeholder.configure({
//       placeholder,
//       emptyEditorClass: 'is-editor-empty',
//     }),
//   ], [placeholder])

//   // Initialize editor - ONLY ONCE
//   const editor = useEditor({
//     extensions,
//     content: '', // 🔒 INITIAL ONLY — PERMANENT FIX
//     editable: !disabled,
//     onUpdate: ({ editor }: { editor: Editor }) => {
//       const html = editor.getHTML()
//       if (html !== value) {
//         onChange(html)
//       }
//     },
//     onBlur: () => {
//       onBlur?.()
//     },
//     editorProps: {
//       attributes: {
//         class:
//           'prose prose-sm max-w-none focus:outline-none text-sm text-gray-900 leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_p]:mb-2 [&_p.is-editor-empty:first-child]:before:text-gray-400 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none',
//       },
//     },
// }, [extensions])

//   // Update content when value prop changes
//   useEffect(() => {
//     if (!editor || editor.isDestroyed) return

//     const current = editor.getHTML()
//     if (value !== current) {
//       editor.commands.setContent(value || '', { emitUpdate: false })
//     }
//   }, [value, editor])


//   // Update editable state
//   useEffect(() => {
//     if (editor && !editor.isDestroyed) {
//       editor.setEditable(!disabled)
//     }
//   }, [disabled, editor])

//   const getEditorClasses = (): string => {
//     const base = 'w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl transition-all duration-200 bg-white'
//     const disabledStyles = disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''

//     if (error) {
//       return `${base} ${disabledStyles} border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500`
//     }

//     return `${base} ${disabledStyles} border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`
//   }

//   if (!editor) {
//     return null
//   }

//   return (
//     <div className={className}>
//       {label && (
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           {label}
//           {required && <span className="text-red-500 ml-1">*</span>}
//         </label>
//       )}

//       <div className={getEditorClasses()}>
//         <EditorContent
//           editor={editor}
//           style={{ minHeight }}
//         />

//         {showToolbar && (
//           <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200">
//             <ToolbarButton
//               onClick={() => editor.chain().focus().toggleBold().run()}
//               isActive={editor.isActive('bold')}
//               disabled={disabled}
//               title="Bold (Ctrl+B)"
//             >
//               <span className="font-bold text-gray-700">B</span>
//             </ToolbarButton>

//             <ToolbarButton
//               onClick={() => editor.chain().focus().toggleItalic().run()}
//               isActive={editor.isActive('italic')}
//               disabled={disabled}
//               title="Italic (Ctrl+I)"
//             >
//               <span className="italic text-gray-700">I</span>
//             </ToolbarButton>

//             <ToolbarButton
//               onClick={() => editor.chain().focus().toggleUnderline().run()}
//               isActive={editor.isActive('underline')}
//               disabled={disabled}
//               title="Underline (Ctrl+U)"
//             >
//               <span className="underline text-gray-700">U</span>
//             </ToolbarButton>
//           </div>
//         )}
//       </div>

//       {maxLength && (
//         <p className="text-xs text-gray-400 mt-1 text-right">
//           {editor.storage.characterCount?.characters() || 0}/{maxLength}
//         </p>
//       )}

//       {error && (
//         <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
//           <span className="material-symbols-outlined text-[14px]">error</span>
//           {error}
//         </p>
//       )}
//     </div>
//   )
// }

// const ToolbarButton = ({
//   onClick,
//   isActive,
//   disabled,
//   children,
//   title
// }: {
//   onClick: () => void
//   isActive?: boolean
//   disabled?: boolean
//   children: React.ReactNode
//   title: string
// }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     disabled={disabled}
//     title={title}
//     className={`
//       w-7 h-7 rounded flex items-center justify-center text-sm font-medium transition-all
//       ${isActive
//         ? 'bg-gray-200 text-gray-900'
//         : 'text-gray-600 hover:bg-gray-100'
//       }
//       ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
//     `}
//   >
//     {children}
//   </button>
// )

// export default TiptapEditor