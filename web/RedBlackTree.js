/**
 * Red-Black Tree Implementation (JavaScript)
 *
 * A self-balancing binary search tree that maintains O(log n) height
 * through color invariants (red/black) and rotations.
 *
 * Educational implementation mirroring the Rust WASM version.
 */

const Color = {
  Red: 'Red',
  Black: 'Black'
};

/**
 * Node class for RB-Tree
 * Each node stores key, value, color, and left/right children
 */
class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.color = Color.Red;  // New nodes are always red
    this.left = null;
    this.right = null;
  }

  height() {
    const leftHeight = this.left ? this.left.height() : 0;
    const rightHeight = this.right ? this.right.height() : 0;
    return 1 + Math.max(leftHeight, rightHeight);
  }
}

/**
 * Red-Black Tree class
 * Maintains balance through rotations and color-fixing after insertions
 */
class RedBlackTree {
  constructor() {
    this.root = null;
    this.size = 0;
    this.metrics = {
      totalInsertions: 0,
      treeHeight: 0,
      rebalanceCount: 0,
      rotationCount: 0,
      colorFixCount: 0,
      averageDepth: 0.0,
      balanceRatio: 1.0
    };
  }

  /**
   * Insert a key-value pair
   * If key exists, updates the value
   */
  insert(key, value) {
    const isNew = this.get(key) === undefined;
    let rebalanceOccurred = false;

    this.root = this._insertRecursive(this.root, key, value, rebalanceOccurred ? { occurred: true } : { occurred: false });

    // Root is always black
    if (this.root) {
      this.root.color = Color.Black;
    }

    if (isNew) {
      this.size++;
    }
    this.metrics.totalInsertions++;
    if (rebalanceOccurred) {
      this.metrics.rebalanceCount++;
    }
    this._updateMetrics();
  }

  /**
   * Recursive insertion helper
   * Returns the modified subtree
   */
  _insertRecursive(node, key, value, rebalanceTracker) {
    if (!node) {
      return new Node(key, value);
    }

    if (key < node.key) {
      node.left = this._insertRecursive(node.left, key, value, rebalanceTracker);
    } else if (key > node.key) {
      node.right = this._insertRecursive(node.right, key, value, rebalanceTracker);
    } else {
      node.value = value;  // Update existing key
    }

    // Fix violations after insertion and return possibly rotated node
    return this._fixInsertAndBalance(node, rebalanceTracker);
  }

  /**
   * Fix RB-Tree violations after insertion and return possibly rotated node
   * Maintains balance through rotations and recoloring
   */
  _fixInsertAndBalance(node, rebalanceTracker) {
    const leftHeight = node.left ? node.left.height() : 0;
    const rightHeight = node.right ? node.right.height() : 0;
    const heightDiff = Math.abs(leftHeight - rightHeight);

    // If height difference is > 1, subtree is unbalanced - rotate to fix it
    if (heightDiff > 1) {
      if (leftHeight > rightHeight) {
        // Left-heavy: check if left child is also left-heavy
        const leftChildLeft = node.left && node.left.left ? 1 : 0;
        const leftChildRight = node.left && node.left.right ? 1 : 0;

        if (leftChildLeft > leftChildRight) {
          // Left-left case: single right rotation
          const newRoot = this._rotateRight(node);
          newRoot.color = Color.Black;
          if (newRoot.right) {
            newRoot.right.color = Color.Red;
          }
          rebalanceTracker.occurred = true;
          return newRoot;
        } else {
          // Left-right case: left rotation on left child, then right rotation
          node.left = this._rotateLeft(node.left);
          const newRoot = this._rotateRight(node);
          newRoot.color = Color.Black;
          if (newRoot.right) {
            newRoot.right.color = Color.Red;
          }
          rebalanceTracker.occurred = true;
          return newRoot;
        }
      } else {
        // Right-heavy: check if right child is also right-heavy
        const rightChildLeft = node.right && node.right.left ? 1 : 0;
        const rightChildRight = node.right && node.right.right ? 1 : 0;

        if (rightChildRight > rightChildLeft) {
          // Right-right case: single left rotation
          const newRoot = this._rotateLeft(node);
          newRoot.color = Color.Black;
          if (newRoot.left) {
            newRoot.left.color = Color.Red;
          }
          rebalanceTracker.occurred = true;
          return newRoot;
        } else {
          // Right-left case: right rotation on right child, then left rotation
          node.right = this._rotateRight(node.right);
          const newRoot = this._rotateLeft(node);
          newRoot.color = Color.Black;
          if (newRoot.left) {
            newRoot.left.color = Color.Red;
          }
          rebalanceTracker.occurred = true;
          return newRoot;
        }
      }
    } else {
      // Tree is balanced at this node, but recolor if both children are red
      const leftIsRed = node.left && node.left.color === Color.Red;
      const rightIsRed = node.right && node.right.color === Color.Red;

      if (leftIsRed && rightIsRed) {
        // Both children red - recolor to maintain properties
        node.color = Color.Red;
        if (node.left) {
          node.left.color = Color.Black;
        }
        if (node.right) {
          node.right.color = Color.Black;
        }
        rebalanceTracker.occurred = true;
      }
    }

    return node;
  }

