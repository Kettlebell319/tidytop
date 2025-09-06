const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { format } = require('date-fns');

/**
 * Smart Find - SQLite-powered search for organized files
 * Indexes all organized files for fast full-text search with natural language queries
 */
class SmartSearch {
  constructor() {
    this.dbPath = path.join(os.homedir(), '.tidytop', 'search.db');
    this.db = null;
    this.desktopPath = path.join(os.homedir(), 'Desktop');
  }

  /**
   * Initialize SQLite database with FTS5 full-text search
   */
  async initialize() {
    try {
      // Ensure .tidytop directory exists
      const configDir = path.dirname(this.dbPath);
      await fs.mkdir(configDir, { recursive: true });

      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log('📚 Smart Find database connected');
          this.createTables().then(resolve).catch(reject);
        });
      });
    } catch (error) {
      console.error('Failed to initialize Smart Find:', error);
      throw error;
    }
  }

  /**
   * Create database tables with FTS5 for full-text search
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      const schema = `
        -- Main files table
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_path TEXT NOT NULL,
          current_path TEXT NOT NULL,
          category TEXT NOT NULL,
          file_extension TEXT,
          file_size INTEGER,
          date_created TEXT,
          date_modified TEXT,
          date_organized TEXT,
          is_folder BOOLEAN DEFAULT 0,
          checksum TEXT
        );

        -- FTS5 virtual table for full-text search
        CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
          filename,
          original_path,
          current_path,
          category,
          content='files',
          content_rowid='id'
        );

        -- Triggers to keep FTS5 in sync
        CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON files BEGIN
          INSERT INTO files_fts(rowid, filename, original_path, current_path, category)
          VALUES (new.id, new.filename, new.original_path, new.current_path, new.category);
        END;

        CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON files BEGIN
          INSERT INTO files_fts(files_fts, rowid, filename, original_path, current_path, category)
          VALUES('delete', old.id, old.filename, old.original_path, old.current_path, old.category);
        END;

        CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON files BEGIN
          INSERT INTO files_fts(files_fts, rowid, filename, original_path, current_path, category)
          VALUES('delete', old.id, old.filename, old.original_path, old.current_path, old.category);
          INSERT INTO files_fts(rowid, filename, original_path, current_path, category)
          VALUES (new.id, new.filename, new.original_path, new.current_path, new.category);
        END;

        -- Index for performance
        CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
        CREATE INDEX IF NOT EXISTS idx_files_date_organized ON files(date_organized);
        CREATE INDEX IF NOT EXISTS idx_files_extension ON files(file_extension);
      `;

      this.db.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📚 Smart Find database schema created');
          resolve();
        }
      });
    });
  }

  /**
   * Index a file that was just organized
   */
  async indexFile(fileInfo) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO files (
          filename, original_path, current_path, category, 
          file_extension, file_size, date_created, date_modified, 
          date_organized, is_folder, checksum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        fileInfo.filename,
        fileInfo.originalPath,
        fileInfo.currentPath,
        fileInfo.category,
        fileInfo.extension || '',
        fileInfo.size || 0,
        fileInfo.dateCreated || new Date().toISOString(),
        fileInfo.dateModified || new Date().toISOString(),
        new Date().toISOString(),
        fileInfo.isFolder ? 1 : 0,
        fileInfo.checksum || ''
      ], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          console.log(`📚 Indexed: ${fileInfo.filename}`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Search files with natural language queries
   */
  async search(query, options = {}) {
    if (!this.db) {
      await this.initialize();
    }

    const limit = options.limit || 50;
    const category = options.category;
    const dateRange = options.dateRange; // 'today', 'week', 'month'

    // Parse natural language queries
    const parsedQuery = this.parseNaturalLanguage(query);
    
    return new Promise((resolve, reject) => {
      let sql, params;
      
      // Use FTS5 if search terms are available, otherwise use regular SQL
      if (parsedQuery.searchTerms && parsedQuery.searchTerms !== '*') {
        sql = `
          SELECT f.*
          FROM files f
          JOIN files_fts ON f.id = files_fts.rowid
          WHERE files_fts MATCH ?
        `;
        params = [this.formatFTS5Query(parsedQuery.searchTerms)];
      } else {
        // Fallback to regular SQL for category/date-only searches
        sql = `
          SELECT f.*
          FROM files f
          WHERE 1=1
        `;
        params = [];
      }

      // Add category filter
      if (category || parsedQuery.category) {
        sql += ` AND f.category = ?`;
        params.push(category || parsedQuery.category);
      }

      // Add date range filter
      if (dateRange || parsedQuery.dateRange) {
        const dateFilter = this.getDateFilter(dateRange || parsedQuery.dateRange);
        sql += ` AND f.date_organized >= ?`;
        params.push(dateFilter);
      }

      sql += ` ORDER BY f.date_organized DESC LIMIT ?`;
      params.push(limit);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            query: query,
            results: rows,
            count: rows.length,
            parsedQuery: parsedQuery
          });
        }
      });
    });
  }

  /**
   * Format query for FTS5 full-text search
   */
  formatFTS5Query(query) {
    // Escape special FTS5 characters and format for search
    let formatted = query
      .replace(/['"*]/g, '') // Remove problematic characters
      .trim();
    
    // Split into words and join with OR for flexible matching
    const words = formatted.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return '*'; // Match all
    }
    
    if (words.length === 1) {
      return `"${words[0]}"*`; // Prefix match for single word
    }
    
    // For multiple words, try exact phrase first, then individual words
    return words.map(word => `"${word}"`).join(' OR ');
  }

  /**
   * Parse natural language search queries
   */
  parseNaturalLanguage(query) {
    const lowerQuery = query.toLowerCase();
    let searchTerms = query;
    let category = null;
    let dateRange = null;

    // Extract category hints
    const categoryMappings = {
      'pdf': 'PDFs', 'pdfs': 'PDFs',
      'image': 'Images', 'images': 'Images', 'photo': 'Images', 'photos': 'Images',
      'screenshot': 'Screenshots', 'screenshots': 'Screenshots',
      'doc': 'Docs', 'docs': 'Docs', 'document': 'Docs', 'documents': 'Docs',
      'video': 'Video', 'videos': 'Video', 'movie': 'Video', 'movies': 'Video',
      'audio': 'Audio', 'music': 'Audio', 'sound': 'Audio',
      'archive': 'Archives', 'zip': 'Archives',
      'slide': 'Slides', 'slides': 'Slides', 'presentation': 'Slides'
    };

    for (const [keyword, cat] of Object.entries(categoryMappings)) {
      if (lowerQuery.includes(keyword)) {
        category = cat;
        // Remove category keyword from search terms
        searchTerms = searchTerms.replace(new RegExp(keyword, 'gi'), '').trim();
        break;
      }
    }

    // Extract date range hints
    const datePatterns = {
      'today': 'today',
      'yesterday': 'yesterday', 
      'this week': 'week',
      'last week': 'week',
      'this month': 'month',
      'last month': 'month'
    };

    for (const [pattern, range] of Object.entries(datePatterns)) {
      if (lowerQuery.includes(pattern)) {
        dateRange = range;
        // Remove date keyword from search terms
        searchTerms = searchTerms.replace(new RegExp(pattern, 'gi'), '').trim();
        break;
      }
    }

    // Clean up search terms
    searchTerms = searchTerms.replace(/\s+/g, ' ').trim();
    
    return {
      searchTerms: searchTerms || '*', // Default to match all if no terms left
      category,
      dateRange,
      originalQuery: query
    };
  }

  /**
   * Get date filter for relative date ranges
   */
  getDateFilter(dateRange) {
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return format(now, 'yyyy-MM-dd') + 'T00:00:00.000Z';
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return format(yesterday, 'yyyy-MM-dd') + 'T00:00:00.000Z';
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      default:
        return '1970-01-01T00:00:00.000Z'; // Beginning of time
    }
  }

  /**
   * Index all currently organized files (bulk indexing)
   */
  async indexAllOrganizedFiles() {
    console.log('📚 Indexing all organized files...');
    
    const categories = ['Screenshots', 'Images', 'PDFs', 'Docs', 'Slides', 'Sheets', 
                       'Archives', 'Video', 'Audio', 'Apps', 'Misc'];
    
    let totalIndexed = 0;

    for (const category of categories) {
      const categoryPath = path.join(this.desktopPath, category);
      
      try {
        await fs.access(categoryPath);
        const indexed = await this.indexCategoryRecursively(categoryPath, category);
        totalIndexed += indexed;
      } catch (error) {
        // Category folder doesn't exist yet, skip
        continue;
      }
    }

    console.log(`📚 Indexed ${totalIndexed} files total`);
    return totalIndexed;
  }

  /**
   * Recursively index files in a category folder
   */
  async indexCategoryRecursively(folderPath, category, indexed = 0) {
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively index subdirectories
          indexed = await this.indexCategoryRecursively(fullPath, category, indexed);
        } else {
          // Index individual file
          try {
            const stats = await fs.stat(fullPath);
            const extension = path.extname(entry.name).toLowerCase().substring(1);
            
            await this.indexFile({
              filename: entry.name,
              originalPath: fullPath, // We don't have original path for existing files
              currentPath: fullPath,
              category,
              extension,
              size: stats.size,
              dateCreated: stats.birthtime.toISOString(),
              dateModified: stats.mtime.toISOString(),
              isFolder: false
            });
            
            indexed++;
          } catch (error) {
            console.error(`Could not index ${fullPath}:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.error(`Could not read folder ${folderPath}:`, error.message);
    }
    
    return indexed;
  }

  /**
   * Get search suggestions based on recent queries and indexed files
   */
  async getSearchSuggestions(partial = '') {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // Get popular categories and recent files
      const sql = `
        SELECT DISTINCT category, COUNT(*) as count
        FROM files 
        WHERE category LIKE ?
        GROUP BY category 
        ORDER BY count DESC, category ASC
        LIMIT 10
      `;
      
      this.db.all(sql, [`%${partial}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const suggestions = [
            ...rows.map(row => `${row.category} (${row.count} files)`),
            'PDFs from this week',
            'Screenshots today', 
            'Images from last month',
            'Documents this week'
          ];
          resolve(suggestions);
        }
      });
    });
  }

  /**
   * Get file statistics for the search UI
   */
  async getSearchStats() {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_files,
          COUNT(DISTINCT category) as categories,
          MAX(date_organized) as last_indexed,
          COUNT(CASE WHEN date_organized >= datetime('now', '-24 hours') THEN 1 END) as indexed_today
        FROM files
      `;
      
      this.db.get(sql, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalFiles: row.total_files || 0,
            categories: row.categories || 0,
            lastIndexed: row.last_indexed,
            indexedToday: row.indexed_today || 0,
            canSearch: (row.total_files || 0) > 0
          });
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing Smart Find database:', err);
          } else {
            console.log('📚 Smart Find database closed');
          }
          resolve();
        });
      });
    }
  }

  /**
   * Clear all indexed data (for reset/debugging)
   */
  async clearIndex() {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.db.exec('DELETE FROM files; DELETE FROM files_fts;', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📚 Smart Find index cleared');
          resolve();
        }
      });
    });
  }
}

module.exports = { SmartSearch };