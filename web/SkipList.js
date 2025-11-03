/**
 * Skip List Implementation (JavaScript)
 *
 * A probabilistic data structure that uses multiple levels of linked lists
 * to achieve O(log n) search, insert, and delete operations without explicit balancing.
 *
 * Educational implementation mirroring the Rust WASM version.
 */

const MAX_LEVEL = 16;
const LEVEL_PROBABILITY = 0.5;

/**
 * Node class for Skip List
 * Each node stores key, value, level, and forward pointers for each level
 */
class SkipListNode {
  constructor(key, value, level) {
    this.key = key;
    this.value = value;
    this.level = level;
    // Forward pointers for each level (0 to level inclusive)
    this.forward = new Array(level + 1).fill(null);
  }
}

/**
 * Skip List class
 * Maintains multiple levels of linked lists for fast searching
 */
class SkipList {
  constructor() {
    // Create sentinel head node that connects all levels
    this.head = new SkipListNode('', 0, MAX_LEVEL);
    this.level = 0;  // Current highest level in use
    this.size = 0;   // Number of elements
    this.metrics = {
      totalInsertions: 0,
      totalSearches: 0,
      searchComparisons: 0,
      averageLevel: 0.0,
      maxLevel: 0,
      insertionCost: 0,
    };
  }

  /**
   * Generate random level for new node using exponential distribution
   * Returns level 0 with P=0.5, level 1 with P=0.25, level 2 with P=0.125, etc.
   *
   * This probabilistic approach is what makes skip lists "work" without
   * explicit balancing like red-black trees.
   */
  randomLevel() {
    let level = 0;
    while (level < MAX_LEVEL && Math.random() < LEVEL_PROBABILITY) {
      level++;
    }
    return level;
  }

  /**
   * Insert a key-value pair into the skip list
   * If key already exists, updates the value
   *
   * Algorithm:
   * 1. Search for insertion position, tracking update points at each level
   * 2. Check if key exists; if so, update value
   * 3. Otherwise, generate random level for new node
   * 4. Create node and link it into all levels up to its random level
   * 5. Update metrics
   */
  insert(key, value) {
    // Track nodes that need to be updated at each level
    const update = new Array(MAX_LEVEL + 1);
    let current = this.head;

    // Find insertion points at each level (top to bottom)
    // At each level, move right while keys are smaller than target
    for (let lv = this.level; lv >= 0; lv--) {
      while (current.forward[lv] && current.forward[lv].key < key) {
        current = current.forward[lv];
      }
      // Store the node that will point to our new node at this level
      update[lv] = current;
    }

    // Move to next node at level 0 to check if key exists
    current = current.forward[0];

    // Check if we're updating an existing node
    if (current && current.key === key) {
      // Update existing node's value
      current.value = value;
      this.metrics.totalInsertions++;
    } else {
      // Generate random level for new node (probabilistic balancing)
      const newLevel = this.randomLevel();

      // Expand list level if necessary
      if (newLevel > this.level) {
        for (let lv = this.level + 1; lv <= newLevel; lv++) {
          update[lv] = this.head;
        }
        this.level = newLevel;
      }

      // Create new node
      const newNode = new SkipListNode(key, value, newLevel);

      // Insert new node at appropriate levels
      for (let lv = 0; lv <= newLevel; lv++) {
        // Link new node into the list at this level
        newNode.forward[lv] = update[lv].forward[lv];
        update[lv].forward[lv] = newNode;
      }

      this.size++;
      this.metrics.totalInsertions++;
    }

    // Update metrics less frequently for performance
    if (this.metrics.totalInsertions % 100 === 0 || this.size < 100) {
      this.updateMetrics();
    }
  }

  /**
   * Search for a key in the skip list
   * Returns the value if found, undefined otherwise
   *
   * Algorithm:
   * 1. Start at highest level of head node
   * 2. At each level, move right while keys are smaller than target
   * 3. Drop down one level when can't move right anymore
   * 4. Check exact match at level 0
   *
   * Time complexity: O(log n) expected
   */
  search(key) {
    this.metrics.totalSearches++;
    let comparisons = 0;
    let current = this.head;

    // Start from highest level and work down
    for (let lv = this.level; lv >= 0; lv--) {
      // Move right at current level while keys are smaller
      while (current.forward[lv]) {
        comparisons++;
        if (current.forward[lv].key < key) {
          current = current.forward[lv];
        } else {
          break;
        }
      }
    }

    // Move to next node at level 0
    current = current.forward[0];

    // Check exact match
    if (current && current.key === key) {
      this.metrics.searchComparisons += comparisons;
      return current.value;
    }

    this.metrics.searchComparisons += comparisons;
    return undefined;
  }

  /**
   * Delete a key from the skip list
   * Returns the deleted value if found, undefined otherwise
   *
   * Algorithm:
   * 1. Find node and all update points (similar to insert)
   * 2. Unlink node from all levels where it appears
   * 3. Update metrics and size
   */
  delete(key) {
    // Track nodes that need to be updated at each level
    const update = new Array(MAX_LEVEL + 1);
    let current = this.head;

    // Find the node and update points
    for (let lv = this.level; lv >= 0; lv--) {
      while (current.forward[lv] && current.forward[lv].key < key) {
        current = current.forward[lv];
      }
      update[lv] = current;
    }

    // Move to next node at level 0
    current = current.forward[0];

    // Check if node exists
    if (current && current.key === key) {
      const value = current.value;

      // Remove from all levels where it appears
      for (let lv = 0; lv <= this.level; lv++) {
        if (update[lv].forward[lv] && update[lv].forward[lv].key === key) {
          update[lv].forward[lv] = update[lv].forward[lv].forward[lv];
        }
      }

      // Reduce level if no nodes at highest level
      while (this.level > 0 && !this.head.forward[this.level]) {
        this.level--;
      }

      this.size--;
      this.updateMetrics();
      return value;
    }

    return undefined;
  }

  /**
   * Update metrics by traversing level 0
   * Calculates average level of all nodes (should be ~log2(n))
   */
  updateMetrics() {
    let totalLevel = 0;
    let count = 0;
    let current = this.head.forward[0];

    // Traverse level 0 to calculate average node level
    while (current) {
      totalLevel += current.level;
      count++;
      current = current.forward[0];
    }

    this.metrics.averageLevel = count > 0 ? totalLevel / count : 0;
    this.metrics.maxLevel = this.level;
  }

  /**
   * Get copy of current metrics
   * Always updates metrics before returning to ensure accuracy
   */
  getMetrics() {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get number of elements in the list
   */
  len() {
    return this.size;
  }

  /**
   * Check if the list is empty
   */
  isEmpty() {
    return this.size === 0;
  }

  /**
   * Debug method: Print structure of skip list
   * Shows which nodes appear at which levels
   */
  _debug_print() {
    console.log('Skip List Structure:');
    console.log(`Level: ${this.level}, Size: ${this.size}`);

    for (let lv = this.level; lv >= 0; lv--) {
      let line = `Level ${lv}: HEAD -> `;
      let current = this.head.forward[lv];
      while (current) {
        line += `${current.key}(${current.value}) -> `;
        current = current.forward[lv];
      }
      line += 'NULL';
      console.log(line);
    }
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkipList;
}
