/**
 * Algorithm Visualizer - Professional Implementation
 * A comprehensive visualization tool for sorting, searching, and pathfinding algorithms
 */

// ============================================
// Configuration & State Variables
// ============================================

const CONFIG = {
    // Timing
    DEFAULT_SPEED: 100,
    MIN_SPEED: 10,
    MAX_SPEED: 500,
    
    // Array
    DEFAULT_SIZE: 30,
    MIN_SIZE: 10,
    MAX_SIZE: 100,
    MIN_ARRAY_VALUE: 5,
    MAX_ARRAY_VALUE: 99,
    
    // Pathfinding Grid
    GRID_ROWS: 20,
    GRID_COLS: 30,
    
    // Colors
    COLORS: {
        DEFAULT: '#3b82f6',
        COMPARING: '#eab308',
        SWAPPING: '#ef4444',
        SORTED: '#22c55e',
        PIVOT: '#a855f7',
        CURRENT: '#eab308',
        FOUND: '#22c55e',
        NOT_FOUND: '#ef4444',
        // Pathfinding
        EMPTY: '#1e293b',
        WALL: '#334155',
        START: '#22c55e',
        END: '#ef4444',
        VISITED: '#38bdf8',
        PATH: '#eab308',
        FRONTIER: '#a855f7'
    }
};

// Global State
let state = {
    // Current mode
    currentTab: 'sort',
    currentAlgorithm: 'bubble',
    
    // Animation control
    speed: CONFIG.DEFAULT_SPEED,
    isPaused: false,
    isRunning: false,
    shouldStop: false,
    
    // Array data
    array: [],
    arraySize: CONFIG.DEFAULT_SIZE,
    
    // Statistics
    comparisons: 0,
    swaps: 0,
    accesses: 0,
    nodesVisited: 0,
    
    // History for step-back functionality
    history: [],
    historyIndex: -1,
    
    // Search
    searchTarget: 50,
    
    // Pathfinding
    grid: [],
    startNode: { row: 10, col: 5 },
    endNode: { row: 10, col: 24 },
    drawMode: 'wall', // 'wall', 'start', 'end'
    isDrawing: false,
    
    // Pseudocode
    currentLine: -1
};

// Algorithm Information
const ALGORITHM_INFO = {
    // Sorting Algorithms
    bubble: {
        name: 'Bubble Sort',
        timeBest: 'O(n)',
        timeAvg: 'O(n²)',
        timeWorst: 'O(n²)',
        space: 'O(1)',
        pseudocode: [
            'for i = 0 to n-1',
            '  for j = 0 to n-i-2',
            '    compare arr[j] and arr[j+1]',
            '    if arr[j] > arr[j+1]',
            '      swap arr[j] and arr[j+1]',
            '  end for',
            'end for'
        ]
    },
    selection: {
        name: 'Selection Sort',
        timeBest: 'O(n²)',
        timeAvg: 'O(n²)',
        timeWorst: 'O(n²)',
        space: 'O(1)',
        pseudocode: [
            'for i = 0 to n-1',
            '  minIndex = i',
            '  for j = i+1 to n',
            '    if arr[j] < arr[minIndex]',
            '      minIndex = j',
            '  end for',
            '  swap arr[i] and arr[minIndex]',
            'end for'
        ]
    },
    insertion: {
        name: 'Insertion Sort',
        timeBest: 'O(n)',
        timeAvg: 'O(n²)',
        timeWorst: 'O(n²)',
        space: 'O(1)',
        pseudocode: [
            'for i = 1 to n',
            '  key = arr[i]',
            '  j = i - 1',
            '  while j >= 0 and arr[j] > key',
            '    arr[j+1] = arr[j]',
            '    j = j - 1',
            '  end while',
            '  arr[j+1] = key',
            'end for'
        ]
    },
    quick: {
        name: 'Quick Sort',
        timeBest: 'O(n log n)',
        timeAvg: 'O(n log n)',
        timeWorst: 'O(n²)',
        space: 'O(log n)',
        pseudocode: [
            'function quickSort(arr, low, high)',
            '  if low < high',
            '    pivot = partition(arr, low, high)',
            '    quickSort(arr, low, pivot-1)',
            '    quickSort(arr, pivot+1, high)',
            '',
            'function partition(arr, low, high)',
            '  pivot = arr[high]',
            '  i = low - 1',
            '  for j = low to high-1',
            '    if arr[j] <= pivot',
            '      i++, swap arr[i] and arr[j]',
            '  swap arr[i+1] and arr[high]',
            '  return i + 1'
        ]
    },
    merge: {
        name: 'Merge Sort',
        timeBest: 'O(n log n)',
        timeAvg: 'O(n log n)',
        timeWorst: 'O(n log n)',
        space: 'O(n)',
        pseudocode: [
            'function mergeSort(arr, left, right)',
            '  if left < right',
            '    mid = (left + right) / 2',
            '    mergeSort(arr, left, mid)',
            '    mergeSort(arr, mid+1, right)',
            '    merge(arr, left, mid, right)',
            '',
            'function merge(arr, left, mid, right)',
            '  create temp arrays L[] and R[]',
            '  copy data to temp arrays',
            '  merge temp arrays back into arr',
            '  copy remaining elements'
        ]
    },
    
    // Searching Algorithms
    linear: {
        name: 'Linear Search',
        timeBest: 'O(1)',
        timeAvg: 'O(n)',
        timeWorst: 'O(n)',
        space: 'O(1)',
        pseudocode: [
            'function linearSearch(arr, target)',
            '  for i = 0 to n-1',
            '    if arr[i] == target',
            '      return i',
            '  end for',
            '  return -1 (not found)'
        ]
    },
    binary: {
        name: 'Binary Search',
        timeBest: 'O(1)',
        timeAvg: 'O(log n)',
        timeWorst: 'O(log n)',
        space: 'O(1)',
        pseudocode: [
            'function binarySearch(arr, target)',
            '  left = 0, right = n-1',
            '  while left <= right',
            '    mid = (left + right) / 2',
            '    if arr[mid] == target',
            '      return mid',
            '    else if arr[mid] < target',
            '      left = mid + 1',
            '    else',
            '      right = mid - 1',
            '  return -1 (not found)'
        ]
    },
    
    // Pathfinding Algorithms
    bfs: {
        name: 'Breadth-First Search',
        timeBest: 'O(V + E)',
        timeAvg: 'O(V + E)',
        timeWorst: 'O(V + E)',
        space: 'O(V)',
        pseudocode: [
            'function BFS(start, end)',
            '  queue = [start]',
            '  visited = {start}',
            '  while queue is not empty',
            '    current = queue.dequeue()',
            '    if current == end',
            '      return reconstructPath()',
            '    for each neighbor of current',
            '      if neighbor not in visited',
            '        visited.add(neighbor)',
            '        queue.enqueue(neighbor)',
            '  return no path found'
        ]
    },
    dfs: {
        name: 'Depth-First Search',
        timeBest: 'O(V + E)',
        timeAvg: 'O(V + E)',
        timeWorst: 'O(V + E)',
        space: 'O(V)',
        pseudocode: [
            'function DFS(start, end)',
            '  stack = [start]',
            '  visited = {start}',
            '  while stack is not empty',
            '    current = stack.pop()',
            '    if current == end',
            '      return reconstructPath()',
            '    for each neighbor of current',
            '      if neighbor not in visited',
            '        visited.add(neighbor)',
            '        stack.push(neighbor)',
            '  return no path found'
        ]
    },
    dijkstra: {
        name: "Dijkstra's Algorithm",
        timeBest: 'O((V+E) log V)',
        timeAvg: 'O((V+E) log V)',
        timeWorst: 'O((V+E) log V)',
        space: 'O(V)',
        pseudocode: [
            'function Dijkstra(start, end)',
            '  dist[start] = 0',
            '  pq = [(0, start)]',
            '  while pq is not empty',
            '    (d, current) = pq.extractMin()',
            '    if current == end',
            '      return reconstructPath()',
            '    for each neighbor of current',
            '      newDist = dist[current] + 1',
            '      if newDist < dist[neighbor]',
            '        dist[neighbor] = newDist',
            '        pq.insert((newDist, neighbor))',
            '  return no path found'
        ]
    },
    astar: {
        name: 'A* Search',
        timeBest: 'O(E)',
        timeAvg: 'O(E)',
        timeWorst: 'O(V²)',
        space: 'O(V)',
        pseudocode: [
            'function AStar(start, end)',
            '  openSet = [start]',
            '  gScore[start] = 0',
            '  fScore[start] = heuristic(start, end)',
            '  while openSet is not empty',
            '    current = node with lowest fScore',
            '    if current == end',
            '      return reconstructPath()',
            '    for each neighbor of current',
            '      tentative_g = gScore[current] + 1',
            '      if tentative_g < gScore[neighbor]',
            '        update gScore and fScore',
            '        add neighbor to openSet',
            '  return no path found'
        ]
    }
};

