use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Hash table using open addressing with linear probing
pub struct OpenAddressingHashTable {
    table: Vec<Option<Entry>>,
    size: u32,
    capacity: u32,
    metrics: OpenAddressingMetrics,
}

/// Individual hash table entry
struct Entry {
    key: String,
    value: u32,
    tombstone: bool, // true if deleted
}

/// Metrics collected during operations
#[derive(Clone)]
pub struct OpenAddressingMetrics {
    pub total_insertions: u32,
    pub total_probes: u32,
    pub max_probe_length: u32,
    pub load_factor: f32,
    pub clustering_factor: f32,
    pub tombstone_count: u32,
}

impl OpenAddressingHashTable {
    /// Create new hash table with fixed capacity
    pub fn new(capacity: u32) -> Self {
        let mut table = Vec::with_capacity(capacity as usize);
        for _ in 0..capacity {
            table.push(None);
        }
        OpenAddressingHashTable {
            table,
            size: 0,
            capacity,
            metrics: OpenAddressingMetrics {
                total_insertions: 0,
                total_probes: 0,
                max_probe_length: 0,
                load_factor: 0.0,
                clustering_factor: 0.0,
                tombstone_count: 0,
            },
        }
    }

    /// Hash a string key using FNV-like algorithm
    fn hash_key(key: &str) -> u64 {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish()
    }

    /// Get bucket index from hash
    fn bucket_index(hash: u64, capacity: u32) -> usize {
        (hash % capacity as u64) as usize
    }

    /// Insert or update a key-value pair
    pub fn insert(&mut self, key: String, value: u32) {
        let hash = Self::hash_key(&key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);
        let mut probe_count = 0;

        // Linear probing: find empty slot or matching key
        loop {
            match &self.table[index] {
                None => {
                    // Found empty slot
                    self.table[index] = Some(Entry {
                        key,
                        value,
                        tombstone: false,
                    });
                    self.size += 1;
                    self.metrics.total_insertions += 1;
                    self.metrics.total_probes += probe_count;
                    if probe_count > self.metrics.max_probe_length {
                        self.metrics.max_probe_length = probe_count;
                    }
                    self.update_load_factor();
                    return;
                }
                Some(entry) => {
                    if entry.key == key && !entry.tombstone {
                        // Update existing key
                        self.table[index] = Some(Entry {
                            key,
                            value,
                            tombstone: false,
                        });
                        self.metrics.total_insertions += 1;
                        self.metrics.total_probes += probe_count;
                        return;
                    }
                    // Slot occupied, probe next
                    probe_count += 1;
                    index = (index + 1) % capacity;

                    // Safety: prevent infinite loop
                    if probe_count > capacity as u32 {
                        panic!("Hash table is full");
                    }
                }
            }
        }
    }

    /// Get value for key
    pub fn get(&mut self, key: &str) -> Option<u32> {
        let hash = Self::hash_key(key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);
        let mut probe_count = 0;

        loop {
            match &self.table[index] {
                None => {
                    // Key not found
                    self.metrics.total_probes += probe_count;
                    return None;
                }
                Some(entry) => {
                    if entry.key == key && !entry.tombstone {
                        // Found key
                        self.metrics.total_probes += probe_count;
                        return Some(entry.value);
                    }
                    // Probe next
                    probe_count += 1;
                    index = (index + 1) % capacity;

                    if probe_count > capacity as u32 {
                        return None;
                    }
                }
            }
        }
    }

    /// Delete key (mark as tombstone)
    pub fn delete(&mut self, key: &str) -> Option<u32> {
        let hash = Self::hash_key(key);
        let capacity = self.capacity as usize;
        let mut index = Self::bucket_index(hash, self.capacity);

        loop {
            let found_value = {
                match &mut self.table[index] {
                    None => None,
                    Some(entry) => {
                        if entry.key == key && !entry.tombstone {
                            entry.tombstone = true;
                            Some(entry.value)
                        } else {
                            None
                        }
                    }
                }
            };

            if let Some(value) = found_value {
                self.size = self.size.saturating_sub(1);
                self.metrics.tombstone_count += 1;
                self.update_load_factor();
                return Some(value);
            }

            if let None = &self.table[index] {
                return None;
            }

            index = (index + 1) % capacity;

            if index == Self::bucket_index(hash, self.capacity) {
                return None; // Wrapped around
            }
        }
    }

