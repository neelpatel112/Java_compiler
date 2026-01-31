// JavaLab - Real Java Compiler Frontend
// Connects to backend for actual Java compilation

// Configuration
const BACKEND_URL = 'https://your-backend-url.vercel.app'; // Change this after deploying backend
const API_ENDPOINT = `${BACKEND_URL}/compile`;

// DOM Elements
const codeEditor = document.getElementById('codeEditor');
const outputDiv = document.getElementById('output');
const lineCountSpan = document.getElementById('lineCount');
const statusText = document.getElementById('statusText');
const statusIndicator = document.querySelector('.status-indicator');

// State
let currentCode = '';
let isRunning = false;
let lineNumbers = '';

// Initialize
function initialize() {
    console.log('🚀 JavaLab Compiler Initialized');
    
    // Update line numbers
    updateLineNumbers();
    
    // Load saved code
    loadSavedCode();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update status
    updateStatus('ready', 'Ready to compile');
}

// Update line numbers
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    const lineCount = lines.length;
    lineCountSpan.textContent = lineCount;
    
    // Generate line numbers
    let numbers = '';
    for (let i = 1; i <= lineCount; i++) {
        numbers += i + '\n';
    }
    
    // Update or create line numbers container
    let lineNumbersContainer = document.querySelector('.code-line-numbers');
    if (!lineNumbersContainer) {
        lineNumbersContainer = document.createElement('div');
        lineNumbersContainer.className = 'code-line-numbers';
        codeEditor.parentNode.insertBefore(lineNumbersContainer, codeEditor);
    }
    
    lineNumbersContainer.innerHTML = `<div id="lineNumbers">${numbers}</div>`;
}

// Setup event listeners
function setupEventListeners() {
    // Update line numbers on input
    codeEditor.addEventListener('input', function() {
        updateLineNumbers();
        saveCode();
    });
    
    // Keyboard shortcuts
    codeEditor.addEventListener('keydown', function(e) {
        // Tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            insertTab();
        }
        
        // Ctrl+Enter to run
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCode();
            showToast('Code saved locally');
        }
    });
    
    // Scroll sync for line numbers
    codeEditor.addEventListener('scroll', function() {
        const lineNumbersContainer = document.querySelector('.code-line-numbers');
        if (lineNumbersContainer) {
            lineNumbersContainer.scrollTop = codeEditor.scrollTop;
        }
    });
}

// Run Java code
async function runCode() {
    if (isRunning) {
        showToast('Already compiling, please wait...', 'warning');
        return;
    }
    
    const code = codeEditor.value.trim();
    
    if (!code) {
        showOutput('❌ Error: No code to execute!\nPlease write some Java code first.', 'error');
        return;
    }
    
    // Check for main class
    if (!code.includes('public class Main') && !code.includes('class Main')) {
        const confirmRun = confirm(
            '⚠️ Your code doesn\'t have "public class Main".\n' +
            'Java requires a Main class with main method.\n' +
            'Do you want to run anyway?'
        );
        
        if (!confirmRun) return;
    }
    
    if (!code.includes('public static void main')) {
        const confirmRun = confirm(
            '⚠️ Your code doesn\'t have main method.\n' +
            'Java requires: public static void main(String[] args)\n' +
            'Do you want to run anyway?'
        );
        
        if (!confirmRun) return;
    }
    
    isRunning = true;
    updateStatus('compiling', 'Compiling Java code...');
    
    // Show loading
    showLoading(true);
    
    // Clear previous output
    clearOutput();
    
    try {
        // Send code to backend
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                language: 'java',
                version: '17'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success
            if (data.success) {
                showOutput(data.output, 'success');
                updateStatus('success', 'Execution successful');
                
                // Show execution time if available
                if (data.executionTime) {
                    showToast(`Execution time: ${data.executionTime}ms`);
                }
            } else {
                // Compilation error
                showOutput(data.output || data.error, 'error');
                updateStatus('error', 'Compilation failed');
            }
        } else {
            // API error
            showOutput(`❌ Server Error: ${data.error || 'Unknown error'}\n\nTry again later.`, 'error');
            updateStatus('error', 'Server error');
        }
        
    } catch (error) {
        // Network error or backend not reachable
        console.error('API Error:', error);
        
        // Fallback: Use local simulation (basic)
        const simulatedOutput = simulateJavaExecution(code);
        showOutput(
            `⚠️ Backend Unavailable\n` +
            `════════════════════════════════════════\n\n` +
            `Using local simulation (limited features):\n\n` +
            simulatedOutput +
            `\n\n════════════════════════════════════════\n` +
            `Note: For full Java execution, backend server is required.\n` +
            `Setup backend for 100% real Java compilation.`,
            'warning'
        );
        updateStatus('warning', 'Using simulation mode');
        
    } finally {
        isRunning = false;
        showLoading(false);
    }
}

