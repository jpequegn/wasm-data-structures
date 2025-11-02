/**
 * OpenAddressingHashTable - Hash table with linear probing
 * Demonstrates collision resolution via open addressing
 */
class OpenAddressingHashTable {
    constructor(capacity = 256) {
        this.capacity = capacity;
        this.table = new Array(capacity);
        this.size = 0;
        this.metrics = {
            totalInsertions: 0,
            totalProbes: 0,
            maxProbeLength: 0,
            loadFactor: 0,
            clusteringFactor: 0,
            tombstoneCount: 0,
        };
    }

    /**
     * FNV-like hash function
     */
    hashKey(key) {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // 32-bit multiplication
        }
        return Math.abs(hash);
    }

    /**
     * Get bucket index from hash
     */
    bucketIndex(hash) {
        return hash % this.capacity;
    }

    /**
     * Insert or update key-value pair
     */
    insert(key, value) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);
        let probeCount = 0;

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                // Found empty slot
                this.table[index] = { key, value, tombstone: false };
                this.size++;
                this.metrics.totalInsertions++;
                this.metrics.totalProbes += probeCount;
                if (probeCount > this.metrics.maxProbeLength) {
                    this.metrics.maxProbeLength = probeCount;
                }
                this.updateLoadFactor();
                return;
            } else if (slot.key === key && !slot.tombstone) {
                // Update existing key
                this.table[index] = { key, value, tombstone: false };
                this.metrics.totalInsertions++;
                this.metrics.totalProbes += probeCount;
                return;
            }

            // Probe next slot
            probeCount++;
            index = (index + 1) % capacity;

            if (probeCount > capacity) {
                throw new Error('Hash table is full');
            }
        }
    }

    /**
     * Get value for key
     */
    get(key) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);
        let probeCount = 0;

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                // Key not found
                this.metrics.totalProbes += probeCount;
                return undefined;
            } else if (slot.key === key && !slot.tombstone) {
                // Found key
                this.metrics.totalProbes += probeCount;
                return slot.value;
            }

            // Probe next slot
            probeCount++;
            index = (index + 1) % capacity;

            if (probeCount > capacity) {
                return undefined;
            }
        }
    }

    /**
     * Delete key (mark as tombstone)
     */
    delete(key) {
        let hash = this.hashKey(key);
        let capacity = this.capacity;
        let index = this.bucketIndex(hash);

        while (true) {
            const slot = this.table[index];

            if (slot === undefined) {
                return undefined;
            } else if (slot.key === key && !slot.tombstone) {
                slot.tombstone = true;
                this.size--;
                this.metrics.tombstoneCount++;
                this.updateLoadFactor();
                return slot.value;
            }

            index = (index + 1) % capacity;

            if (index === this.bucketIndex(hash)) {
                return undefined; // Wrapped around
            }
        }
    }

    /**
     * Update load factor and clustering metrics
     */
    updateLoadFactor() {
        this.metrics.loadFactor = this.size / this.capacity;

        // Calculate clustering factor (max consecutive non-empty slots)
        let consecutive = 0;
        let maxConsecutive = 0;

        for (let i = 0; i < this.capacity; i++) {
            if (this.table[i] !== undefined) {
                consecutive++;
                if (consecutive > maxConsecutive) {
                    maxConsecutive = consecutive;
                }
            } else {
                consecutive = 0;
            }
        }

        this.metrics.clusteringFactor = maxConsecutive / this.capacity;
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
}
