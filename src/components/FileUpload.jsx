import { useState, useRef } from 'react';

export default function FileUpload({ label, accept, onUploadComplete, onUploadStateChange, apiBaseUrl, token }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadedName, setUploadedName] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const isImage = accept && accept.startsWith('image');

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        setError('');
        setUploadProgress(0);
        setUploadedName('');
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl('');
        }
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
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to get upload URL');
            }
            const { uploadUrl, fileUrl } = await res.json();
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', fileToUpload.type);
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };
                xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`));
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

    const resetSelection = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setUploadProgress(0);
        setUploadedName('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const isSuccess = uploadProgress === 100 && !isUploading && uploadedName;

    return (
        <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                    {isImage ? "🖼️" : "📄"} {label}
                </label>
                {selectedFile && !isUploading && (
                    <button
                        type="button"
                        onClick={resetSelection}
                        className="btn-danger"
                        style={{ padding: "3px 10px", fontSize: "11px" }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Drop Zone / File Input */}
            <label style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px",
                borderRadius: "10px",
                border: `2px dashed ${isSuccess ? "rgba(16,185,129,0.5)" : isUploading ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.15)"}`,
                background: isSuccess ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
                cursor: isUploading ? "not-allowed" : "pointer",
                transition: "all 0.2s"
            }}>
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    disabled={isUploading}
                    style={{ display: "none" }}
                />

                {/* Preview image (cover uploads) */}
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }}
                    />
                )}

                {isSuccess ? (
                    <>
                        <span style={{ fontSize: "20px", marginBottom: "4px" }}>✅</span>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#34d399", textAlign: "center" }}>
                            {uploadedName}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>Uploaded successfully</p>
                    </>
                ) : isUploading ? (
                    <>
                        <span style={{ fontSize: "20px", marginBottom: "4px" }}>⏳</span>
                        <p style={{ fontSize: "12px", color: "#a78bfa" }}>Uploading... {uploadProgress}%</p>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: "22px", marginBottom: "6px", opacity: 0.5 }}>
                            {isImage ? "🖼️" : "📄"}
                        </span>
                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--muted)", textAlign: "center" }}>
                            Click to browse
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)", marginTop: "2px" }}>{accept}</p>
                    </>
                )}
            </label>

            {/* Progress Bar */}
            {isUploading && (
                <div style={{ height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                        borderRadius: "99px",
                        transition: "width 0.3s ease"
                    }} />
                </div>
            )}

            {/* Error */}
            {error && (
                <p style={{
                    fontSize: "12px", color: "#f87171",
                    padding: "6px 10px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "8px"
                }}>
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
}