// Basic Java simulation (fallback when backend is down)
function simulateJavaExecution(code) {
    console.log('Using simulation mode');
    
    const lines = code.split('\n');
    let output = [];
    let errors = [];
    
    // Simple simulation
    for (let line of lines) {
        line = line.trim();
        
        // Extract print statements
        if (line.includes('System.out.print')) {
            const match = line.match(/System\.out\.print(?:ln)?\((.*?)\);/);
            if (match) {
                const content = match[1].replace(/"/g, '');
                output.push(content);
            }
        }
        
        // Detect for loops
        if (line.startsWith('for') || line.includes('for (')) {
            const loopMatch = line.match(/for\s*\(.*?(\w+)\s*=\s*(\d+).*?(\w+)\s*([<>]=?)\s*(\d+)/);
            if (loopMatch) {
                const [_, varName, start, endVar, operator, end] = loopMatch;
                output.push(`[Loop: ${varName} from ${start} to ${end}]`);
            }
        }
    }
    
    if (output.length === 0) {
        output.push('(No output generated)');
    }
    
    if (errors.length > 0) {
        return `❌ Errors:\n${errors.join('\n')}\n\nOutput:\n${output.join('\n')}`;
    }
    
    return output.join('\n');
}

// Show output in console
function showOutput(message, type = 'info') {
    // Clear placeholder if exists
    const placeholder = outputDiv.querySelector('.output-placeholder');
    if (placeholder) {
        outputDiv.innerHTML = '';
    }
    
    // Create formatted output
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Create console lines
    const lines = message.split('\n');
    let consoleHTML = '';
    
    lines.forEach((line, index) => {
        let lineClass = '';
        if (type === 'error') lineClass = 'error';
        else if (type === 'success') lineClass = 'success';
        else if (type === 'warning') lineClass = 'warning';
        else lineClass = 'info';
        
        consoleHTML += `
            <div class="console-line">
                <div class="console-line-number">${index + 1}</div>
                <div class="console-content ${lineClass}">${escapeHtml(line)}</div>
            </div>
        `;
    });
    
    outputDiv.innerHTML = consoleHTML;
    
    // Scroll to bottom
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// Clear output
function clearOutput() {
    outputDiv.innerHTML = `
        <div class="output-placeholder">
        // ====================================
        // 🚀 JavaLab Online Compiler
        // ====================================
        //
        // Features:
        // • REAL Java compilation
        // • Full loop & condition support
        // • Works with any Java code
        // • Fast execution
        //
        // Write your code and click "Run Code"
        // ====================================
        </div>
    `;
}

// Clear code editor
function clearCode() {
    if (!codeEditor.value.trim()) return;
    
    if (confirm('Clear all code? This cannot be undone.')) {
        codeEditor.value = '';
        updateLineNumbers();
        localStorage.removeItem('javalab_code');
        showToast('Code cleared');
        updateStatus('ready', 'Ready to compile');
    }
}

// Load example code
function loadExample() {
    const exampleCode = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 JavaLab - Real Java Compiler");
        System.out.println("================================");
        
        // Array operations
        int[] numbers = {10, 20, 30, 40, 50};
        System.out.println("\\nArray elements:");
        for(int i = 0; i < numbers.length; i++) {
            System.out.println("numbers[" + i + "] = " + numbers[i]);
        }
        
        // Calculate sum
        int sum = 0;
        for(int num : numbers) {
            sum += num;
        }
        System.out.println("\\nSum of array: " + sum);
        
        // Find maximum
        int max = numbers[0];
        for(int num : numbers) {
            if(num > max) max = num;
        }
        System.out.println("Maximum value: " + max);
        
        // String operations
        System.out.println("\\nString Operations:");
        String text = "Hello Java Programming";
        System.out.println("Original: " + text);
        System.out.println("Uppercase: " + text.toUpperCase());
        System.out.println("Length: " + text.length());
        
        // ArrayList example
        System.out.println("\\nArrayList Example:");
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");
        fruits.add("Orange");
        
        for(String fruit : fruits) {
            System.out.println("Fruit: " + fruit);
        }
        
        System.out.println("\\n✅ Program executed successfully!");
        System.out.println("📊 Total operations: " + (numbers.length + fruits.size()));
    }
}`;
    
    codeEditor.value = exampleCode;
    updateLineNumbers();
    saveCode();
    showToast('Example code loaded');
}

// Insert tab character
function insertTab() {
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    
    // Insert 4 spaces at cursor position
    codeEditor.value = codeEditor.value.substring(0, start) + '    ' + codeEditor.value.substring(end);
    
    // Move cursor
    codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
    updateLineNumbers();
}

// Save code to localStorage
function saveCode() {
    try {
        localStorage.setItem('javalab_code', codeEditor.value);
    } catch (e) {
        console.warn('Failed to save code:', e);
    }
}

// Load saved code
function loadSavedCode() {
    try {
        const savedCode = localStorage.getItem('javalab_code');
        if (savedCode) {
            codeEditor.value = savedCode;
            updateLineNumbers();
            showToast('Previous code loaded');
        }
    } catch (e) {
        console.warn('Failed to load code:', e);
    }
}

// Update status
function updateStatus(type, message) {
    // Remove existing status classes
    statusIndicator.parentNode.parentNode.classList.remove(
        'status-compiling', 'status-error', 'status-success'
    );
    
    // Add new status class
    if (type === 'compiling') {
        statusIndicator.parentNode.parentNode.classList.add('status-compiling');
    } else if (type === 'error') {
        statusIndicator.parentNode.parentNode.classList.add('status-error');
    } else if (type === 'success') {
        statusIndicator.parentNode.parentNode.classList.add('status-success');
    }
    
    // Update text
    statusText.textContent = message;
}

// Show loading overlay
function showLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    
    if (!overlay && show) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Compiling Java Code...</div>
        `;
        document.querySelector('.container').appendChild(overlay);
    }
    
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f85149' : type === 'warning' ? '#d29922' : '#238636'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Escape HTML for safe output
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initialize);

// Make functions available globally
window.runCode = runCode;
window.clearCode = clearCode;
window.clearOutput = clearOutput;
window.loadExample = loadExample;

console.log('JavaLab Frontend Loaded');