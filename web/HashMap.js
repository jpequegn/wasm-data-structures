/**
 * JavaScript HashMap using separate chaining
 * Mirrors Rust implementation for fair comparison
 */
class HashMap {
    constructor(capacity = 256) {
        this.capacity = capacity;
        this.buckets = Array(capacity).fill(null).map(() => []);
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalCollisions: 0,
            maxChainLength: 0,
            averageLoadFactor: 0
        };
    }

    /**
     * Simple hash function for strings
     * Uses character codes and FNV-like mixing
     */
    _hash(key) {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // FNV prime, keep as uint32
        }
        return Math.abs(hash);
    }

    /**
     * Get bucket index from hash
     */
    _bucketIndex(hash) {
        return hash % this.capacity;
    }

    /**
     * Update metrics after insertion
     */
    _updateMetrics(wasCollision) {
        this.metrics.totalInsertions++;
        if (wasCollision) {
            this.metrics.totalCollisions++;
        }

        // Recalculate max chain length
        this.metrics.maxChainLength = Math.max(
            ...this.buckets.map(b => b.length)
        );

        // Recalculate load factor
        this.metrics.averageLoadFactor = this.size / this.capacity;
    }

    /**
     * Insert key-value pair
     */
    insert(key, value) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        // Check if key exists
        for (let entry of bucket) {
            if (entry[0] === key) {
                entry[1] = value;
                return; // Update, not collision
            }
        }

        // New key
        const wasCollision = bucket.length > 0;
        bucket.push([key, value]);
        this.size++;
        this._updateMetrics(wasCollision);
    }

    /**
     * Get value by key
     */
    get(key) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        for (let [k, v] of bucket) {
            if (k === key) {
                return v;
            }
        }
        return undefined;
    }

    /**
     * Delete key
     */
    delete(key) {
        const hash = this._hash(key);
        const idx = this._bucketIndex(hash);
        const bucket = this.buckets[idx];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket.splice(i, 1);
                this.size--;
                return true;
            }
        }
        return false;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get size
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
