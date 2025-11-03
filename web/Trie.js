/**
 * Trie (Prefix Tree) Implementation (JavaScript)
 *
 * A tree-based data structure for efficient string storage and retrieval.
 * Each node represents a character, and paths from root to nodes form words.
 *
 * Use cases:
 * - Autocomplete/search suggestions
 * - Spell checking
 * - IP routing (longest prefix matching)
 * - Dictionary implementations
 *
 * Time complexity:
 * - Insert: O(m) where m = length of word
 * - Search: O(m)
 * - StartsWith (prefix): O(m)
 * - Autocomplete: O(m + k) where k = number of results
 *
 * Educational implementation mirroring the Rust WASM version.
 */

/**
 * TrieNode class
 * Each node represents a character in a word
 */
class TrieNode {
  constructor() {
    // Map of character -> TrieNode
    this.children = new Map();
    // True if this node marks the end of a valid word
    this.isEndOfWord = false;
    // Optional value associated with the word (null if just tracking presence)
    this.value = null;
  }
}

/**
 * Trie (Prefix Tree) class
 * Maintains a tree of characters for efficient prefix-based operations
 */
class Trie {
  constructor() {
    // Root node represents empty string
    this.root = new TrieNode();
    // Number of words stored
    this.size = 0;
    // Performance and structure metrics
    this.metrics = {
      totalInsertions: 0,
      totalSearches: 0,
      totalPrefixMatches: 0,
      nodeCount: 1, // Start with root node
      maxDepth: 0,
      averageWordLength: 0,
    };
  }

  /**
   * Insert a word into the Trie with an optional value
   * If word exists, updates its value
   *
   * Algorithm:
   * 1. Start at root node
   * 2. For each character in word:
   *    - Create child node if doesn't exist
   *    - Move to child node
   * 3. Mark final node as end of word
   * 4. Store value if provided
   *
   * Time: O(m) where m = word length
   * Space: O(m) worst case (all new characters)
   *
   * @param {string} word - The word to insert
   * @param {number} value - Optional value to associate with word
   */
  insert(word, value = null) {
    if (!word || word.length === 0) {
      return;
    }

    let current = this.root;
    let depth = 0;
    let nodesCreated = 0;

    // Traverse or create path for each character
    for (const char of word) {
      depth++;

      if (!current.children.has(char)) {
        // Create new node for this character
        current.children.set(char, new TrieNode());
        nodesCreated++;
      }

      current = current.children.get(char);
    }

    // Mark this node as end of a word
    const isNewWord = !current.isEndOfWord;
    current.isEndOfWord = true;
    current.value = value;

    // Update metrics
    if (isNewWord) {
      this.size++;
    }
    this.metrics.totalInsertions++;
    this.metrics.nodeCount += nodesCreated;
    this.metrics.maxDepth = Math.max(this.metrics.maxDepth, depth);

    // Update average word length
    this.updateAverageWordLength();
  }

  /**
   * Search for a word in the Trie
   * Returns the associated value if found, undefined otherwise
   *
   * Algorithm:
   * 1. Start at root node
   * 2. For each character in word:
   *    - Return undefined if character path doesn't exist
   *    - Move to child node
   * 3. Check if final node marks end of word
   *
   * Time: O(m) where m = word length
   *
   * @param {string} word - The word to search for
   * @returns {number|undefined} The value associated with the word, or undefined if not found
   */
  search(word) {
    this.metrics.totalSearches++;

    if (!word || word.length === 0) {
      return undefined;
    }

    let current = this.root;

    // Traverse the trie following the word's characters
    for (const char of word) {
      if (!current.children.has(char)) {
        return undefined;
      }
      current = current.children.get(char);
    }

    // Check if this path represents a complete word
    return current.isEndOfWord ? current.value : undefined;
  }

