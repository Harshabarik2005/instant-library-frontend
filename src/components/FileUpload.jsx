import { useState, useRef } from 'react';

// Reusable component to handle direct S3 file uploads via backend pre-signed URLs
export default function FileUpload({ label, accept, onUploadComplete, onUploadStateChange, apiBaseUrl, token }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setError('');
        setUploadProgress(0);

        // If it's an image, create a local object URL for previewing before upload
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl('');
        }

        // Trigger upload immediately after selection
        await handleUpload(file);
    };

    const handleUpload = async (fileToUpload) => {
        setIsUploading(true);
        if (onUploadStateChange) onUploadStateChange(true);
        setError('');

        try {
            // TODO: S3 upload
            // 1. 🔄 API Integration: Request signed upload URL from our backend
            const res = await fetch(`${apiBaseUrl}/upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: `${Date.now()}-${fileToUpload.name}`,
                    fileType: fileToUpload.type,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to get upload URL');
            }

            const { uploadUrl, fileUrl } = await res.json();

            // 2. 🚀 Direct S3 Upload: Use XMLHttpRequest to track upload progress
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', fileToUpload.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`S3 upload failed with status: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error occurred during upload.'));

                xhr.send(fileToUpload);
            });

            // 3. ✅ Success: Notify parent component with the final S3 file URL
            onUploadComplete(fileUrl);
            alert(`${label} uploaded successfully!`);

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
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="mb-4 border p-4 rounded-md bg-gray-50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
                {selectedFile && !isUploading && (
                    <button
                        type="button"
                        onClick={resetSelection}
                        className="text-xs text-red-500 hover:text-red-700"
                    >
                        Clear Selection
                    </button>
                )}
            </div>

            <input
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            {previewUrl && (
                <div className="mt-2 text-center">
                    <img src={previewUrl} alt="Preview" className="max-h-32 object-contain mx-auto border rounded shadow-sm" />
                </div>
            )}

            {selectedFile && (
                <div className="flex flex-col gap-2">
                    {(isUploading || uploadProgress > 0) && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div
                                className={`bg-blue-600 h-2.5 rounded-full ${uploadProgress === 100 ? 'bg-green-500' : ''}`}
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    {isUploading && (
                        <p className="text-xs text-gray-500 text-center">Uploading... {uploadProgress}%</p>
                    )}

                    {uploadProgress === 100 && !isUploading && (
                        <p className="text-xs text-green-600 text-center font-bold">✓ {selectedFile.name} Uploaded</p>
                    )}
                </div>
            )}
        </div>
    );
}
