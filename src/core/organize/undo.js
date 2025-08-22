const fs = require('fs').promises;
const path = require('path');

class UndoManager {
  constructor() {
    this.logPath = path.join(__dirname, '../../../data/move-log.json');
  }

  async undoLastClean() {
    try {
      const moveLog = await this.loadMoveLog();
      
      if (moveLog.length === 0) {
        throw new Error('No moves to undo');
      }

      // Find the most recent cleaning session
      const lastSession = this.getLastCleaningSession(moveLog);
      
      if (lastSession.length === 0) {
        throw new Error('No recent cleaning session found');
      }

      console.log(`🔄 Undoing ${lastSession.length} file moves...`);
      
      const results = {
        undoCount: 0,
        errors: []
      };

      // Reverse the moves (most recent first to avoid conflicts)
      for (const move of lastSession.reverse()) {
        try {
          await this.undoMove(move);
          results.undoCount++;
        } catch (error) {
          console.error(`Failed to undo move: ${move.from} ← ${move.to}`, error);
          results.errors.push({
            move,
            error: error.message
          });
        }
      }

      // Remove undone moves from log
      await this.removeMovesFromLog(lastSession);
      
      return results;
    } catch (error) {
      console.error('Undo operation failed:', error);
      throw error;
    }
  }

  async loadMoveLog() {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf8');
      return JSON.parse(logContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // No log file exists yet
      }
      throw error;
    }
  }

  getLastCleaningSession(moveLog) {
    if (moveLog.length === 0) return [];

    // Find moves from the last cleaning session (within 5 minutes of the most recent move)
    const lastMove = moveLog[moveLog.length - 1];
    const lastMoveTime = new Date(lastMove.timestamp);
    const sessionCutoff = new Date(lastMoveTime.getTime() - 5 * 60 * 1000); // 5 minutes ago

    const lastSession = [];
    for (let i = moveLog.length - 1; i >= 0; i--) {
      const move = moveLog[i];
      const moveTime = new Date(move.timestamp);
      
      if (moveTime >= sessionCutoff) {
        lastSession.unshift(move); // Add to beginning to maintain order
      } else {
        break; // Stop when we hit moves older than the session cutoff
      }
    }

    return lastSession;
  }

  async undoMove(move) {
    const { from, to } = move;
    
    // Check if the target file still exists where we moved it
    try {
      await fs.access(to);
    } catch (error) {
      throw new Error(`File no longer exists at destination: ${to}`);
    }

    // Check if there's already a file at the original location
    try {
      await fs.access(from);
      throw new Error(`File already exists at original location: ${from}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error; // Some other error
      }
      // File doesn't exist at original location, safe to move back
    }

    // Move the file back
    await fs.rename(to, from);
    console.log(`↩️  Restored: ${path.basename(from)} ← ${to}`);
  }

  async removeMovesFromLog(movesToRemove) {
    const moveLog = await this.loadMoveLog();
    
    // Create a set of move signatures to remove
    const movesToRemoveSet = new Set(
      movesToRemove.map(move => `${move.from}|${move.to}|${move.timestamp}`)
    );

    // Filter out the moves we just undid
    const updatedLog = moveLog.filter(move => {
      const signature = `${move.from}|${move.to}|${move.timestamp}`;
      return !movesToRemoveSet.has(signature);
    });

    // Save the updated log
    await fs.writeFile(this.logPath, JSON.stringify(updatedLog, null, 2));
  }

  async getMoveHistory(limit = 50) {
    const moveLog = await this.loadMoveLog();
    return moveLog.slice(-limit); // Return the most recent moves
  }

  async clearMoveLog() {
    await fs.writeFile(this.logPath, JSON.stringify([], null, 2));
  }
}

module.exports = { UndoManager };