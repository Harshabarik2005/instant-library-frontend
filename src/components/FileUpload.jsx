// FileUpload – dark navy + amber SaaS theme
import { useState, useRef } from 'react';

export default function FileUpload({ label, accept, onUploadComplete, onUploadStateChange, apiBaseUrl, token }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadedName, setUploadedName] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const isImage = accept?.startsWith('image');

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file); setError(''); setUploadProgress(0); setUploadedName('');
        if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file));
        else setPreviewUrl('');
        await handleUpload(file);
    };

    const handleUpload = async (fileToUpload) => {
        setIsUploading(true);
        if (onUploadStateChange) onUploadStateChange(true);
        setError('');
        try {
            const res = await fetch(`${apiBaseUrl}/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fileName: `${Date.now()}-${fileToUpload.name}`, fileType: fileToUpload.type }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to get upload URL'); }
            const { uploadUrl, fileUrl } = await res.json();

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', fileToUpload.type);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
                };
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(fileToUpload);
            });

            onUploadComplete(fileUrl);
            setUploadedName(fileToUpload.name);
        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.message);
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
            if (onUploadStateChange) onUploadStateChange(false);
        }
    };

    const reset = () => {
        setSelectedFile(null); setPreviewUrl(''); setUploadProgress(0);
        setUploadedName(''); setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isSuccess = uploadProgress === 100 && !isUploading && uploadedName;

    return (
        <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10
        }}>
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                    {isImage ? "🖼" : "📄"} {label}
                </span>
                {selectedFile && !isUploading && (
                    <button
                        type="button" onClick={reset}
                        style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Drop zone */}
            <label className={`upload-zone ${isUploading ? "uploading" : ""} ${isSuccess ? "success" : ""}`}
                style={{ cursor: isUploading ? "not-allowed" : "pointer" }}>
                <input
                    type="file" accept={accept}
                    onChange={handleFileSelect} ref={fileInputRef}
                    disabled={isUploading}
                    style={{ display: "none" }}
                />

                {/* Image preview */}
                {previewUrl && (
                    <img src={previewUrl} alt="Preview"
                        style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, margin: "0 auto 8px" }} />
                )}

                {isSuccess ? (
                    <>
                        <p style={{ fontSize: 20, marginBottom: 4 }}>✅</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>{uploadedName}</p>
                        <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Uploaded successfully</p>
                    </>
                ) : isUploading ? (
                    <>
                        <div style={{ width: 24, height: 24, border: "2px solid rgba(245,158,11,0.2)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 8px" }} />
                        <p style={{ fontSize: 12, color: "#f59e0b" }}>Uploading… {uploadProgress}%</p>
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: 24, marginBottom: 6, opacity: 0.3 }}>{isImage ? "🖼" : "📄"}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Click to browse</p>
                        <p style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>{accept}</p>
                    </>
                )}
            </label>

            {/* Progress bar */}
            {isUploading && (
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
            )}

            {/* Error */}
            {error && (
                <p style={{
                    fontSize: 12, color: "#f87171",
                    padding: "6px 10px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8
                }}>⚠ {error}</p>
            )}
        </div>
    );
}