// ============================================
// DOM Elements
// ============================================

const DOM = {};

function initDOM() {
    // Tabs
    DOM.tabs = document.querySelectorAll('.tab');
    
    // Stage
    DOM.stageTitle = document.getElementById('stageTitle');
    DOM.statusBadge = document.getElementById('statusBadge');
    DOM.barsContainer = document.getElementById('barsContainer');
    DOM.barsWrapper = document.getElementById('barsWrapper');
    DOM.arrayValues = document.getElementById('arrayValues');
    DOM.canvasContainer = document.getElementById('canvasContainer');
    DOM.pathCanvas = document.getElementById('pathCanvas');
    
    // Info Panel
    DOM.timeBest = document.getElementById('timeBest');
    DOM.timeAvg = document.getElementById('timeAvg');
    DOM.timeWorst = document.getElementById('timeWorst');
    DOM.spaceComplexity = document.getElementById('spaceComplexity');
    DOM.comparisons = document.getElementById('comparisons');
    DOM.swaps = document.getElementById('swaps');
    DOM.accesses = document.getElementById('accesses');
    DOM.nodesVisited = document.getElementById('nodesVisited');
    DOM.nodesVisitedContainer = document.getElementById('nodesVisitedContainer');
    DOM.pseudocode = document.getElementById('pseudocode');
    
    // Controls
    DOM.playPauseBtn = document.getElementById('playPauseBtn');
    DOM.playPauseIcon = document.getElementById('playPauseIcon');
    DOM.resetBtn = document.getElementById('resetBtn');
    DOM.stepForwardBtn = document.getElementById('stepForwardBtn');
    DOM.stepBackBtn = document.getElementById('stepBackBtn');
    DOM.prevBtn = document.getElementById('prevBtn');
    DOM.nextBtn = document.getElementById('nextBtn');
    DOM.algorithmSelect = document.getElementById('algorithmSelect');
    DOM.speedSlider = document.getElementById('speedSlider');
    DOM.speedValue = document.getElementById('speedValue');
    DOM.sizeSlider = document.getElementById('sizeSlider');
    DOM.sizeValue = document.getElementById('sizeValue');
    DOM.sizeControl = document.getElementById('sizeControl');
    DOM.generateBtn = document.getElementById('generateBtn');
    DOM.customInput = document.getElementById('customInput');
    DOM.customInputBtn = document.getElementById('customInputBtn');
    DOM.customInputGroup = document.getElementById('customInputGroup');
    DOM.arrayControls = document.getElementById('arrayControls');
    
    // Search controls
    DOM.searchTargetGroup = document.getElementById('searchTargetGroup');
    DOM.searchTarget = document.getElementById('searchTarget');
    
    // Pathfinding controls
    DOM.pathfindingModes = document.getElementById('pathfindingModes');
    DOM.wallModeBtn = document.getElementById('wallModeBtn');
    DOM.startModeBtn = document.getElementById('startModeBtn');
    DOM.endModeBtn = document.getElementById('endModeBtn');
    DOM.clearGridBtn = document.getElementById('clearGridBtn');
    DOM.generateMazeBtn = document.getElementById('generateMazeBtn');
}

// ============================================
// Utility Functions
// ============================================

/**
 * Sleep function with pause/stop support
 */
function sleep(ms) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (state.shouldStop) {
                clearInterval(checkInterval);
                resolve();
            } else if (!state.isPaused) {
                const elapsed = Date.now() - startTime;
                if (elapsed >= state.speed) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }
        }, 10);
    });
}

/**
 * Generate random array
 */
function generateArray(size = state.arraySize) {
    state.array = [];
    for (let i = 0; i < size; i++) {
        state.array.push(Math.floor(Math.random() * (CONFIG.MAX_ARRAY_VALUE - CONFIG.MIN_ARRAY_VALUE + 1)) + CONFIG.MIN_ARRAY_VALUE);
    }
    return state.array;
}

/**
 * Save state snapshot for step-back functionality
 */
function saveState(meta = {}) {
    const snapshot = {
        array: [...state.array],
        comparisons: state.comparisons,
        swaps: state.swaps,
        accesses: state.accesses,
        currentLine: state.currentLine,
        highlightIndices: meta.highlightIndices || [],
        highlightType: meta.highlightType || 'default',
        ...meta
    };
    
    // If we're not at the end of history, truncate
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    
    state.history.push(snapshot);
    state.historyIndex = state.history.length - 1;
}

/**
 * Restore state from history
 */
function restoreState(index) {
    if (index < 0 || index >= state.history.length) return false;
    
    const snapshot = state.history[index];
    state.array = [...snapshot.array];
    state.comparisons = snapshot.comparisons;
    state.swaps = snapshot.swaps;
    state.accesses = snapshot.accesses;
    state.currentLine = snapshot.currentLine;
    state.historyIndex = index;
    
    updateStats();
    renderBars(snapshot.highlightIndices, snapshot.highlightType);
    highlightPseudocodeLine(snapshot.currentLine);
    
    return true;
}

/**
 * Reset statistics
 */
function resetStats() {
    state.comparisons = 0;
    state.swaps = 0;
    state.accesses = 0;
    state.nodesVisited = 0;
    state.currentLine = -1;
    updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
    DOM.comparisons.textContent = state.comparisons;
    DOM.swaps.textContent = state.swaps;
    DOM.accesses.textContent = state.accesses;
    DOM.nodesVisited.textContent = state.nodesVisited;
}

/**
 * Update status badge
 */
