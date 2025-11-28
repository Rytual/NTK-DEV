/**
 * Board View Component
 * Kanban board visualization with drag-and-drop
 */

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';

interface BoardViewProps {
  boardId: number;
  ticketManager: any;
  onTicketClick?: (ticketId: number) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  boardId,
  ticketManager,
  onTicketClick
}) => {
  const [board, setBoard] = useState<any>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const loadBoardData = async () => {
    try {
      setLoading(true);

      const [boardData, statusesData] = await Promise.all([
        ticketManager.getBoard(boardId),
        ticketManager.getBoardStatuses(boardId)
      ]);

      setBoard(boardData);
      setStatuses(statusesData);

      const ticketsByStatus: Record<number, any[]> = {};
      for (const status of statusesData) {
        const statusTickets = await ticketManager.getTicketsByBoard(boardId, status.id);
        ticketsByStatus[status.id] = statusTickets;
      }

      setTickets(ticketsByStatus);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load board data:', error);
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatusId = parseInt(source.droppableId);
    const destStatusId = parseInt(destination.droppableId);
    const ticketId = parseInt(draggableId);

    try {
      await ticketManager.updateTicket(ticketId, {
        status: { id: destStatusId }
      });

      const newTickets = { ...tickets };
      const sourceTickets = Array.from(newTickets[sourceStatusId]);
      const [movedTicket] = sourceTickets.splice(source.index, 1);

      if (sourceStatusId === destStatusId) {
        sourceTickets.splice(destination.index, 0, movedTicket);
        newTickets[sourceStatusId] = sourceTickets;
      } else {
        const destTickets = Array.from(newTickets[destStatusId] || []);
        destTickets.splice(destination.index, 0, movedTicket);
        newTickets[sourceStatusId] = sourceTickets;
        newTickets[destStatusId] = destTickets;
      }

      setTickets(newTickets);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      await loadBoardData();
    }
  };

  const filteredTickets = (statusId: number) => {
    const statusTickets = tickets[statusId] || [];
    if (!searchTerm) return statusTickets;

    return statusTickets.filter((ticket) =>
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toString().includes(searchTerm)
    );
  };

  if (loading) {
    return <div className="board-loading">Loading board...</div>;
  }

  return (
    <div className="board-view">
      <div className="board-header">
        <h2>{board?.name}</h2>
        <div className="board-controls">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-refresh" onClick={loadBoardData}>
            Refresh
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {statuses.map((status) => (
            <Droppable key={status.id} droppableId={status.id.toString()}>
              {(provided, snapshot) => (
                <div
                  className={`board-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="column-header">
                    <h3>{status.name}</h3>
                    <span className="ticket-count">{filteredTickets(status.id).length}</span>
                  </div>

                  <div className="column-tickets">
                    {filteredTickets(status.id).map((ticket, index) => (
                      <Draggable
                        key={ticket.id}
                        draggableId={ticket.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`ticket-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            onClick={() => onTicketClick?.(ticket.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="ticket-id">#{ticket.id}</div>
                            <div className="ticket-summary">{ticket.summary}</div>
                            <div className="ticket-meta">
                              <span className="company">{ticket.company?.name}</span>
                              <span className={`priority priority-${ticket.priority?.name?.toLowerCase()}`}>
                                {ticket.priority?.name}
                              </span>
                            </div>
                            {ticket.owner && (
                              <div className="ticket-owner">{ticket.owner.name}</div>
                            )}
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <style jsx>{`
        .board-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f5f5;
        }

        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        }

        .board-controls {
          display: flex;
          gap: 10px;
        }

        .search-input {
          padding: 8px 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 250px;
        }

        .board-columns {
          display: flex;
          gap: 20px;
          padding: 20px;
          overflow-x: auto;
          flex: 1;
        }

        .board-column {
          min-width: 300px;
          background: #e8e8e8;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          flex-direction: column;
        }

        .board-column.dragging-over {
          background: #d0d0d0;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .column-header h3 {
          margin: 0;
          font-size: 16px;
        }

        .ticket-count {
          background: #666;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        .column-tickets {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .ticket-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          cursor: pointer;
        }

        .ticket-card.dragging {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }

        .ticket-id {
          font-weight: 600;
          color: #007bff;
          margin-bottom: 8px;
        }

        .ticket-summary {
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .ticket-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .priority {
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
        }

        .priority-critical { background: #dc3545; color: white; }
        .priority-high { background: #ffc107; color: #333; }
        .priority-medium { background: #17a2b8; color: white; }
        .priority-low { background: #6c757d; color: white; }
      `}</style>
    </div>
  );
};

export default BoardView;
