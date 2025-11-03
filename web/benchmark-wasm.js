/**
 * Wrapper for WASM HashMap benchmarks
 * Loads compiled Rust HashMap and provides benchmarking interface
 */
let wasmModule = null;

async function initWasm() {
    try {
        wasmModule = await import('./pkg/wasm_data_structures.js');
        await wasmModule.default();
        return true;
    } catch (e) {
        console.error('Failed to load WASM:', e);
        log('ERROR: Could not load WASM module: ' + e.message);
        return false;
    }
}

async function benchmarkWasmHashMap() {
    if (!wasmModule) {
        const loaded = await initWasm();
        if (!loaded) {
            log('ERROR: Could not load WASM module');
            return;
        }
    }

    log('=== Rust/WASM HashMap Benchmark ===<br>');

    const map = new wasmModule.HashMap();
    const itemCount = 10000;

    log(`Inserting ${itemCount} items...`);
    const start = performance.now();

    for (let i = 0; i < itemCount; i++) {
        map.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - start;
    log(`Insert time: ${insertTime.toFixed(2)}ms<br>`);

    const metrics = map.get_metrics();

    const html = `
        <div class="result-box">
            <h3>Rust/WASM HashMap (10k items)</h3>
            <div class="metric-row">
                <span class="metric-label">Total Insertions</span>
                <span class="metric-value">${metrics.total_insertions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Collisions</span>
                <span class="metric-value">${metrics.total_collisions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Chain Length</span>
                <span class="metric-value">${metrics.max_chain_length}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Load Factor</span>
                <span class="metric-value">${metrics.average_load_factor.toFixed(2)}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Insert Time</span>
                <span class="metric-value">${insertTime.toFixed(2)}ms</span>
            </div>
        </div>
    `;

    document.getElementById('results').innerHTML += html;
    log('Benchmark complete!<br>');
}

function benchmarkJSBST() {
    log('=== JavaScript Binary Search Tree Benchmark ===<br>');

    const tree = new BinarySearchTree();
    const itemCount = 10000;

    log(`Inserting ${itemCount} items...`);
    const start = performance.now();

    for (let i = 0; i < itemCount; i++) {
        tree.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - start;
    log(`Insert time: ${insertTime.toFixed(2)}ms<br>`);

    const metrics = tree.getMetrics();

    const html = `
        <div class="result-box">
            <h3>JS Binary Search Tree (10k items)</h3>
            <div class="metric-row">
                <span class="metric-label">Total Insertions</span>
                <span class="metric-value">${metrics.totalInsertions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Total Comparisons</span>
                <span class="metric-value">${metrics.totalComparisons}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Depth</span>
                <span class="metric-value">${metrics.maxDepth}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Insert Time</span>
                <span class="metric-value">${insertTime.toFixed(2)}ms</span>
            </div>
        </div>
    `;

    document.getElementById('results').innerHTML += html;
    log('Benchmark complete!<br>');
}

async function benchmarkWasmBST() {
    if (!wasmModule) {
        const loaded = await initWasm();
        if (!loaded) {
            log('ERROR: Could not load WASM module');
            return;
        }
    }

    log('=== Rust/WASM Binary Search Tree Benchmark ===<br>');

    const tree = new wasmModule.BinarySearchTree();
    const itemCount = 10000;

    log(`Inserting ${itemCount} items...`);
    const start = performance.now();

    for (let i = 0; i < itemCount; i++) {
        tree.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - start;
    log(`Insert time: ${insertTime.toFixed(2)}ms<br>`);

    const metrics = tree.get_metrics();

    const html = `
        <div class="result-box">
            <h3>Rust/WASM Binary Search Tree (10k items)</h3>
            <div class="metric-row">
                <span class="metric-label">Total Insertions</span>
                <span class="metric-value">${metrics.total_insertions}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Total Comparisons</span>
                <span class="metric-value">${metrics.total_comparisons}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Max Depth</span>
                <span class="metric-value">${metrics.max_depth}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">Insert Time</span>
                <span class="metric-value">${insertTime.toFixed(2)}ms</span>
            </div>
        </div>
    `;

    document.getElementById('results').innerHTML += html;
    log('Benchmark complete!<br>');
}

async function benchmarkWasmOpenAddressing(size) {
    if (!wasmModule) {
        log('WASM module not loaded');
        return null;
    }

    const table = new wasmModule.OpenAddressingHashTable(1024);
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        table.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = table.get_metrics();

    // Convert Rust snake_case to JavaScript camelCase
    return {
        insertTime,
        totalInsertions: metrics.total_insertions,
        totalProbes: metrics.total_probes,
        maxProbeLength: metrics.max_probe_length,
        loadFactor: metrics.load_factor,
        clusteringFactor: metrics.clustering_factor,
        tombstoneCount: metrics.tombstone_count,
    };
}

async function benchmarkWasmRedBlackTree(size) {
    if (!wasmModule) {
        log('WASM module not loaded');
        return null;
    }

    const tree = new wasmModule.RedBlackTree();
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        tree.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = tree.get_metrics();

    // Convert Rust snake_case to JavaScript camelCase
    return {
        insertTime,
        totalInsertions: metrics.total_insertions,
        treeHeight: metrics.tree_height,
        rebalanceCount: metrics.rebalance_count,
        rotationCount: metrics.rotation_count,
        colorFixCount: metrics.color_fix_count,
        averageDepth: metrics.average_depth,
        balanceRatio: metrics.balance_ratio,
    };
}

function benchmarkJSRedBlackTree(size) {
    const tree = new RedBlackTree();
    const startTime = performance.now();

    for (let i = 0; i < size; i++) {
        tree.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = tree.getMetrics();

    return {
        insertTime,
        totalInsertions: metrics.totalInsertions,
        treeHeight: metrics.treeHeight,
        rebalanceCount: metrics.rebalanceCount,
        rotationCount: metrics.rotationCount,
        colorFixCount: metrics.colorFixCount,
        averageDepth: metrics.averageDepth,
        balanceRatio: metrics.balanceRatio,
    };
}

/**
 * Benchmark WASM Skip List implementation
 * Inserts keys 0 to size-1 and measures performance
 *
 * @param {number} size - Number of items to insert
 * @returns {object} Benchmark results with insertion time and metrics
 */
async function benchmarkWasmSkipList(size) {
    if (!wasmModule) {
        log('WASM module not loaded');
        return null;
    }

    const list = new wasmModule.SkipList();
    const startTime = performance.now();

    // Insert sequential keys
    for (let i = 0; i < size; i++) {
        list.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = list.get_metrics();

    // Convert Rust snake_case to JavaScript camelCase
    return {
        insertTime,
        totalInsertions: metrics.total_insertions,
        totalSearches: metrics.total_searches,
        searchComparisons: metrics.search_comparisons,
        averageLevel: metrics.average_level,
        maxLevel: metrics.max_level,
        insertionCost: metrics.insertion_cost,
    };
}

/**
 * Benchmark JavaScript Skip List implementation
 * Inserts keys 0 to size-1 and measures performance
 *
 * @param {number} size - Number of items to insert
 * @returns {object} Benchmark results with insertion time and metrics
 */
function benchmarkJSSkipList(size) {
    const list = new SkipList();
    const startTime = performance.now();

    // Insert sequential keys
    for (let i = 0; i < size; i++) {
        list.insert(`key${i}`, i);
    }

    const insertTime = performance.now() - startTime;
    const metrics = list.getMetrics();

    return {
        insertTime,
        totalInsertions: metrics.totalInsertions,
        totalSearches: metrics.totalSearches,
        searchComparisons: metrics.searchComparisons,
        averageLevel: metrics.averageLevel,
        maxLevel: metrics.maxLevel,
        insertionCost: metrics.insertionCost,
    };
}

async function benchmarkBoth() {
    clearResults();
    benchmarkJSHashMap();
    await benchmarkWasmHashMap();
}

async function benchmarkAllStructures() {
    clearResults();
    benchmarkJSHashMap();
    benchmarkJSBST();
    await benchmarkWasmHashMap();
    await benchmarkWasmBST();
}