function setStatus(status) {
    DOM.statusBadge.textContent = status;
    DOM.statusBadge.className = 'status-badge';
    
    switch (status.toLowerCase()) {
        case 'running':
            DOM.statusBadge.classList.add('running');
            break;
        case 'paused':
            DOM.statusBadge.classList.add('paused');
            break;
        case 'completed':
        case 'found':
            DOM.statusBadge.classList.add('completed');
            break;
        case 'not found':
            DOM.statusBadge.classList.add('not-found');
            break;
    }
}

// ============================================
// Rendering Functions
// ============================================

/**
 * Render bars for sorting/searching visualization
 */
function renderBars(highlightIndices = [], highlightType = 'default', sortedIndices = []) {
    DOM.barsWrapper.innerHTML = '';
    DOM.arrayValues.innerHTML = '';
    
    const maxValue = Math.max(...state.array);
    
    state.array.forEach((value, index) => {
        // Create bar
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(value / maxValue) * 100}%`;
        
        // Apply highlight classes
        if (sortedIndices.includes(index)) {
            bar.classList.add('sorted');
        } else if (highlightIndices.includes(index)) {
            bar.classList.add(highlightType);
        }
        
        DOM.barsWrapper.appendChild(bar);
        
        // Create value label (only show if array is small enough)
        if (state.array.length <= 50) {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'array-value';
            valueSpan.textContent = value;
            DOM.arrayValues.appendChild(valueSpan);
        }
    });
}

/**
 * Update algorithm info panel
 */
function updateAlgorithmInfo(algorithm) {
    const info = ALGORITHM_INFO[algorithm];
    if (!info) return;
    
    DOM.stageTitle.textContent = info.name;
    DOM.timeBest.textContent = info.timeBest;
    DOM.timeAvg.textContent = info.timeAvg;
    DOM.timeWorst.textContent = info.timeWorst;
    DOM.spaceComplexity.textContent = info.space;
    
    // Render pseudocode
    DOM.pseudocode.innerHTML = '';
    info.pseudocode.forEach((line, index) => {
        const lineSpan = document.createElement('span');
        lineSpan.className = 'pseudocode-line';
        lineSpan.dataset.line = index;
        lineSpan.textContent = line || ' ';
        DOM.pseudocode.appendChild(lineSpan);
    });
}

/**
 * Highlight pseudocode line
 */
function highlightPseudocodeLine(lineIndex) {
    const lines = DOM.pseudocode.querySelectorAll('.pseudocode-line');
    lines.forEach((line, index) => {
        line.classList.remove('active', 'completed');
        if (index === lineIndex) {
            line.classList.add('active');
        } else if (index < lineIndex) {
            line.classList.add('completed');
        }
    });
    state.currentLine = lineIndex;
}

// ============================================
// Sorting Algorithms
// ============================================

/**
 * Bubble Sort Implementation
 */
async function bubbleSort() {
    const n = state.array.length;
    const sortedIndices = [];
    
    highlightPseudocodeLine(0);
    
    for (let i = 0; i < n - 1; i++) {
        if (state.shouldStop) return;
        
        highlightPseudocodeLine(1);
        
        for (let j = 0; j < n - i - 1; j++) {
            if (state.shouldStop) return;
            
            // Compare
            highlightPseudocodeLine(2);
            state.comparisons++;
            state.accesses += 2;
            updateStats();
            renderBars([j, j + 1], 'comparing', sortedIndices);
            saveState({ highlightIndices: [j, j + 1], highlightType: 'comparing' });
            await sleep(state.speed);
            
            if (state.array[j] > state.array[j + 1]) {
                // Swap
                highlightPseudocodeLine(4);
                renderBars([j, j + 1], 'swapping', sortedIndices);
                await sleep(state.speed / 2);
                
                [state.array[j], state.array[j + 1]] = [state.array[j + 1], state.array[j]];
                state.swaps++;
                state.accesses += 2;
                updateStats();
                saveState({ highlightIndices: [j, j + 1], highlightType: 'swapping' });
                
                renderBars([j, j + 1], 'swapping', sortedIndices);
                await sleep(state.speed / 2);
            }
        }
        
        sortedIndices.push(n - i - 1);
        renderBars([], 'default', sortedIndices);
    }
    
    sortedIndices.push(0);
    renderBars([], 'default', sortedIndices);
    highlightPseudocodeLine(6);
}

/**
 * Selection Sort Implementation
 */
async function selectionSort() {
    const n = state.array.length;
    const sortedIndices = [];
    
    for (let i = 0; i < n - 1; i++) {
        if (state.shouldStop) return;
        
        highlightPseudocodeLine(0);
        let minIndex = i;
        highlightPseudocodeLine(1);
        
        for (let j = i + 1; j < n; j++) {
            if (state.shouldStop) return;
            
            highlightPseudocodeLine(2);
            state.comparisons++;
            state.accesses += 2;
            updateStats();
            renderBars([minIndex, j], 'comparing', sortedIndices);
            saveState({ highlightIndices: [minIndex, j], highlightType: 'comparing' });
            await sleep(state.speed);
            
            if (state.array[j] < state.array[minIndex]) {
                highlightPseudocodeLine(4);
                minIndex = j;
            }
        }
        
        if (minIndex !== i) {
            highlightPseudocodeLine(6);
            renderBars([i, minIndex], 'swapping', sortedIndices);
            await sleep(state.speed / 2);
            
            [state.array[i], state.array[minIndex]] = [state.array[minIndex], state.array[i]];
            state.swaps++;
            state.accesses += 2;
            updateStats();
            saveState({ highlightIndices: [i, minIndex], highlightType: 'swapping' });
            
            renderBars([i, minIndex], 'swapping', sortedIndices);
            await sleep(state.speed / 2);
        }
        
        sortedIndices.push(i);
        renderBars([], 'default', sortedIndices);
    }
    
    sortedIndices.push(n - 1);
    renderBars([], 'default', sortedIndices);
    highlightPseudocodeLine(7);
}

/**
 * Insertion Sort Implementation
 */
async function insertionSort() {
    const n = state.array.length;
    const sortedIndices = [0];
    
    for (let i = 1; i < n; i++) {
        if (state.shouldStop) return;
        
        highlightPseudocodeLine(0);
        const key = state.array[i];
        state.accesses++;
        highlightPseudocodeLine(1);
        let j = i - 1;
        highlightPseudocodeLine(2);
        
        renderBars([i], 'current', sortedIndices);
        saveState({ highlightIndices: [i], highlightType: 'current' });
        await sleep(state.speed);
        
        while (j >= 0 && state.array[j] > key) {
            if (state.shouldStop) return;
            
            highlightPseudocodeLine(3);
            state.comparisons++;
            state.accesses++;
            
            highlightPseudocodeLine(4);
            state.array[j + 1] = state.array[j];
            state.accesses++;
            updateStats();
            
            renderBars([j, j + 1], 'swapping', sortedIndices);
            saveState({ highlightIndices: [j, j + 1], highlightType: 'swapping' });
            await sleep(state.speed);
            
            highlightPseudocodeLine(5);
            j--;
        }
        
        highlightPseudocodeLine(7);
        state.array[j + 1] = key;
        state.accesses++;
        state.swaps++;
        updateStats();
        
        sortedIndices.push(i);
        renderBars([], 'default', sortedIndices);
        await sleep(state.speed / 2);
    }
    
    renderBars([], 'default', Array.from({ length: n }, (_, i) => i));
    highlightPseudocodeLine(8);
}

/**
 * Quick Sort Implementation
 */
async function quickSort(low = 0, high = state.array.length - 1, sortedIndices = []) {
    if (state.shouldStop) return;
    
    highlightPseudocodeLine(0);
    
    if (low < high) {
        highlightPseudocodeLine(1);
        highlightPseudocodeLine(2);
        
        const pivotIndex = await partition(low, high, sortedIndices);
        
        if (state.shouldStop) return;
        
        sortedIndices.push(pivotIndex);
        renderBars([], 'default', sortedIndices);
        
        highlightPseudocodeLine(3);
        await quickSort(low, pivotIndex - 1, sortedIndices);
        
        highlightPseudocodeLine(4);
        await quickSort(pivotIndex + 1, high, sortedIndices);
    } else if (low === high) {
        sortedIndices.push(low);
        renderBars([], 'default', sortedIndices);
    }
    
    if (low === 0 && high === state.array.length - 1) {
        renderBars([], 'default', Array.from({ length: state.array.length }, (_, i) => i));
    }
}

async function partition(low, high, sortedIndices) {
    highlightPseudocodeLine(7);
    const pivot = state.array[high];
    state.accesses++;
    
    renderBars([high], 'pivot', sortedIndices);
    await sleep(state.speed);
    
    highlightPseudocodeLine(8);
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (state.shouldStop) return i + 1;
        
        highlightPseudocodeLine(9);
        state.comparisons++;
        state.accesses++;
        updateStats();
        
        renderBars([j, high], 'comparing', sortedIndices);
        saveState({ highlightIndices: [j, high], highlightType: 'comparing' });
        await sleep(state.speed);
        
        if (state.array[j] <= pivot) {
            highlightPseudocodeLine(11);
            i++;
            
            if (i !== j) {
                renderBars([i, j], 'swapping', sortedIndices);
                await sleep(state.speed / 2);
                
                [state.array[i], state.array[j]] = [state.array[j], state.array[i]];
                state.swaps++;
                state.accesses += 2;
                updateStats();
                saveState({ highlightIndices: [i, j], highlightType: 'swapping' });
                
                renderBars([i, j], 'swapping', sortedIndices);
                await sleep(state.speed / 2);
            }
        }
    }
    
    highlightPseudocodeLine(12);
    if (i + 1 !== high) {
        renderBars([i + 1, high], 'swapping', sortedIndices);
        await sleep(state.speed / 2);
        
        [state.array[i + 1], state.array[high]] = [state.array[high], state.array[i + 1]];
        state.swaps++;
        state.accesses += 2;
        updateStats();
        saveState({ highlightIndices: [i + 1, high], highlightType: 'swapping' });
        
        renderBars([i + 1, high], 'swapping', sortedIndices);
        await sleep(state.speed / 2);
    }
    
    highlightPseudocodeLine(13);
    return i + 1;
}

/**
 * Merge Sort Implementation
 */
async function mergeSort(left = 0, right = state.array.length - 1) {
    if (state.shouldStop) return;
    
    highlightPseudocodeLine(0);
    
    if (left < right) {
        highlightPseudocodeLine(1);
        const mid = Math.floor((left + right) / 2);
        highlightPseudocodeLine(2);
        
        // Highlight the current range being divided
        const rangeIndices = [];
        for (let i = left; i <= right; i++) rangeIndices.push(i);
        renderBars(rangeIndices, 'comparing');
        await sleep(state.speed);
        
        highlightPseudocodeLine(3);
        await mergeSort(left, mid);
        
        highlightPseudocodeLine(4);
        await mergeSort(mid + 1, right);
        
        highlightPseudocodeLine(5);
        await merge(left, mid, right);
    }
    
    if (left === 0 && right === state.array.length - 1) {
        renderBars([], 'default', Array.from({ length: state.array.length }, (_, i) => i));
    }
}

async function merge(left, mid, right) {
    if (state.shouldStop) return;
    
    highlightPseudocodeLine(8);
    const leftArr = state.array.slice(left, mid + 1);
    const rightArr = state.array.slice(mid + 1, right + 1);
    state.accesses += right - left + 1;
    
    highlightPseudocodeLine(9);
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
        if (state.shouldStop) return;
        
        highlightPseudocodeLine(10);
        state.comparisons++;
        state.accesses += 2;
        updateStats();
        
        renderBars([k], 'comparing');
        saveState({ highlightIndices: [k], highlightType: 'comparing' });
        await sleep(state.speed);
        
        if (leftArr[i] <= rightArr[j]) {
            state.array[k] = leftArr[i];
            i++;
        } else {
            state.array[k] = rightArr[j];
            j++;
        }
        
        state.accesses++;
        state.swaps++;
        updateStats();
        
        renderBars([k], 'swapping');
        saveState({ highlightIndices: [k], highlightType: 'swapping' });
        await sleep(state.speed);
        
        k++;
    }
    
    highlightPseudocodeLine(11);
    while (i < leftArr.length) {
        if (state.shouldStop) return;
        state.array[k] = leftArr[i];
        state.accesses++;
        updateStats();
        renderBars([k], 'swapping');
        await sleep(state.speed / 2);
        i++;
        k++;
    }
    
    while (j < rightArr.length) {
        if (state.shouldStop) return;
        state.array[k] = rightArr[j];
        state.accesses++;
        updateStats();
        renderBars([k], 'swapping');
        await sleep(state.speed / 2);
        j++;
        k++;
    }
    
    // Show merged section
    const mergedIndices = [];
    for (let idx = left; idx <= right; idx++) mergedIndices.push(idx);
    renderBars(mergedIndices, 'sorted');
    await sleep(state.speed);
    renderBars();
}

// ============================================
// Searching Algorithms
// ============================================

/**
 * Linear Search Implementation
 */
async function linearSearch() {
    const target = state.searchTarget;
    const n = state.array.length;
    
    highlightPseudocodeLine(0);
    
    for (let i = 0; i < n; i++) {
        if (state.shouldStop) return -1;
        
        highlightPseudocodeLine(1);
        state.comparisons++;
        state.accesses++;
        updateStats();
        
        renderBars([i], 'current');
        saveState({ highlightIndices: [i], highlightType: 'current' });
        await sleep(state.speed);
        
        highlightPseudocodeLine(2);
        if (state.array[i] === target) {
            highlightPseudocodeLine(3);
            renderBars([i], 'found');
            setStatus('Found');
            return i;
        }
    }
    
    highlightPseudocodeLine(5);
    renderBars([], 'not-found');
    setStatus('Not Found');
    return -1;
}

/**
 * Binary Search Implementation
 */
async function binarySearch() {
    // First, sort the array for binary search
    state.array.sort((a, b) => a - b);
    renderBars();
    await sleep(state.speed);
    
    const target = state.searchTarget;
    let left = 0;
    let right = state.array.length - 1;
    
    highlightPseudocodeLine(0);
    highlightPseudocodeLine(1);
    
    while (left <= right) {
        if (state.shouldStop) return -1;
        
        highlightPseudocodeLine(2);
        const mid = Math.floor((left + right) / 2);
        highlightPseudocodeLine(3);
        
        state.comparisons++;
        state.accesses++;
        updateStats();
        
        // Highlight search range
        const rangeIndices = [];
        for (let i = left; i <= right; i++) rangeIndices.push(i);
        renderBars(rangeIndices, 'comparing');
        await sleep(state.speed / 2);
        
        // Highlight mid
        renderBars([mid], 'current');
        saveState({ highlightIndices: [mid], highlightType: 'current' });
        await sleep(state.speed);
        
        highlightPseudocodeLine(4);
        if (state.array[mid] === target) {
            highlightPseudocodeLine(5);
            renderBars([mid], 'found');
            setStatus('Found');
            return mid;
        } else if (state.array[mid] < target) {
            highlightPseudocodeLine(6);
            highlightPseudocodeLine(7);
            left = mid + 1;
        } else {
            highlightPseudocodeLine(8);
            highlightPseudocodeLine(9);
            right = mid - 1;
        }
    }
    
    highlightPseudocodeLine(10);
    renderBars([], 'not-found');
    setStatus('Not Found');
    return -1;
}

// ============================================
// Pathfinding Algorithms
// ============================================

// Cell states for pathfinding
const CELL = {
    EMPTY: 0,
    WALL: 1,
    START: 2,
    END: 3,
    VISITED: 4,
    PATH: 5,
    FRONTIER: 6
};

/**
 * Initialize pathfinding grid
 */
function initGrid() {
    state.grid = [];
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
        state.grid[row] = [];
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            state.grid[row][col] = CELL.EMPTY;
        }
    }
    
    // Set start and end
    state.grid[state.startNode.row][state.startNode.col] = CELL.START;
    state.grid[state.endNode.row][state.endNode.col] = CELL.END;
}

/**
 * Get canvas context and cell size
 */
function getCanvasInfo() {
    const canvas = DOM.pathCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on container
    const container = DOM.canvasContainer;
    canvas.width = container.clientWidth - 40;
    canvas.height = 400;
    
    const cellWidth = canvas.width / CONFIG.GRID_COLS;
    const cellHeight = canvas.height / CONFIG.GRID_ROWS;
    const cellSize = Math.min(cellWidth, cellHeight);
    
    return { canvas, ctx, cellSize };
}

/**
 * Draw the pathfinding grid
 */
function drawGrid() {
    const { canvas, ctx, cellSize } = getCanvasInfo();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offset to center the grid
    const gridWidth = CONFIG.GRID_COLS * cellSize;
    const gridHeight = CONFIG.GRID_ROWS * cellSize;
    const offsetX = (canvas.width - gridWidth) / 2;
    const offsetY = (canvas.height - gridHeight) / 2;
    
    // Draw cells
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;
            
            // Cell background
            switch (state.grid[row][col]) {
                case CELL.EMPTY:
                    ctx.fillStyle = CONFIG.COLORS.EMPTY;
                    break;
                case CELL.WALL:
                    ctx.fillStyle = CONFIG.COLORS.WALL;
                    break;
                case CELL.START:
                    ctx.fillStyle = CONFIG.COLORS.START;
                    break;
                case CELL.END:
                    ctx.fillStyle = CONFIG.COLORS.END;
                    break;
                case CELL.VISITED:
                    ctx.fillStyle = CONFIG.COLORS.VISITED;
                    break;
                case CELL.PATH:
                    ctx.fillStyle = CONFIG.COLORS.PATH;
                    break;
                case CELL.FRONTIER:
                    ctx.fillStyle = CONFIG.COLORS.FRONTIER;
                    break;
            }
            
            ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
            
            // Draw S and E labels
            if (state.grid[row][col] === CELL.START || state.grid[row][col] === CELL.END) {
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${cellSize * 0.6}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    state.grid[row][col] === CELL.START ? 'S' : 'E',
                    x + cellSize / 2,
                    y + cellSize / 2
                );
            }
        }
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    for (let row = 0; row <= CONFIG.GRID_ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + row * cellSize);
        ctx.lineTo(offsetX + gridWidth, offsetY + row * cellSize);
        ctx.stroke();
    }
    
    for (let col = 0; col <= CONFIG.GRID_COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + col * cellSize, offsetY);
        ctx.lineTo(offsetX + col * cellSize, offsetY + gridHeight);
        ctx.stroke();
    }
}

/**
 * Get cell from mouse position
 */
function getCellFromMouse(e) {
    const { canvas, cellSize } = getCanvasInfo();
    const rect = canvas.getBoundingClientRect();
    
    const gridWidth = CONFIG.GRID_COLS * cellSize;
    const gridHeight = CONFIG.GRID_ROWS * cellSize;
    const offsetX = (canvas.width - gridWidth) / 2;
    const offsetY = (canvas.height - gridHeight) / 2;
    
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < CONFIG.GRID_ROWS && col >= 0 && col < CONFIG.GRID_COLS) {
        return { row, col };
    }
    return null;
}

/**
 * Handle canvas click/drag for drawing
 */
function handleCanvasInteraction(e) {
    const cell = getCellFromMouse(e);
    if (!cell) return;
    
    const { row, col } = cell;
    
    switch (state.drawMode) {
        case 'wall':
            if (state.grid[row][col] !== CELL.START && state.grid[row][col] !== CELL.END) {
                state.grid[row][col] = state.grid[row][col] === CELL.WALL ? CELL.EMPTY : CELL.WALL;
            }
            break;
        case 'start':
            if (state.grid[row][col] !== CELL.END) {
                // Clear old start
                state.grid[state.startNode.row][state.startNode.col] = CELL.EMPTY;
                // Set new start
                state.startNode = { row, col };
                state.grid[row][col] = CELL.START;
            }
            break;
        case 'end':
            if (state.grid[row][col] !== CELL.START) {
                // Clear old end
                state.grid[state.endNode.row][state.endNode.col] = CELL.EMPTY;
                // Set new end
                state.endNode = { row, col };
                state.grid[row][col] = CELL.END;
            }
            break;
    }
    
    drawGrid();
}

/**
 * Get neighbors for pathfinding
 */
function getNeighbors(row, col) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
    
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < CONFIG.GRID_ROWS &&
            newCol >= 0 && newCol < CONFIG.GRID_COLS &&
            state.grid[newRow][newCol] !== CELL.WALL) {
            neighbors.push({ row: newRow, col: newCol });
        }
    }
    
    return neighbors;
}

/**
 * Reconstruct path from parent map
 */
async function reconstructPath(parentMap, endRow, endCol) {
    const path = [];
    let current = `${endRow},${endCol}`;
    
    while (current) {
        const [row, col] = current.split(',').map(Number);
        path.unshift({ row, col });
        current = parentMap[current];
    }
    
    // Animate path
    for (const { row, col } of path) {
        if (state.shouldStop) return;
        if (state.grid[row][col] !== CELL.START && state.grid[row][col] !== CELL.END) {
            state.grid[row][col] = CELL.PATH;
            drawGrid();
            await sleep(state.speed / 4);
        }
    }
}

/**
 * BFS Pathfinding
 */
async function bfs() {
    const { row: startRow, col: startCol } = state.startNode;
    const { row: endRow, col: endCol } = state.endNode;
    
    const queue = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);
    const parentMap = {};
    
    highlightPseudocodeLine(0);
    highlightPseudocodeLine(1);
    highlightPseudocodeLine(2);
    
    while (queue.length > 0) {
        if (state.shouldStop) return false;
        
        highlightPseudocodeLine(3);
        const current = queue.shift();
        highlightPseudocodeLine(4);
        
        state.nodesVisited++;
        updateStats();
        
        if (current.row === endRow && current.col === endCol) {
            highlightPseudocodeLine(5);
            highlightPseudocodeLine(6);
            await reconstructPath(parentMap, endRow, endCol);
            setStatus('Path Found');
            return true;
        }
        
        highlightPseudocodeLine(7);
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const key = `${neighbor.row},${neighbor.col}`;
            
            highlightPseudocodeLine(8);
            if (!visited.has(key)) {
                highlightPseudocodeLine(9);
                visited.add(key);
                parentMap[key] = `${current.row},${current.col}`;
                
                highlightPseudocodeLine(10);
                queue.push(neighbor);
                
                if (state.grid[neighbor.row][neighbor.col] !== CELL.END) {
                    state.grid[neighbor.row][neighbor.col] = CELL.VISITED;
                }
            }
        }
        
        drawGrid();
        await sleep(state.speed / 2);
    }
    
    highlightPseudocodeLine(11);
    setStatus('No Path');
    return false;
}

/**
 * DFS Pathfinding
 */
async function dfs() {
    const { row: startRow, col: startCol } = state.startNode;
    const { row: endRow, col: endCol } = state.endNode;
    
    const stack = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow},${startCol}`]);
    const parentMap = {};
    
    highlightPseudocodeLine(0);
    highlightPseudocodeLine(1);
    highlightPseudocodeLine(2);
    
    while (stack.length > 0) {
        if (state.shouldStop) return false;
        
        highlightPseudocodeLine(3);
        const current = stack.pop();
        highlightPseudocodeLine(4);
        
        state.nodesVisited++;
        updateStats();
        
        // Mark as visited visually
        if (state.grid[current.row][current.col] !== CELL.START && 
            state.grid[current.row][current.col] !== CELL.END) {
            state.grid[current.row][current.col] = CELL.VISITED;
        }
        
        if (current.row === endRow && current.col === endCol) {
            highlightPseudocodeLine(5);
            highlightPseudocodeLine(6);
            await reconstructPath(parentMap, endRow, endCol);
            setStatus('Path Found');
            return true;
        }
        
        highlightPseudocodeLine(7);
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const key = `${neighbor.row},${neighbor.col}`;
            
            highlightPseudocodeLine(8);
            if (!visited.has(key)) {
                highlightPseudocodeLine(9);
                visited.add(key);
                parentMap[key] = `${current.row},${current.col}`;
                
                highlightPseudocodeLine(10);
                stack.push(neighbor);
            }
        }
        
        drawGrid();
        await sleep(state.speed / 2);
    }
    
    highlightPseudocodeLine(11);
    setStatus('No Path');
    return false;
}