  /**
   * Check if any word in the Trie starts with the given prefix
   *
   * Algorithm:
   * 1. Traverse to the node representing the prefix
   * 2. Return true if we can reach the end of prefix
   *
   * Time: O(m) where m = prefix length
   *
   * @param {string} prefix - The prefix to check
   * @returns {boolean} True if at least one word starts with prefix
   */
  startsWith(prefix) {
    this.metrics.totalPrefixMatches++;

    if (!prefix || prefix.length === 0) {
      return this.size > 0;
    }

    let current = this.root;

    // Traverse the trie following the prefix's characters
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char);
    }

    // If we reach here, prefix exists in trie
    return true;
  }

  /**
   * Get all words that start with the given prefix
   * Returns an array of words sorted alphabetically
   *
   * Algorithm:
   * 1. Navigate to node representing prefix
   * 2. Perform DFS from that node to collect all complete words
   * 3. Sort results alphabetically
   *
   * Time: O(m + k) where m = prefix length, k = number of results
   *
   * @param {string} prefix - The prefix to search for
   * @returns {Array<string>} Array of words starting with prefix (sorted)
   */
  autocomplete(prefix) {
    this.metrics.totalPrefixMatches++;

    if (!prefix) {
      prefix = '';
    }

    let current = this.root;

    // Navigate to the prefix node
    for (const char of prefix) {
      if (!current.children.has(char)) {
        return []; // Prefix not found
      }
      current = current.children.get(char);
    }

    // Collect all words starting from this node
    const results = [];
    this._collectWords(current, prefix, results);

    // Sort results alphabetically
    results.sort();

    return results;
  }

  /**
   * Helper method to collect all words starting from a given node
   * Uses depth-first search (DFS) to traverse all paths
   *
   * @param {TrieNode} node - The starting node
   * @param {string} currentWord - The word formed so far
   * @param {Array<string>} results - Array to store found words
   * @private
   */
  _collectWords(node, currentWord, results) {
    // If this node marks end of word, add it to results
    if (node.isEndOfWord) {
      results.push(currentWord);
    }

    // Recursively explore all children
    // Sort keys to ensure deterministic order
    const sortedChars = Array.from(node.children.keys()).sort();
    for (const char of sortedChars) {
      this._collectWords(
        node.children.get(char),
        currentWord + char,
        results
      );
    }
  }

  /**
   * Delete a word from the Trie
   * Returns true if word was found and deleted, false otherwise
   *
   * Algorithm:
   * 1. Find the word in the trie
   * 2. Mark the final node as not end of word
   * 3. Optionally prune unnecessary nodes (not implemented for simplicity)
   *
   * Time: O(m) where m = word length
   *
   * @param {string} word - The word to delete
   * @returns {boolean} True if word was deleted, false if not found
   */
  delete(word) {
    if (!word || word.length === 0) {
      return false;
    }

    let current = this.root;
    const path = [this.root];

    // Traverse to find the word, tracking path
    for (const char of word) {
      if (!current.children.has(char)) {
        return false; // Word doesn't exist
      }
      current = current.children.get(char);
      path.push(current);
    }

    // Check if this is actually a word
    if (!current.isEndOfWord) {
      return false;
    }

    // Mark as not end of word
    current.isEndOfWord = false;
    current.value = null;
    this.size--;

    // Note: We don't prune nodes for simplicity
    // In production, you might want to remove nodes with no children
    // and no isEndOfWord flag to save memory

    this.updateAverageWordLength();
    return true;
  }

  /**
   * Update average word length metric
   * Traverses entire trie to calculate accurate average
   * @private
   */
  updateAverageWordLength() {
    if (this.size === 0) {
      this.metrics.averageWordLength = 0;
      return;
    }

    let totalLength = 0;
    let wordCount = 0;

    const traverse = (node, depth) => {
      if (node.isEndOfWord) {
        totalLength += depth;
        wordCount++;
      }
      for (const child of node.children.values()) {
        traverse(child, depth + 1);
      }
    };

    traverse(this.root, 0);
    this.metrics.averageWordLength = wordCount > 0 ? totalLength / wordCount : 0;
  }

  /**
   * Get copy of current metrics
   * @returns {object} Metrics object with performance statistics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get number of words in the Trie
   * @returns {number} Number of complete words stored
   */
  len() {
    return this.size;
  }

  /**
   * Check if the Trie is empty
   * @returns {boolean} True if no words are stored
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * Get all words in the Trie (sorted alphabetically)
   * @returns {Array<string>} Array of all words
   */
  getAllWords() {
    return this.autocomplete('');
  }

  /**
   * Debug method: Print Trie structure
   * Shows tree hierarchy with indentation
   */
  _debug_print() {
    console.log('Trie Structure:');
    console.log(`Size: ${this.size} words`);
    console.log(`Nodes: ${this.metrics.nodeCount}`);
    console.log(`Max Depth: ${this.metrics.maxDepth}`);
    console.log('');

    const printNode = (node, prefix, char) => {
      const marker = node.isEndOfWord ? ' [END]' : '';
      const value = node.value !== null ? ` (${node.value})` : '';
      console.log(prefix + char + marker + value);

      const sortedChars = Array.from(node.children.keys()).sort();
      for (const c of sortedChars) {
        printNode(node.children.get(c), prefix + '  ', c);
      }
    };

    console.log('ROOT');
    const sortedChars = Array.from(this.root.children.keys()).sort();
    for (const char of sortedChars) {
      printNode(this.root.children.get(char), '  ', char);
    }
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Trie;
}
