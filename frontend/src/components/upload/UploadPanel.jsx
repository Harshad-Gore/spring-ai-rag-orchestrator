import { useState } from 'react'
import { UploadCloud, FilePlus } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { useToast } from '../ui/ToastProvider.jsx'

export default function UploadPanel({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const { addToast } = useToast()

  function handleSelect(e) {
    setError(null)
    setFile(e.target.files?.[0] ?? null)
  }

  async function doUploadAttempt(fd) {
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/documents')
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText)
        else reject(new Error(xhr.statusText || `Upload failed (${xhr.status})`))
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      }
      xhr.send(fd)
    })
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const maxAttempts = 3
    let attempt = 0
    let lastErr = null

    while (attempt < maxAttempts) {
      try {
        attempt += 1
        await doUploadAttempt(fd)
        setFile(null)
        setProgress(100)
        addToast('success', 'File uploaded successfully')
        if (onUploaded) onUploaded()
        lastErr = null
        break
      } catch (err) {
        lastErr = err
        const wait = 500 * Math.pow(2, attempt - 1)
        addToast('error', `Upload attempt ${attempt} failed: ${err.message}`)
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, wait))
      }
    }

    if (lastErr) {
      setError(lastErr.message)
      addToast('error', `Upload failed after ${maxAttempts} attempts`)
    }

    setUploading(false)
  }

  return (
    <div className="w-full rounded-[8px] border border-[#242424] bg-[#0b0b0b] p-6 text-left">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-[#07110c] p-3 text-[#dffdee]">
          <UploadCloud className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Upload source</h3>
          <p className="mt-1 text-sm text-[#b9c0ca]">Upload PDFs to index into your workspace.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-md border border-[#2d2d2d] p-3">
          <FilePlus className="size-5 text-[#b9c0ca]" />
          <span className="text-sm text-[#b9c0ca]">Select a PDF file</span>
          <input type="file" accept="application/pdf" className="ml-auto" onChange={handleSelect} />
        </label>

        {file ? (
          <div className="flex items-center justify-between text-sm text-[#b9c0ca]">
            <div>{file.name}</div>
            <div>{Math.round(file.size / 1024)} KB</div>
          </div>
        ) : null}

        {error ? <div className="text-sm text-red-400">{error}</div> : null}

        <div className="flex items-center gap-3">
          <Button onClick={handleUpload} disabled={!file || uploading} variant="default">
            Upload
          </Button>
          <Button onClick={() => setFile(null)} variant="outline" disabled={uploading}>
            Clear
          </Button>
          <div className="ml-auto text-sm text-[#9aa39f]">{uploading ? `${progress}%` : ''}</div>
        </div>

        {uploading ? (
          <div className="h-2 w-full overflow-hidden rounded bg-[#07110c]"><div className="h-2 bg-[#dffdee]" style={{width: `${progress}%`}}/></div>
        ) : null}
      </div>
    </div>
  )
}
