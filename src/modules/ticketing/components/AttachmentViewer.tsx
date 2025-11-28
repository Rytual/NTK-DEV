/**
 * Attachment Viewer Component - PDF viewer with pdf.js integration
 */
import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface AttachmentViewerProps {
  ticketId: number;
  documentId: number;
  attachmentHandler: any;
  onClose?: () => void;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  ticketId,
  documentId,
  attachmentHandler,
  onClose
}) => {
  const [document, setDocument] = useState<any>(null);
  const [fileType, setFileType] = useState<string>('');
  const [dataURL, setDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
  }, [ticketId, documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const docInfo = await attachmentHandler.getDocumentInfo(ticketId, documentId);
      setDocument(docInfo);

      const type = attachmentHandler.getViewerType(docInfo.fileName);
      setFileType(type);

      if (type === 'pdf' || type === 'image') {
        const url = await attachmentHandler.getFileAsDataURL(ticketId, documentId);
        setDataURL(url);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load document:', error);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await attachmentHandler.downloadFile(ticketId, documentId);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  if (loading) {
    return <div className="attachment-loading">Loading attachment...</div>;
  }

  return (
    <div className="attachment-viewer">
      <div className="viewer-header">
        <h3>{document?.fileName}</h3>
        <div className="viewer-actions">
          <button onClick={handleDownload}>Download</button>
          {onClose && <button onClick={onClose}>Close</button>}
        </div>
      </div>

      <div className="viewer-content">
        {fileType === 'pdf' && (
          <iframe src={dataURL} style={{ width: '100%', height: '100%', border: 'none' }} />
        )}
        {fileType === 'image' && (
          <img src={dataURL} alt={document?.fileName} style={{ maxWidth: '100%', maxHeight: '100%' }} />
        )}
        {fileType === 'download' && (
          <div className="download-prompt">
            <p>Preview not available for this file type.</p>
            <button onClick={handleDownload}>Download File</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentViewer;