/**
 * Dijkstra's Algorithm
 */
async function dijkstra() {
    const { row: startRow, col: startCol } = state.startNode;
    const { row: endRow, col: endCol } = state.endNode;
    
    // Distance map
    const dist = {};
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
        for (let c = 0; c < CONFIG.GRID_COLS; c++) {
            dist[`${r},${c}`] = Infinity;
        }
    }
    dist[`${startRow},${startCol}`] = 0;
    
    // Priority queue (simple array, sorted by distance)
    const pq = [{ row: startRow, col: startCol, dist: 0 }];
    const visited = new Set();
    const parentMap = {};
    
    highlightPseudocodeLine(0);
    highlightPseudocodeLine(1);
    highlightPseudocodeLine(2);
    
    while (pq.length > 0) {
        if (state.shouldStop) return false;
        
        highlightPseudocodeLine(3);
        // Sort by distance and get minimum
        pq.sort((a, b) => a.dist - b.dist);
        const current = pq.shift();
        highlightPseudocodeLine(4);
        
        const key = `${current.row},${current.col}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        state.nodesVisited++;
        updateStats();
        
        if (state.grid[current.row][current.col] !== CELL.START && 
            state.grid[current.row][current.col] !== CELL.END) {
            state.grid[current.row][current.col] = CELL.VISITED;
        }
        
        if (current.row === endRow && current.col === endCol) {
            highlightPseudocodeLine(5);
            highlightPseudocodeLine(6);
            await reconstructPath(parentMap, endRow, endCol);
            setStatus('Path Found');
            return true;
        }
        
        highlightPseudocodeLine(7);
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const nKey = `${neighbor.row},${neighbor.col}`;
            
            highlightPseudocodeLine(8);
            const newDist = dist[key] + 1;
            
            highlightPseudocodeLine(9);
            if (newDist < dist[nKey]) {
                highlightPseudocodeLine(10);
                dist[nKey] = newDist;
                parentMap[nKey] = key;
                
                highlightPseudocodeLine(11);
                pq.push({ row: neighbor.row, col: neighbor.col, dist: newDist });
                
                if (state.grid[neighbor.row][neighbor.col] !== CELL.START && 
                    state.grid[neighbor.row][neighbor.col] !== CELL.END &&
                    state.grid[neighbor.row][neighbor.col] !== CELL.VISITED) {
                    state.grid[neighbor.row][neighbor.col] = CELL.FRONTIER;
                }
            }
        }
        
        drawGrid();
        await sleep(state.speed / 2);
    }
    
    highlightPseudocodeLine(12);
    setStatus('No Path');
    return false;
}

/**
 * A* Search Algorithm
 */
async function astar() {
    const { row: startRow, col: startCol } = state.startNode;
    const { row: endRow, col: endCol } = state.endNode;
    
    // Heuristic: Manhattan distance
    const heuristic = (r, c) => Math.abs(r - endRow) + Math.abs(c - endCol);
    
    // G score (distance from start)
    const gScore = {};
    // F score (g + heuristic)
    const fScore = {};
    
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
        for (let c = 0; c < CONFIG.GRID_COLS; c++) {
            gScore[`${r},${c}`] = Infinity;
            fScore[`${r},${c}`] = Infinity;
        }
    }
    
    gScore[`${startRow},${startCol}`] = 0;
    fScore[`${startRow},${startCol}`] = heuristic(startRow, startCol);
    
    const openSet = [{ row: startRow, col: startCol }];
    const openSetKeys = new Set([`${startRow},${startCol}`]);
    const closedSet = new Set();
    const parentMap = {};
    
    highlightPseudocodeLine(0);
    highlightPseudocodeLine(1);
    highlightPseudocodeLine(2);
    highlightPseudocodeLine(3);
    
    while (openSet.length > 0) {
        if (state.shouldStop) return false;
        
        highlightPseudocodeLine(4);
        // Get node with lowest f score
        openSet.sort((a, b) => fScore[`${a.row},${a.col}`] - fScore[`${b.row},${b.col}`]);
        const current = openSet.shift();
        const currentKey = `${current.row},${current.col}`;
        openSetKeys.delete(currentKey);
        
        highlightPseudocodeLine(5);
        state.nodesVisited++;
        updateStats();
        
        if (state.grid[current.row][current.col] !== CELL.START && 
            state.grid[current.row][current.col] !== CELL.END) {
            state.grid[current.row][current.col] = CELL.VISITED;
        }
        
        if (current.row === endRow && current.col === endCol) {
            highlightPseudocodeLine(6);
            highlightPseudocodeLine(7);
            await reconstructPath(parentMap, endRow, endCol);
            setStatus('Path Found');
            return true;
        }
        
        closedSet.add(currentKey);
        
        highlightPseudocodeLine(8);
        const neighbors = getNeighbors(current.row, current.col);
        
        for (const neighbor of neighbors) {
            const nKey = `${neighbor.row},${neighbor.col}`;
            
            if (closedSet.has(nKey)) continue;
            
            highlightPseudocodeLine(9);
            const tentativeG = gScore[currentKey] + 1;
            
            highlightPseudocodeLine(10);
            if (tentativeG < gScore[nKey]) {
                parentMap[nKey] = currentKey;
                gScore[nKey] = tentativeG;
                fScore[nKey] = tentativeG + heuristic(neighbor.row, neighbor.col);
                
                highlightPseudocodeLine(11);
                if (!openSetKeys.has(nKey)) {
                    highlightPseudocodeLine(12);
                    openSet.push(neighbor);
                    openSetKeys.add(nKey);
                    
                    if (state.grid[neighbor.row][neighbor.col] !== CELL.START && 
                        state.grid[neighbor.row][neighbor.col] !== CELL.END &&
                        state.grid[neighbor.row][neighbor.col] !== CELL.VISITED) {
                        state.grid[neighbor.row][neighbor.col] = CELL.FRONTIER;
                    }
                }
            }
        }
        
        drawGrid();
        await sleep(state.speed / 2);
    }
    
    highlightPseudocodeLine(13);
    setStatus('No Path');
    return false;
}

/**
 * Generate random maze using recursive backtracking
 */
function generateMaze() {
    // Fill grid with walls
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            state.grid[row][col] = CELL.WALL;
        }
    }
    
    // Recursive backtracking maze generation
    const stack = [];
    const startRow = 1;
    const startCol = 1;
    
    state.grid[startRow][startCol] = CELL.EMPTY;
    stack.push({ row: startRow, col: startCol });
    
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const { row, col } = current;
        
        // Get unvisited neighbors (2 cells away)
        const directions = [
            { dr: -2, dc: 0 },
            { dr: 2, dc: 0 },
            { dr: 0, dc: -2 },
            { dr: 0, dc: 2 }
        ];
        
        const unvisited = directions.filter(({ dr, dc }) => {
            const newRow = row + dr;
            const newCol = col + dc;
            return newRow > 0 && newRow < CONFIG.GRID_ROWS - 1 &&
                   newCol > 0 && newCol < CONFIG.GRID_COLS - 1 &&
                   state.grid[newRow][newCol] === CELL.WALL;
        });
        
        if (unvisited.length > 0) {
            // Choose random direction
            const { dr, dc } = unvisited[Math.floor(Math.random() * unvisited.length)];
            const newRow = row + dr;
            const newCol = col + dc;
            
            // Carve passage
            state.grid[row + Math.floor(dr / 2)][col + Math.floor(dc / 2)] = CELL.EMPTY;
            state.grid[newRow][newCol] = CELL.EMPTY;
            
            stack.push({ row: newRow, col: newCol });
        } else {
            stack.pop();
        }
    }
    
    // Set start and end
    state.startNode = { row: 1, col: 1 };
    state.endNode = { row: CONFIG.GRID_ROWS - 2, col: CONFIG.GRID_COLS - 2 };
    state.grid[state.startNode.row][state.startNode.col] = CELL.START;
    state.grid[state.endNode.row][state.endNode.col] = CELL.END;
    
    drawGrid();
}

// ============================================
// UI Controllers
// ============================================

/**
 * Switch between tabs
 */
function switchTab(tab) {
    state.currentTab = tab;
    state.shouldStop = true;
    state.isRunning = false;
    state.isPaused = false;
    
    // Update tab styling
    DOM.tabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    // Update algorithm dropdown
    updateAlgorithmDropdown(tab);
    
    // Show/hide appropriate containers
    const isSortOrSearch = tab === 'sort' || tab === 'search';
    DOM.barsContainer.style.display = isSortOrSearch ? 'flex' : 'none';
    DOM.canvasContainer.style.display = tab === 'path' ? 'flex' : 'none';
    
    // Show/hide controls
    DOM.sizeControl.style.display = isSortOrSearch ? 'flex' : 'none';
    DOM.arrayControls.style.display = isSortOrSearch ? 'flex' : 'none';
    DOM.customInputGroup.style.display = isSortOrSearch ? 'flex' : 'none';
    DOM.searchTargetGroup.style.display = tab === 'search' ? 'flex' : 'none';
    DOM.pathfindingModes.style.display = tab === 'path' ? 'flex' : 'none';
    
    // Show/hide nodes visited stat
    DOM.nodesVisitedContainer.style.display = tab === 'path' ? 'flex' : 'none';
    
    // Initialize appropriate visualization
    if (isSortOrSearch) {
        generateArray();
        renderBars();
    } else {
        initGrid();
        drawGrid();
    }
    
    // Reset stats and update info
    resetStats();
    state.history = [];
    state.historyIndex = -1;
    
    const algorithm = DOM.algorithmSelect.value;
    state.currentAlgorithm = algorithm;
    updateAlgorithmInfo(algorithm);
    setStatus('Ready');
    updatePlayPauseButton();
}

/**
 * Update algorithm dropdown based on current tab
 */
function updateAlgorithmDropdown(tab) {
    DOM.algorithmSelect.innerHTML = '';
    
    let options = [];
    switch (tab) {
        case 'sort':
            options = [
                { value: 'bubble', text: 'Bubble Sort' },
                { value: 'selection', text: 'Selection Sort' },
                { value: 'insertion', text: 'Insertion Sort' },
                { value: 'quick', text: 'Quick Sort' },
                { value: 'merge', text: 'Merge Sort' }
            ];
            break;
        case 'search':
            options = [
                { value: 'linear', text: 'Linear Search' },
                { value: 'binary', text: 'Binary Search' }
            ];
            break;
        case 'path':
            options = [
                { value: 'bfs', text: 'BFS (Breadth-First)' },
                { value: 'dfs', text: 'DFS (Depth-First)' },
                { value: 'dijkstra', text: "Dijkstra's Algorithm" },
                { value: 'astar', text: 'A* Search' }
            ];
            break;
    }
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        DOM.algorithmSelect.appendChild(option);
    });
    
    state.currentAlgorithm = options[0].value;
    updateAlgorithmInfo(state.currentAlgorithm);
}

/**
 * Play/Pause toggle
 */
async function togglePlayPause() {
    if (state.isRunning) {
        if (state.isPaused) {
            // Resume
            state.isPaused = false;
            setStatus('Running');
        } else {
            // Pause
            state.isPaused = true;
            setStatus('Paused');
        }
        updatePlayPauseButton();
    } else {
        // Start new run
        await runAlgorithm();
    }
}

/**
 * Run the selected algorithm
 */
async function runAlgorithm() {
    if (state.isRunning) return;
    
    state.isRunning = true;
    state.isPaused = false;
    state.shouldStop = false;
    state.history = [];
    state.historyIndex = -1;
    resetStats();
    setStatus('Running');
    updatePlayPauseButton();
    
    // Save initial state
    if (state.currentTab !== 'path') {
        saveState({ highlightIndices: [], highlightType: 'default' });
    }
    
    try {
        switch (state.currentAlgorithm) {
            // Sorting
            case 'bubble':
                await bubbleSort();
                break;
            case 'selection':
                await selectionSort();
                break;
            case 'insertion':
                await insertionSort();
                break;
            case 'quick':
                await quickSort();
                break;
            case 'merge':
                await mergeSort();
                break;
            
            // Searching
            case 'linear':
                await linearSearch();
                break;
            case 'binary':
                await binarySearch();
                break;
            
            // Pathfinding
            case 'bfs':
                await bfs();
                break;
            case 'dfs':
                await dfs();
                break;
            case 'dijkstra':
                await dijkstra();
                break;
            case 'astar':
                await astar();
                break;
        }
        
        if (!state.shouldStop) {
            if (state.currentTab === 'sort') {
                setStatus('Completed');
            }
        }
    } catch (error) {
        console.error('Algorithm error:', error);
    }
    
    state.isRunning = false;
    state.isPaused = false;
    updatePlayPauseButton();
}

/**
 * Update play/pause button icon
 */
function updatePlayPauseButton() {
    if (state.isRunning && !state.isPaused) {
        DOM.playPauseIcon.textContent = '⏸️';
    } else {
        DOM.playPauseIcon.textContent = '▶️';
    }
}

/**
 * Reset visualization
 */
function reset() {
    state.shouldStop = true;
    state.isRunning = false;
    state.isPaused = false;
    state.history = [];
    state.historyIndex = -1;
    resetStats();
    
    if (state.currentTab === 'path') {
        initGrid();
        drawGrid();
    } else {
        generateArray();
        renderBars();
    }
    
    setStatus('Ready');
    updatePlayPauseButton();
    highlightPseudocodeLine(-1);
}

/**
 * Step forward through history
 */
function stepForward() {
    if (state.historyIndex < state.history.length - 1) {
        restoreState(state.historyIndex + 1);
    }
}

/**
 * Step backward through history
 */
function stepBack() {
    if (state.historyIndex > 0) {
        restoreState(state.historyIndex - 1);
    }
}

/**
 * Handle speed change
 */
function handleSpeedChange() {
    state.speed = parseInt(DOM.speedSlider.value);
    DOM.speedValue.textContent = state.speed;
}

/**
 * Handle size change
 */
function handleSizeChange() {
    state.arraySize = parseInt(DOM.sizeSlider.value);
    DOM.sizeValue.textContent = state.arraySize;
    
    if (!state.isRunning) {
        generateArray();
        renderBars();
    }
}

/**
 * Handle custom input
 */
function handleCustomInput() {
    const input = DOM.customInput.value;
    const values = input.split(',')
        .map(v => parseInt(v.trim()))
        .filter(v => !isNaN(v) && v > 0 && v <= 100);
    
    if (values.length > 0) {
        state.array = values;
        state.arraySize = values.length;
        DOM.sizeValue.textContent = state.arraySize;
        DOM.sizeSlider.value = Math.min(Math.max(state.arraySize, 10), 100);
        renderBars();
    }
}

/**
 * Handle algorithm selection change
 */
function handleAlgorithmChange() {
    state.currentAlgorithm = DOM.algorithmSelect.value;
    updateAlgorithmInfo(state.currentAlgorithm);
    
    if (!state.isRunning) {
        reset();
    }
}

/**
 * Handle search target change
 */
function handleSearchTargetChange() {
    state.searchTarget = parseInt(DOM.searchTarget.value);
}

/**
 * Set pathfinding draw mode
 */
function setDrawMode(mode) {
    state.drawMode = mode;
    
    // Update mode button styling
    DOM.wallModeBtn.classList.toggle('active', mode === 'wall');
    DOM.startModeBtn.classList.toggle('active', mode === 'start');
    DOM.endModeBtn.classList.toggle('active', mode === 'end');
}

/**
 * Clear pathfinding grid (keep start/end)
 */
function clearGrid() {
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            if (state.grid[row][col] !== CELL.START && state.grid[row][col] !== CELL.END) {
                state.grid[row][col] = CELL.EMPTY;
            }
        }
    }
    drawGrid();
    resetStats();
    setStatus('Ready');
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // Tab navigation
    DOM.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Playback controls
    DOM.playPauseBtn.addEventListener('click', togglePlayPause);
    DOM.resetBtn.addEventListener('click', reset);
    DOM.stepForwardBtn.addEventListener('click', stepForward);
    DOM.stepBackBtn.addEventListener('click', stepBack);
    DOM.prevBtn.addEventListener('click', stepBack);
    DOM.nextBtn.addEventListener('click', stepForward);
    
    // Settings
    DOM.algorithmSelect.addEventListener('change', handleAlgorithmChange);
    DOM.speedSlider.addEventListener('input', handleSpeedChange);
    DOM.sizeSlider.addEventListener('input', handleSizeChange);
    
    // Array controls
    DOM.generateBtn.addEventListener('click', () => {
        if (!state.isRunning) {
            generateArray();
            renderBars();
        }
    });
    DOM.customInputBtn.addEventListener('click', handleCustomInput);
    DOM.customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCustomInput();
    });
    
    // Search target
    DOM.searchTarget.addEventListener('change', handleSearchTargetChange);
    
    // Pathfinding controls
    DOM.wallModeBtn.addEventListener('click', () => setDrawMode('wall'));
    DOM.startModeBtn.addEventListener('click', () => setDrawMode('start'));
    DOM.endModeBtn.addEventListener('click', () => setDrawMode('end'));
    DOM.clearGridBtn.addEventListener('click', clearGrid);
    DOM.generateMazeBtn.addEventListener('click', generateMaze);
    
    // Canvas mouse events
    DOM.pathCanvas.addEventListener('mousedown', (e) => {
        state.isDrawing = true;
        handleCanvasInteraction(e);
    });
    
    DOM.pathCanvas.addEventListener('mousemove', (e) => {
        if (state.isDrawing && state.drawMode === 'wall') {
            handleCanvasInteraction(e);
        }
    });
    
    DOM.pathCanvas.addEventListener('mouseup', () => {
        state.isDrawing = false;
    });
    
    DOM.pathCanvas.addEventListener('mouseleave', () => {
        state.isDrawing = false;
    });
    
    // Touch events for mobile
    DOM.pathCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.isDrawing = true;
        const touch = e.touches[0];
        handleCanvasInteraction({ clientX: touch.clientX, clientY: touch.clientY });
    });
    
    DOM.pathCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (state.isDrawing && state.drawMode === 'wall') {
            const touch = e.touches[0];
            handleCanvasInteraction({ clientX: touch.clientX, clientY: touch.clientY });
        }
    });
    
    DOM.pathCanvas.addEventListener('touchend', () => {
        state.isDrawing = false;
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        if (state.currentTab === 'path') {
            drawGrid();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key) {
            case ' ':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'r':
            case 'R':
                reset();
                break;
            case 'ArrowRight':
                stepForward();
                break;
            case 'ArrowLeft':
                stepBack();
                break;
        }
    });
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM references
    initDOM();
    
    // Set up event listeners
    initEventListeners();
    
    // Initialize with sorting tab
    switchTab('sort');
    
    console.log('Algorithm Visualizer initialized successfully!');
});
