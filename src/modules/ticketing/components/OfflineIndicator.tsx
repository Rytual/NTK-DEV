/**
 * Offline Indicator Component - Shows offline queue status
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OfflineIndicatorProps {
  offlineQueue: any;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ offlineQueue }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = (data: any) => {
      setIsOnline(data.isOnline);
    };

    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
      updateQueueStatus();
    };

    offlineQueue.on('onlineStatusChanged', handleOnlineStatus);
    offlineQueue.on('syncStarted', handleSyncStart);
    offlineQueue.on('syncComplete', handleSyncComplete);

    updateQueueStatus();

    return () => {
      offlineQueue.off('onlineStatusChanged', handleOnlineStatus);
      offlineQueue.off('syncStarted', handleSyncStart);
      offlineQueue.off('syncComplete', handleSyncComplete);
    };
  }, [offlineQueue]);

  const updateQueueStatus = () => {
    const status = offlineQueue.getQueueStatus();
    setQueueStatus(status);
  };

  const handleManualSync = async () => {
    await offlineQueue.sync();
  };

  if (!queueStatus) return null;

  const hasPendingOperations = queueStatus.pending > 0;

  return (
    <motion.div
      className={`offline-indicator ${!isOnline ? 'offline' : ''}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="indicator-icon">
        {isOnline ? '🟢' : '🔴'}
      </div>
      <div className="indicator-text">
        {isOnline ? 'Online' : 'Offline'}
        {hasPendingOperations && ` (${queueStatus.pending} pending)`}
        {isSyncing && ' - Syncing...'}
      </div>
      {hasPendingOperations && isOnline && !isSyncing && (
        <button className="sync-button" onClick={handleManualSync}>
          Sync Now
        </button>
      )}
      <style jsx>{`
        .offline-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          background: #28a745;
          color: white;
          border-radius: 6px;
          font-size: 14px;
        }
        .offline-indicator.offline {
          background: #dc3545;
        }
        .sync-button {
          padding: 5px 10px;
          background: white;
          color: #333;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
      `}</style>
    </motion.div>
  );
};

export default OfflineIndicator;
