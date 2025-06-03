// pages/index.js or components/FileUpload.js
import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFileLink, setUploadedFileLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadStatus('');
    setUploadedFileLink('');
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Please select a file to upload'); 
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadStatus('Upload successful!');
        setUploadedFileLink(data.fileLink || '');
      } else {
        setUploadStatus(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '2rem auto', 
      fontFamily: 'Arial, sans-serif',
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h1>Upload File to Google Drive</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="file" 
            name="file" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        <button 
          type="submit" 
          disabled={isUploading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isUploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {uploadStatus && (
        <p style={{ 
          marginTop: '1rem',
          color: uploadStatus.includes('failed') ? 'red' : 'green'
        }}>
          {uploadStatus}
        </p>
      )}

      {uploadedFileLink && (
        <p style={{ marginTop: '1rem' }}>
          File URL: <a 
            href={uploadedFileLink} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff' }}
          >
            View File
          </a>
        </p>
      )}
    </div>
  );
}