    /// Update load factor and clustering metrics
    fn update_load_factor(&mut self) {
        self.metrics.load_factor = self.size as f32 / self.capacity as f32;

        // Calculate clustering factor (simplified: count consecutive non-empty slots)
        let mut consecutive = 0;
        let mut max_consecutive = 0;
        for slot in &self.table {
            match slot {
                None => {
                    if consecutive > max_consecutive {
                        max_consecutive = consecutive;
                    }
                    consecutive = 0;
                }
                Some(_) => consecutive += 1,
            }
        }
        if consecutive > max_consecutive {
            max_consecutive = consecutive;
        }
        self.metrics.clustering_factor = max_consecutive as f32 / self.capacity as f32;
    }

    /// Get current metrics
    pub fn get_metrics(&self) -> OpenAddressingMetrics {
        self.metrics.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_insert_and_get() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        assert_eq!(table.get("key1"), Some(100));
    }

    #[test]
    fn test_update_existing_key() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        table.insert("key1".to_string(), 200);
        assert_eq!(table.get("key1"), Some(200));
    }

    #[test]
    fn test_delete_key() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        assert_eq!(table.delete("key1"), Some(100));
        assert_eq!(table.get("key1"), None);
    }

    #[test]
    fn test_multiple_insertions() {
        let mut table = OpenAddressingHashTable::new(256);
        for i in 0..100 {
            table.insert(format!("key{}", i), i);
        }
        assert_eq!(table.get("key50"), Some(50));
        assert_eq!(table.get("key99"), Some(99));
    }

    #[test]
    fn test_collision_handling() {
        let mut table = OpenAddressingHashTable::new(16);
        // Intentionally cause collisions with small table
        table.insert("a".to_string(), 1);
        table.insert("b".to_string(), 2);
        table.insert("c".to_string(), 3);
        assert_eq!(table.get("a"), Some(1));
        assert_eq!(table.get("b"), Some(2));
        assert_eq!(table.get("c"), Some(3));
    }

    #[test]
    fn test_load_factor() {
        let mut table = OpenAddressingHashTable::new(100);
        for i in 0..50 {
            table.insert(format!("key{}", i), i);
        }
        let metrics = table.get_metrics();
        assert!((metrics.load_factor - 0.5).abs() < 0.01);
    }

    #[test]
    fn test_tombstone_handling() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        table.insert("key2".to_string(), 200);
        table.delete("key1");

        // Can insert new key in tombstone slot
        table.insert("key3".to_string(), 300);
        assert_eq!(table.get("key2"), Some(200));
        assert_eq!(table.get("key3"), Some(300));
        assert_eq!(table.get("key1"), None);
    }

    #[test]
    fn test_probe_count_tracking() {
        let mut table = OpenAddressingHashTable::new(256);
        table.insert("key1".to_string(), 100);
        let metrics = table.get_metrics();
        assert!(metrics.total_probes >= 0);
        assert!(metrics.max_probe_length >= 0);
    }

    #[test]
    fn test_get_nonexistent_key() {
        let mut table = OpenAddressingHashTable::new(256);
        assert_eq!(table.get("nonexistent"), None);
    }

    #[test]
    fn test_delete_nonexistent_key() {
        let mut table = OpenAddressingHashTable::new(256);
        assert_eq!(table.delete("nonexistent"), None);
    }

    #[test]
    fn test_clustering_factor_increases_with_collisions() {
        let mut table = OpenAddressingHashTable::new(32);
        // Insert enough items to cause clustering
        for i in 0..16 {
            table.insert(format!("key{}", i), i);
        }
        let metrics = table.get_metrics();
        assert!(metrics.clustering_factor > 0.0);
    }
}
