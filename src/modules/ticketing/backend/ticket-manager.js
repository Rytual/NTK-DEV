/**
 * ConnectWise Ticket Manager
 * Comprehensive ticket management with boards, notes, time entries, and AI integration
 *
 * Features:
 * - Board management (get all boards, board statuses)
 * - Ticket CRUD operations
 * - Ticket search and filtering
 * - Status transitions with validation
 * - Priority management
 * - Note management (internal, external, resolution)
 * - Time entry tracking
 * - Ticket assignment
 * - Custom field support
 * - Batch operations
 * - Real-time updates via EventEmitter
 * - Integration with Kage AI for diagnostics
 */

const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

/**
 * Ticket Manager Class
 */
class TicketManager extends EventEmitter {
  constructor(connectWiseClient, kageAnalyzer = null) {
    super();

    if (!connectWiseClient) {
      throw new Error('ConnectWise client is required');
    }

    this.client = connectWiseClient;
    this.kageAnalyzer = kageAnalyzer;

    // Cache for boards and statuses
    this.cache = {
      boards: null,
      statuses: new Map(),
      priorities: null,
      types: null,
      subtypes: new Map(),
      lastUpdate: null
    };

    // Ticket state management
    this.activeTickets = new Map();

    // Statistics
    this.stats = {
      ticketsCreated: 0,
      ticketsUpdated: 0,
      ticketsClosed: 0,
      notesAdded: 0,
      timeEntriesAdded: 0,
      aiAnalysesRun: 0
    };

    this._log('Ticket Manager initialized');
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    console.log(`[TicketManager] ${message}`, data || '');
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Initialize cache - fetch boards, statuses, priorities
   */
  async initialize() {
    try {
      this._log('Initializing ticket manager...');

      // Fetch boards
      await this.refreshBoards();

      // Fetch priorities
      await this.refreshPriorities();

      // Fetch ticket types
      await this.refreshTypes();

      this.cache.lastUpdate = Date.now();

      this._log('Ticket manager initialized successfully');
      this.emit('initialized', { cache: this.cache });

      return true;
    } catch (error) {
      this._log('Failed to initialize ticket manager', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Refresh boards cache
   */
  async refreshBoards() {
    try {
      const boards = await this.client.getBoards();
      this.cache.boards = boards;

      // Fetch statuses for each board
      for (const board of boards) {
        const statuses = await this.client.getBoardStatuses(board.id);
        this.cache.statuses.set(board.id, statuses);
      }

      this._log(`Refreshed ${boards.length} boards`);
      this.emit('boardsRefreshed', { boards });

      return boards;
    } catch (error) {
      this._log('Failed to refresh boards', error);
      throw error;
    }
  }

  /**
   * Refresh priorities cache
   */
  async refreshPriorities() {
    try {
      const priorities = await this.client.get('/service/priorities');
      this.cache.priorities = priorities;

      this._log(`Refreshed ${priorities.length} priorities`);
      return priorities;
    } catch (error) {
      this._log('Failed to refresh priorities', error);
      throw error;
    }
  }

  /**
   * Refresh ticket types cache
   */
  async refreshTypes() {
    try {
      const types = await this.client.get('/service/boards/types');
      this.cache.types = types;

      this._log(`Refreshed ${types.length} ticket types`);
      return types;
    } catch (error) {
      this._log('Failed to refresh ticket types', error);
      throw error;
    }
  }

  /**
   * Get all boards
   */
  async getBoards(forceRefresh = false) {
    if (forceRefresh || !this.cache.boards) {
      return this.refreshBoards();
    }
    return this.cache.boards;
  }

  /**
   * Get board by ID
   */
  async getBoard(boardId) {
    const boards = await this.getBoards();
    return boards.find(b => b.id === boardId);
  }

  /**
   * Get board statuses
   */
  async getBoardStatuses(boardId, forceRefresh = false) {
    if (forceRefresh || !this.cache.statuses.has(boardId)) {
      const statuses = await this.client.getBoardStatuses(boardId);
      this.cache.statuses.set(boardId, statuses);
      return statuses;
    }
    return this.cache.statuses.get(boardId);
  }

  /**
   * Get priorities
   */
  async getPriorities(forceRefresh = false) {
    if (forceRefresh || !this.cache.priorities) {
      return this.refreshPriorities();
    }
    return this.cache.priorities;
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData) {
    try {
      this._log('Creating ticket', ticketData);

      // Validate required fields
      if (!ticketData.board || !ticketData.board.id) {
        throw new Error('Board ID is required');
      }
      if (!ticketData.company || !ticketData.company.id) {
        throw new Error('Company ID is required');
      }
      if (!ticketData.summary) {
        throw new Error('Summary is required');
      }

      // Create ticket
      const ticket = await this.client.createTicket(ticketData);

      this.stats.ticketsCreated++;
      this.activeTickets.set(ticket.id, ticket);

      this._log(`Ticket created: #${ticket.id}`, ticket);
      this.emit('ticketCreated', { ticket });

      // Run AI analysis if initial description provided and Kage is available
      if (this.kageAnalyzer && ticketData.initialDescription) {
        try {
          const analysis = await this.kageAnalyzer.analyzeTicket(ticket);
          this.emit('aiAnalysisComplete', { ticketId: ticket.id, analysis });
        } catch (error) {
          this._log('AI analysis failed', error);
        }
      }

      return ticket;
    } catch (error) {
      this._log('Failed to create ticket', error);
      this.emit('ticketCreationError', { ticketData, error });
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId) {
    try {
      const ticket = await this.client.getTicket(ticketId);
      this.activeTickets.set(ticketId, ticket);

      this.emit('ticketFetched', { ticket });
      return ticket;
    } catch (error) {
      this._log(`Failed to get ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId, updates) {
    try {
      this._log(`Updating ticket ${ticketId}`, updates);

      // Validate status transitions if status is being updated
      if (updates.status && updates.status.id) {
        const ticket = await this.getTicket(ticketId);
        await this._validateStatusTransition(ticket, updates.status.id);
      }

      const updatedTicket = await this.client.updateTicket(ticketId, updates);

      this.stats.ticketsUpdated++;
      this.activeTickets.set(ticketId, updatedTicket);

      this._log(`Ticket updated: #${ticketId}`);
      this.emit('ticketUpdated', { ticket: updatedTicket, updates });

      return updatedTicket;
    } catch (error) {
      this._log(`Failed to update ticket ${ticketId}`, error);
      this.emit('ticketUpdateError', { ticketId, updates, error });
      throw error;
    }
  }

  /**
   * Validate status transition
   */
  async _validateStatusTransition(ticket, newStatusId) {
    const statuses = await this.getBoardStatuses(ticket.board.id);
    const currentStatus = statuses.find(s => s.id === ticket.status.id);
    const newStatus = statuses.find(s => s.id === newStatusId);

    if (!newStatus) {
      throw new Error(`Invalid status ID: ${newStatusId}`);
    }

    // Check if transition is allowed (example logic - customize as needed)
    if (currentStatus.name === 'Closed' && newStatus.name !== 'Closed') {
      this._log('Warning: Reopening closed ticket', { ticket, newStatus });
      this.emit('ticketReopened', { ticket, newStatus });
    }

    return true;
  }

  /**
   * Close ticket
   */
  async closeTicket(ticketId, resolution = null) {
    try {
      const ticket = await this.getTicket(ticketId);
      const statuses = await this.getBoardStatuses(ticket.board.id);

      // Find closed status
      const closedStatus = statuses.find(s =>
        s.name.toLowerCase().includes('closed') ||
        s.closedStatus === true
      );

      if (!closedStatus) {
        throw new Error('No closed status found for this board');
      }

      const updates = {
        status: { id: closedStatus.id }
      };

      // Add resolution note if provided
      if (resolution) {
        updates.closedFlag = true;
        updates.closedBy = resolution.closedBy || 'System';
        updates.closedDate = new Date().toISOString();
      }

      const updatedTicket = await this.updateTicket(ticketId, updates);

      // Add resolution note
      if (resolution && resolution.note) {
        await this.addNote(ticketId, {
          text: resolution.note,
          internalAnalysisFlag: false,
          resolutionFlag: true
        });
      }

      this.stats.ticketsClosed++;
      this._log(`Ticket closed: #${ticketId}`);
      this.emit('ticketClosed', { ticket: updatedTicket, resolution });

      return updatedTicket;
    } catch (error) {
      this._log(`Failed to close ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticketId) {
    try {
      await this.client.deleteTicket(ticketId);
      this.activeTickets.delete(ticketId);

      this._log(`Ticket deleted: #${ticketId}`);
      this.emit('ticketDeleted', { ticketId });

      return true;
    } catch (error) {
      this._log(`Failed to delete ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Search tickets
   */
  async searchTickets(searchParams) {
    try {
      const {
        conditions,
        orderBy = 'id desc',
        page = 1,
        pageSize = 25
      } = searchParams;

      this._log('Searching tickets', searchParams);

      const tickets = await this.client.getTickets(conditions, orderBy, page, pageSize);

      this.emit('ticketsSearched', { searchParams, count: tickets.length });

      return tickets;
    } catch (error) {
      this._log('Failed to search tickets', error);
      throw error;
    }
  }

  /**
   * Get tickets by board
   */
  async getTicketsByBoard(boardId, statusId = null, page = 1, pageSize = 25) {
    let conditions = `board/id=${boardId}`;

    if (statusId) {
      conditions += ` and status/id=${statusId}`;
    }

    return this.searchTickets({ conditions, page, pageSize });
  }

  /**
   * Get tickets by company
   */
  async getTicketsByCompany(companyId, page = 1, pageSize = 25) {
    const conditions = `company/id=${companyId}`;
    return this.searchTickets({ conditions, page, pageSize });
  }

  /**
   * Get tickets by contact
   */
  async getTicketsByContact(contactId, page = 1, pageSize = 25) {
    const conditions = `contact/id=${contactId}`;
    return this.searchTickets({ conditions, page, pageSize });
  }

  /**
   * Get open tickets
   */
  async getOpenTickets(page = 1, pageSize = 25) {
    const conditions = 'closedFlag=false';
    return this.searchTickets({ conditions, page, pageSize });
  }

  /**
   * Get my tickets (assigned to current user)
   */
  async getMyTickets(memberId, page = 1, pageSize = 25) {
    const conditions = `owner/id=${memberId} and closedFlag=false`;
    return this.searchTickets({ conditions, orderBy: 'priority/sort desc', page, pageSize });
  }

  /**
   * Get ticket notes
   */
  async getNotes(ticketId) {
    try {
      const notes = await this.client.getTicketNotes(ticketId);

      this.emit('notesFetched', { ticketId, count: notes.length });
      return notes;
    } catch (error) {
      this._log(`Failed to get notes for ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Add note to ticket
   */
  async addNote(ticketId, noteData) {
    try {
      this._log(`Adding note to ticket ${ticketId}`, noteData);

      // Validate required fields
      if (!noteData.text) {
        throw new Error('Note text is required');
      }

      const note = await this.client.createTicketNote(ticketId, noteData);

      this.stats.notesAdded++;
      this._log(`Note added to ticket ${ticketId}`);
      this.emit('noteAdded', { ticketId, note });

      return note;
    } catch (error) {
      this._log(`Failed to add note to ticket ${ticketId}`, error);
      this.emit('noteAddError', { ticketId, noteData, error });
      throw error;
    }
  }

  /**
   * Add internal note
   */
  async addInternalNote(ticketId, text) {
    return this.addNote(ticketId, {
      text,
      internalAnalysisFlag: true,
      externalFlag: false
    });
  }

  /**
   * Add external note (visible to customer)
   */
  async addExternalNote(ticketId, text) {
    return this.addNote(ticketId, {
      text,
      internalAnalysisFlag: false,
      externalFlag: true
    });
  }

  /**
   * Add resolution note
   */
  async addResolutionNote(ticketId, text) {
    return this.addNote(ticketId, {
      text,
      internalAnalysisFlag: false,
      externalFlag: true,
      resolutionFlag: true
    });
  }

  /**
   * Update note
   */
  async updateNote(ticketId, noteId, updates) {
    try {
      const note = await this.client.updateTicketNote(ticketId, noteId, updates);

      this._log(`Note ${noteId} updated`);
      this.emit('noteUpdated', { ticketId, noteId, note });

      return note;
    } catch (error) {
      this._log(`Failed to update note ${noteId}`, error);
      throw error;
    }
  }

  /**
   * Delete note
   */
  async deleteNote(ticketId, noteId) {
    try {
      await this.client.deleteTicketNote(ticketId, noteId);

      this._log(`Note ${noteId} deleted`);
      this.emit('noteDeleted', { ticketId, noteId });

      return true;
    } catch (error) {
      this._log(`Failed to delete note ${noteId}`, error);
      throw error;
    }
  }

  /**
   * Get time entries for ticket
   */
  async getTimeEntries(ticketId) {
    try {
      const timeEntries = await this.client.getTicketTimeEntries(ticketId);

      this.emit('timeEntriesFetched', { ticketId, count: timeEntries.length });
      return timeEntries;
    } catch (error) {
      this._log(`Failed to get time entries for ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Add time entry to ticket
   */
  async addTimeEntry(ticketId, timeEntryData) {
    try {
      this._log(`Adding time entry to ticket ${ticketId}`, timeEntryData);

      // Validate required fields
      if (!timeEntryData.actualHours && !timeEntryData.timeStart) {
        throw new Error('Either actualHours or timeStart is required');
      }

      const timeEntry = await this.client.createTimeEntry(ticketId, timeEntryData);

      this.stats.timeEntriesAdded++;
      this._log(`Time entry added to ticket ${ticketId}`);
      this.emit('timeEntryAdded', { ticketId, timeEntry });

      return timeEntry;
    } catch (error) {
      this._log(`Failed to add time entry to ticket ${ticketId}`, error);
      this.emit('timeEntryAddError', { ticketId, timeEntryData, error });
      throw error;
    }
  }

  /**
   * Update time entry
   */
  async updateTimeEntry(timeEntryId, updates) {
    try {
      const timeEntry = await this.client.updateTimeEntry(timeEntryId, updates);

      this._log(`Time entry ${timeEntryId} updated`);
      this.emit('timeEntryUpdated', { timeEntryId, timeEntry });

      return timeEntry;
    } catch (error) {
      this._log(`Failed to update time entry ${timeEntryId}`, error);
      throw error;
    }
  }

  /**
   * Delete time entry
   */
  async deleteTimeEntry(timeEntryId) {
    try {
      await this.client.deleteTimeEntry(timeEntryId);

      this._log(`Time entry ${timeEntryId} deleted`);
      this.emit('timeEntryDeleted', { timeEntryId });

      return true;
    } catch (error) {
      this._log(`Failed to delete time entry ${timeEntryId}`, error);
      throw error;
    }
  }

  /**
   * Assign ticket to member
   */
  async assignTicket(ticketId, memberId, teamId = null) {
    try {
      const updates = {
        owner: { id: memberId }
      };

      if (teamId) {
        updates.team = { id: teamId };
      }

      const ticket = await this.updateTicket(ticketId, updates);

      this._log(`Ticket ${ticketId} assigned to member ${memberId}`);
      this.emit('ticketAssigned', { ticketId, memberId, teamId, ticket });

      return ticket;
    } catch (error) {
      this._log(`Failed to assign ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Set ticket priority
   */
  async setPriority(ticketId, priorityId) {
    try {
      const updates = {
        priority: { id: priorityId }
      };

      const ticket = await this.updateTicket(ticketId, updates);

      this._log(`Ticket ${ticketId} priority set to ${priorityId}`);
      this.emit('priorityChanged', { ticketId, priorityId, ticket });

      return ticket;
    } catch (error) {
      this._log(`Failed to set priority for ticket ${ticketId}`, error);
      throw error;
    }
  }

  /**
   * Run AI analysis on ticket
   */
  async analyzeTicket(ticketId) {
    try {
      if (!this.kageAnalyzer) {
        throw new Error('Kage AI analyzer not configured');
      }

      this._log(`Running AI analysis on ticket ${ticketId}`);

      const ticket = await this.getTicket(ticketId);
      const notes = await this.getNotes(ticketId);

      // Combine ticket data for analysis
      const analysisData = {
        ticket,
        notes,
        timeEntries: await this.getTimeEntries(ticketId)
      };

      const analysis = await this.kageAnalyzer.analyzeTicket(analysisData);

      this.stats.aiAnalysesRun++;
      this._log(`AI analysis complete for ticket ${ticketId}`);
      this.emit('aiAnalysisComplete', { ticketId, analysis });

      // Add analysis as internal note
      if (analysis.summary) {
        await this.addInternalNote(ticketId,
          `AI Analysis:\n\n${analysis.summary}\n\n` +
          `Key Issues: ${analysis.keyIssues.join(', ')}\n\n` +
          `Suggested Solutions:\n${analysis.solutions.map(s => `- ${s}`).join('\n')}`
        );
      }

      return analysis;
    } catch (error) {
      this._log(`Failed to analyze ticket ${ticketId}`, error);
      this.emit('aiAnalysisError', { ticketId, error });
      throw error;
    }
  }

  /**
   * Batch create tickets
   */
  async batchCreateTickets(ticketsData) {
    const results = [];

    for (const ticketData of ticketsData) {
      try {
        const ticket = await this.createTicket(ticketData);
        results.push({ success: true, ticket });
      } catch (error) {
        results.push({ success: false, error: error.message, ticketData });
      }
    }

    this.emit('batchCreateComplete', { results });
    return results;
  }

  /**
   * Batch update tickets
   */
  async batchUpdateTickets(updates) {
    const results = [];

    for (const update of updates) {
      try {
        const ticket = await this.updateTicket(update.ticketId, update.data);
        results.push({ success: true, ticket });
      } catch (error) {
        results.push({ success: false, error: error.message, update });
      }
    }

    this.emit('batchUpdateComplete', { results });
    return results;
  }

  /**
   * Get ticket statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeTickets: this.activeTickets.size,
      cache: {
        boards: this.cache.boards?.length || 0,
        statuses: this.cache.statuses.size,
        priorities: this.cache.priorities?.length || 0,
        lastUpdate: this.cache.lastUpdate
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      boards: null,
      statuses: new Map(),
      priorities: null,
      types: null,
      subtypes: new Map(),
      lastUpdate: null
    };

    this.emit('cacheCleared');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      ticketsCreated: 0,
      ticketsUpdated: 0,
      ticketsClosed: 0,
      notesAdded: 0,
      timeEntriesAdded: 0,
      aiAnalysesRun: 0
    };

    this.emit('statsReset');
  }
}

module.exports = TicketManager;
