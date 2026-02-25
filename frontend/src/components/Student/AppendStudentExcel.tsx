import React, { useState } from 'react';
import { uploadStudentsFile } from '../../apis/api';

const UploadStudents: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      try {
        await uploadStudentsFile(file);
        alert('File uploaded successfully');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file');
      }
    }
  };

  return (
    <div>
      <h2>Upload Students at Once</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button  style={{ marginTop: '-2px' }} onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default UploadStudents;
