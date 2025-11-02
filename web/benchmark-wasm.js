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
