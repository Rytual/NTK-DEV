/**
 * Ticket Console Component
 * Comprehensive ticket viewer with rich notes, time entries, and AI analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketConsoleProps {
  ticketId: number;
  ticketManager: any;
  kageAnalyzer?: any;
  onClose?: () => void;
}

export const TicketConsole: React.FC<TicketConsoleProps> = ({
  ticketId,
  ticketManager,
  kageAnalyzer,
  onClose
}) => {
  const [ticket, setTicket] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'time' | 'attachments' | 'ai'>('notes');
  const [newNote, setNewNote] = useState('');
  const [newTimeEntry, setNewTimeEntry] = useState({ hours: 0, notes: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const noteEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const loadTicketData = async () => {
    try {
      setLoading(true);

      const [ticketData, notesData, timeData] = await Promise.all([
        ticketManager.getTicket(ticketId),
        ticketManager.getNotes(ticketId),
        ticketManager.getTimeEntries(ticketId)
      ]);

      setTicket(ticketData);
      setNotes(notesData);
      setTimeEntries(timeData);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load ticket data:', error);
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const noteData = {
        text: newNote,
        internalAnalysisFlag: false,
        externalFlag: true
      };

      await ticketManager.addNote(ticketId, noteData);
      setNewNote('');
      await loadTicketData();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleAddTimeEntry = async () => {
    if (newTimeEntry.hours <= 0) return;

    try {
      const timeData = {
        actualHours: newTimeEntry.hours,
        notes: newTimeEntry.notes,
        workType: { id: 1 }
      };

      await ticketManager.addTimeEntry(ticketId, timeData);
      setNewTimeEntry({ hours: 0, notes: '' });
      await loadTicketData();
    } catch (error) {
      console.error('Failed to add time entry:', error);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!kageAnalyzer) return;

    try {
      setIsAnalyzing(true);
      const analysis = await ticketManager.analyzeTicket(ticketId);
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('AI analysis failed:', error);
      setIsAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (statusId: number) => {
    try {
      await ticketManager.updateTicket(ticketId, {
        status: { id: statusId }
      });
      await loadTicketData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUpdatePriority = async (priorityId: number) => {
    try {
      await ticketManager.setPriority(ticketId, priorityId);
      await loadTicketData();
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  if (loading) {
    return (
      <div className="ticket-console-loading">
        <div className="spinner"></div>
        <p>Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-console-error">
        <p>Ticket not found</p>
      </div>
    );
  }

  return (
    <motion.div
      className="ticket-console"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="ticket-header">
        <div className="ticket-title">
          <h1>#{ticket.id} - {ticket.summary}</h1>
          <div className="ticket-meta">
            <span className="company">{ticket.company?.name}</span>
            <span className="contact">{ticket.contact?.name}</span>
            <span className="board">{ticket.board?.name}</span>
          </div>
        </div>
        <div className="ticket-actions">
          {kageAnalyzer && (
            <button
              className="btn-ai"
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </button>
          )}
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>

      <div className="ticket-status-bar">
        <div className="status-item">
          <label>Status:</label>
          <span className={`status-badge status-${ticket.status?.name?.toLowerCase()}`}>
            {ticket.status?.name}
          </span>
        </div>
        <div className="status-item">
          <label>Priority:</label>
          <span className={`priority-badge priority-${ticket.priority?.name?.toLowerCase()}`}>
            {ticket.priority?.name}
          </span>
        </div>
        <div className="status-item">
          <label>Assigned To:</label>
          <span>{ticket.owner?.name || 'Unassigned'}</span>
        </div>
        <div className="status-item">
          <label>Time Logged:</label>
          <span>{ticket.actualHours || 0}h</span>
        </div>
      </div>

      <div className="ticket-body">
        <div className="ticket-description">
          <h3>Description</h3>
          <div className="description-content">
            {ticket.initialDescription || 'No description provided'}
          </div>
        </div>

        <div className="ticket-tabs">
          <div className="tab-buttons">
            <button
              className={activeTab === 'notes' ? 'active' : ''}
              onClick={() => setActiveTab('notes')}
            >
              Notes ({notes.length})
            </button>
            <button
              className={activeTab === 'time' ? 'active' : ''}
              onClick={() => setActiveTab('time')}
            >
              Time Entries ({timeEntries.length})
            </button>
            <button
              className={activeTab === 'attachments' ? 'active' : ''}
              onClick={() => setActiveTab('attachments')}
            >
              Attachments ({attachments.length})
            </button>
            {kageAnalyzer && (
              <button
                className={activeTab === 'ai' ? 'active' : ''}
                onClick={() => setActiveTab('ai')}
              >
                AI Analysis
              </button>
            )}
          </div>

          <div className="tab-content">
            <AnimatePresence mode="wait">
              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="notes-panel"
                >
                  <div className="notes-list">
                    {notes.map((note) => (
                      <div key={note.id} className="note-item">
                        <div className="note-header">
                          <span className="note-author">{note.createdBy}</span>
                          <span className="note-date">
                            {new Date(note.dateCreated).toLocaleString()}
                          </span>
                          {note.internalAnalysisFlag && (
                            <span className="note-badge internal">Internal</span>
                          )}
                          {note.resolutionFlag && (
                            <span className="note-badge resolution">Resolution</span>
                          )}
                        </div>
                        <div className="note-text">{note.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="note-editor">
                    <textarea
                      ref={noteEditorRef}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={4}
                    />
                    <div className="editor-actions">
                      <button onClick={handleAddNote} className="btn-primary">
                        Add Note
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'time' && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="time-panel"
                >
                  <div className="time-list">
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="time-item">
                        <div className="time-header">
                          <span className="time-member">{entry.member?.name}</span>
                          <span className="time-hours">{entry.actualHours}h</span>
                          <span className="time-date">
                            {new Date(entry.dateEntered).toLocaleString()}
                          </span>
                        </div>
                        {entry.notes && <div className="time-notes">{entry.notes}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="time-editor">
                    <div className="form-row">
                      <label>Hours:</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={newTimeEntry.hours}
                        onChange={(e) =>
                          setNewTimeEntry({
                            ...newTimeEntry,
                            hours: parseFloat(e.target.value)
                          })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <label>Notes:</label>
                      <textarea
                        value={newTimeEntry.notes}
                        onChange={(e) =>
                          setNewTimeEntry({
                            ...newTimeEntry,
                            notes: e.target.value
                          })
                        }
                        rows={3}
                      />
                    </div>
                    <button onClick={handleAddTimeEntry} className="btn-primary">
                      Add Time Entry
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ai' && kageAnalyzer && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ai-panel"
                >
                  {aiAnalysis ? (
                    <div className="ai-analysis">
                      <div className="analysis-section">
                        <h4>Summary</h4>
                        <p>{aiAnalysis.summary}</p>
                      </div>

                      {aiAnalysis.keyIssues.length > 0 && (
                        <div className="analysis-section">
                          <h4>Key Issues</h4>
                          <ul>
                            {aiAnalysis.keyIssues.map((issue: string, i: number) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.solutions.length > 0 && (
                        <div className="analysis-section">
                          <h4>Suggested Solutions</h4>
                          <ul>
                            {aiAnalysis.solutions.map((solution: string, i: number) => (
                              <li key={i}>{solution}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.diagnosticCommands.length > 0 && (
                        <div className="analysis-section">
                          <h4>Diagnostic Commands</h4>
                          <div className="command-list">
                            {aiAnalysis.diagnosticCommands.map((cmd: string, i: number) => (
                              <div key={i} className="command-item">
                                <code>{cmd}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiAnalysis.priorityRecommendation && (
                        <div className="analysis-section">
                          <h4>Priority Recommendation</h4>
                          <p>
                            Recommended: {aiAnalysis.priorityRecommendation.priority}
                            {aiAnalysis.priorityRecommendation.shouldChange && (
                              <span className="recommendation-badge">Change Suggested</span>
                            )}
                          </p>
                        </div>
                      )}

                      {aiAnalysis.timeEstimate && (
                        <div className="analysis-section">
                          <h4>Time Estimate</h4>
                          <p>
                            {aiAnalysis.timeEstimate.hours} hours
                            (Range: {aiAnalysis.timeEstimate.range.min} -{' '}
                            {aiAnalysis.timeEstimate.range.max}h)
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ai-placeholder">
                      <p>Click "AI Analysis" to analyze this ticket</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticket-console {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .ticket-title h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: #333;
        }

        .ticket-meta {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #666;
        }

        .ticket-actions {
          display: flex;
          gap: 10px;
        }

        .ticket-status-bar {
          display: flex;
          gap: 30px;
          padding: 15px 20px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-item label {
          font-weight: 600;
          color: #666;
        }

        .status-badge,
        .priority-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .ticket-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .ticket-description {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .ticket-tabs {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .tab-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab-buttons button {
          padding: 10px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab-buttons button.active {
          border-bottom-color: #007bff;
          color: #007bff;
        }

        .notes-list,
        .time-list {
          margin-bottom: 20px;
          max-height: 400px;
          overflow-y: auto;
        }

        .note-item,
        .time-item {
          padding: 15px;
          margin-bottom: 10px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .note-editor textarea,
        .time-editor textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          resize: vertical;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .ai-analysis {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .analysis-section {
          padding: 15px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .analysis-section h4 {
          margin-top: 0;
          color: #333;
        }

        .command-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .command-item code {
          display: block;
          padding: 10px;
          background: #2d2d2d;
          color: #f8f8f8;
          border-radius: 4px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 13px;
        }
      `}</style>
    </motion.div>
  );
};

export default TicketConsole;
