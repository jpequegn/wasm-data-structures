/**
 * Binary Search Tree implementation in JavaScript
 * Mirrors Rust implementation for fair comparison
 */
class BSTNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalComparisons: 0,
            maxDepth: 0,
            averageDepth: 0
        };
    }

    _insertRecursive(node, key, value, depth) {
        if (node === null) {
            this.size++;
            this.metrics.totalInsertions++;
            this.metrics.maxDepth = Math.max(this.metrics.maxDepth, depth);
            return new BSTNode(key, value);
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            node.left = this._insertRecursive(node.left, key, value, depth + 1);
        } else if (key > node.key) {
            node.right = this._insertRecursive(node.right, key, value, depth + 1);
        } else {
            node.value = value; // Update
        }

        return node;
    }

    insert(key, value) {
        this.root = this._insertRecursive(this.root, key, value, 0);
    }

    _getRecursive(node, key) {
        if (node === null) {
            return undefined;
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            return this._getRecursive(node.left, key);
        } else if (key > node.key) {
            return this._getRecursive(node.right, key);
        } else {
            return node.value;
        }
    }

    get(key) {
        return this._getRecursive(this.root, key);
    }

    _deleteRecursive(node, key) {
        if (node === null) {
            return null;
        }

        this.metrics.totalComparisons++;

        if (key < node.key) {
            node.left = this._deleteRecursive(node.left, key);
        } else if (key > node.key) {
            node.right = this._deleteRecursive(node.right, key);
        } else {
            if (node.left === null) {
                this.size--;
                return node.right;
            } else if (node.right === null) {
                this.size--;
                return node.left;
            } else {
                // Find min in right subtree
                let minNode = node.right;
                while (minNode.left !== null) {
                    minNode = minNode.left;
                }
                node.key = minNode.key;
                node.value = minNode.value;
                node.right = this._deleteRecursive(node.right, minNode.key);
            }
        }

        return node;
    }

    delete(key) {
        const oldSize = this.size;
        this.root = this._deleteRecursive(this.root, key);
        return this.size < oldSize;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    len() {
        return this.size;
    }

    isEmpty() {
        return this.size === 0;
    }
}