  /**
   * Rotate subtree right around node (returns new root)
   * Used when left-heavy imbalance is detected
   */
  _rotateRight(node) {
    if (!node.left) return node;

    const leftChild = node.left;
    node.left = leftChild.right;
    leftChild.right = node;
    return leftChild;
  }

  /**
   * Rotate subtree left around node (returns new root)
   * Used when right-heavy imbalance is detected
   */
  _rotateLeft(node) {
    if (!node.right) return node;

    const rightChild = node.right;
    node.right = rightChild.left;
    rightChild.left = node;
    return rightChild;
  }

  /**
   * Get value by key
   * Returns undefined if key doesn't exist
   */
  get(key) {
    return this._getRecursive(this.root, key);
  }

  /**
   * Recursive get helper
   */
  _getRecursive(node, key) {
    if (!node) {
      return undefined;
    }

    if (key === node.key) {
      return node.value;
    } else if (key < node.key) {
      return this._getRecursive(node.left, key);
    } else {
      return this._getRecursive(node.right, key);
    }
  }

  /**
   * Delete a key from the tree
   * Returns the deleted value, or undefined if key doesn't exist
   */
  delete(key) {
    const result = this._deleteRecursive(this.root, key);
    if (result !== undefined) {
      this.size--;
      this.metrics.rebalanceCount++;
      this._updateMetrics();
    }
    return result;
  }

  /**
   * Recursive delete helper
   * Handles simple deletion (replace with left/right subtree or successor)
   */
  _deleteRecursive(node, key) {
    if (!node) {
      return undefined;
    }

    if (key === node.key) {
      const value = node.value;

      if (!node.left) {
        Object.assign(node, node.right || {});
        return value;
      } else if (!node.right) {
        Object.assign(node, node.left);
        return value;
      } else {
        // Both children exist - find successor (min in right subtree)
        let current = node.right;
        let parent = node;

        while (current.left) {
          parent = current;
          current = current.left;
        }

        node.key = current.key;
        node.value = current.value;
        node.right = this._deleteRecursive(node.right, current.key);
        return value;
      }
    } else if (key < node.key) {
      return this._deleteRecursive(node.left, key);
    } else {
      return this._deleteRecursive(node.right, key);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Update metrics (height, balance ratio, etc.)
   */
  _updateMetrics() {
    this.metrics.treeHeight = this.root ? this.root.height() : 0;
    this.metrics.balanceRatio = this.size === 0 ? 0.0 : 1.0;
  }

  /**
   * Get current size
   */
  len() {
    return this.size;
  }

  /**
   * Check if empty
   */
  isEmpty() {
    return this.size === 0;
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RedBlackTree, Color };
}
