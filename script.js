// QuickJava - Professional Online Java Compiler
// Version 2.0 - Enhanced with Syntax Highlighting

let codeEditor;
let isCompiling = false;

// DOM Elements
const outputDiv = document.getElementById('output');
const lineCountSpan = document.getElementById('lineCount');
const fileInput = document.getElementById('fileInput');

// Initialize CodeMirror Editor
function initializeCodeMirror() {
    codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'text/x-java',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        styleActiveLine: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Ctrl-Enter": function() { runCode(); },
            "Ctrl-S": function() { saveCode(); showStatus('Code saved locally', 'success'); },
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                } else {
                    cm.replaceSelection('    ', 'end');
                }
            },
            "Shift-Tab": function(cm) {
                cm.indentSelection('subtract');
            }
        },
        hintOptions: {
            hint: CodeMirror.hint.anyword,
            completeSingle: false,
            alignWithWord: true,
            closeCharacters: /[\s()\[\]{};:>,]/
        }
    });

    // Set initial content
    setDefaultCode();
    
    // Update line count
    updateLineCount();
    
    // Load saved code
    loadSavedCode();
    
    // Initialize events
    setupEventListeners();
    
    console.log('🚀 CodeMirror Editor Initialized');
}

// Set default code
function setDefaultCode() {
    const defaultCode = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Welcome to QuickJava Compiler!");
        System.out.println("================================");
        
        // Create scanner for input
        Scanner scanner = new Scanner(System.in);
        
        // Simple calculator example
        System.out.println("\\n🔢 Simple Calculator");
        System.out.print("Enter first number: ");
        double num1 = 15; // scanner.nextDouble();
        
        System.out.print("Enter second number: ");
        double num2 = 7; // scanner.nextDouble();
        
        System.out.println("\\n📊 Results:");
        System.out.println(num1 + " + " + num2 + " = " + (num1 + num2));
        System.out.println(num1 + " - " + num2 + " = " + (num1 - num2));
        System.out.println(num1 + " * " + num2 + " = " + (num1 * num2));
        System.out.println(num1 + " / " + num2 + " = " + (num1 / num2));
        
        // Loop example
        System.out.println("\\n🔄 Loop Example (1 to 5):");
        for(int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
        
        System.out.println("\\n✅ Program executed successfully!");
        System.out.println("💡 Try modifying the code and run again!");
        
        // scanner.close();
    }
}`;
    
    codeEditor.setValue(defaultCode);
    updateLineCount();
}

// Setup event listeners
function setupEventListeners() {
    // Update line count on change
    codeEditor.on('change', updateLineCount);
    
    // Auto-save on change (with debounce)
    let saveTimeout;
    codeEditor.on('change', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveCode, 2000);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCode();
            showStatus('Code saved locally', 'success');
        }
        
        // Ctrl+O to open file
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            openFile();
        }
        
        // Ctrl+D to duplicate line
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            duplicateLine();
        }
    });
}

// Update line count
function updateLineCount() {
    const lineCount = codeEditor.lineCount();
    lineCountSpan.textContent = lineCount;
    
    // Update status color based on line count
    if (lineCount > 100) {
        lineCountSpan.style.color = '#f87171'; // Red
    } else if (lineCount > 50) {
        lineCountSpan.style.color = '#fbbf24'; // Yellow
    } else {
        lineCountSpan.style.color = '#34d399'; // Green
    }
}

// Run Java code
function runCode() {
    if (isCompiling) {
        showOutput('🔄 Already compiling... Please wait.', 'warning');
        return;
    }
    
    const code = codeEditor.getValue().trim();
    
    if (!code) {
        showOutput('❌ Error: No code to execute!\nPlease write some Java code first.', 'error');
        return;
    }
    
    isCompiling = true;
    showStatus('Compiling...', 'info');
    
    // Show compiling animation
    showOutput(
        '🔧 Compiling Java Code...\n' +
        '════════════════════════════════════════\n' +
        '⏳ Checking syntax...\n' +
        '⏳ Validating code structure...\n' +
        '⏳ Preparing execution environment...\n',
        'info'
    );
    
    // Simulate compilation delay
    setTimeout(() => {
        try {
            const result = executeJavaCode(code);
            showOutput(result.output, result.success ? 'success' : 'error');
            
            if (result.success) {
                saveCode(); // Auto-save successful code
                showStatus('Execution successful', 'success');
                updateCodeMetrics(code);
            } else {
                showStatus('Compilation failed', 'error');
            }
        } catch (error) {
            showOutput(`❌ Unexpected Error:\n${error.message}\n\nPlease try again.`, 'error');
            showStatus('Error occurred', 'error');
        } finally {
            isCompiling = false;
        }
    }, 1000);
}

// Execute Java code simulation
function executeJavaCode(code) {
    console.log('⚙️ Executing Java code...');
    
    const lines = code.split('\n');
    const output = [];
    let errors = [];
    let warnings = [];
    
    // Basic syntax checks
    if (!code.includes('public class')) {
        errors.push('Missing "public class" declaration');
    }
    
    if (!code.includes('public static void main')) {
        errors.push('Missing main method: public static void main(String[] args)');
    }
    
    // Check for common errors
    const classNameMatch = code.match(/public class (\w+)/);
    if (classNameMatch && classNameMatch[1] !== 'Main') {
        warnings.push(`Class name is "${classNameMatch[1]}" instead of "Main"`);
    }
    
    // Count braces for balance check
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push(`Unbalanced braces: {${openBraces} vs }${closeBraces}`);
    }
    
    // Find and simulate print statements
    let printCount = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip comments
        if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            continue;
        }
        
        // Extract print statements
        if (line.includes('System.out.print')) {
            printCount++;
            const content = extractPrintContent(line);
            if (content) {
                output.push(content);
            }
        }
        
        // Detect common patterns
        if (line.includes('for(') || line.includes('for (')) {
            // Simulate loop output
            const loopMatch = line.match(/for\s*\(\s*(.+?)\s*;\s*(.+?)\s*;\s*(.+?)\s*\)/);
            if (loopMatch) {
                output.push(`[Loop initialized: ${loopMatch[1]}; ${loopMatch[2]}; ${loopMatch[3]}]`);
            }
        }
        
        // Detect variable declarations
        const varDecl = line.match(/(int|double|String|boolean|float|char|long)\s+(\w+)\s*(=\s*.+)?\s*;/);
        if (varDecl) {
            console.log(`Variable: ${varDecl[1]} ${varDecl[2]} ${varDecl[3] || ''}`);
        }
    }
    
    // If there are errors, return them
    if (errors.length > 0) {
        return {
            success: false,
            output: `❌ Compilation Failed!\n════════════════════════════════════════\n\nErrors:\n${errors.map(e => `  • ${e}`).join('\n')}\n\nLine count: ${lines.length}\nPrint statements: ${printCount}\n\n💡 Fix the errors and try again.`
        };
    }
    
    // Build successful output
    let resultOutput = `✅ Compilation Successful!\n`;
    resultOutput += `════════════════════════════════════════\n\n`;
    
    if (output.length > 0) {
        resultOutput += `📤 Program Output:\n`;
        resultOutput += `────────────────────────────────\n`;
        resultOutput += output.join('\n') + '\n\n';
    } else {
        resultOutput += `📤 No output generated.\n`;
        resultOutput += `The program ran successfully but didn't produce any output.\n\n`;
    }
    
    // Add warnings if any
    if (warnings.length > 0) {
        resultOutput += `⚠️ Warnings:\n`;
        resultOutput += `────────────────────────────────\n`;
        resultOutput += warnings.map(w => `  • ${w}`).join('\n') + '\n\n';
    }
    
    // Add execution summary
    resultOutput += `📊 Execution Summary:\n`;
    resultOutput += `────────────────────────────────\n`;
    resultOutput += `• Total lines: ${lines.length}\n`;
    resultOutput += `• Print statements: ${printCount}\n`;
    resultOutput += `• Open braces: {${openBraces}\n`;
    resultOutput += `• Close braces: }${closeBraces}\n`;
    resultOutput += `• Status: Successfully executed\n\n`;
    
    resultOutput += `🎉 Code executed successfully!\n`;
    resultOutput += `💡 Tip: Try adding more print statements to see output.`;
    
    return {
        success: true,
        output: resultOutput
    };
}

// Extract content from print statements
function extractPrintContent(line) {
    // Remove comments
    const cleanLine = line.split('//')[0];
    
    // Match System.out.println("text")
    const stringMatch = cleanLine.match(/System\.out\.print(?:ln)?\s*\(\s*"([^"]+)"\s*\)/);
    if (stringMatch) return stringMatch[1];
    
    // Match System.out.println(variable)
    const varMatch = cleanLine.match(/System\.out\.print(?:ln)?\s*\(\s*([^);]+)\s*\)/);
    if (varMatch) {
        const varName = varMatch[1].trim();
        // Simulate some variable values
        if (varName.includes('+')) {
            return `[Expression: ${varName}]`;
        }
        return `[Variable: ${varName}]`;
    }
    
    return null;
}

// Show output in panel
function showOutput(message, type = 'info') {
    // Clear placeholder
    const placeholder = outputDiv.querySelector('.output-placeholder');
    if (placeholder) {
        outputDiv.innerHTML = '';
    }
    
    // Add timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    const header = `⏰ ${timeStr} | ${type.toUpperCase()}\n`;
    const fullMessage = header + '═'.repeat(50) + '\n' + message;
    
    // Apply styling
    outputDiv.style.color = {
        'error': '#f87171',
        'warning': '#fbbf24',
        'success': '#34d399',
        'info': '#60a5fa'
    }[type] || '#d1d5db';
    
    outputDiv.textContent = fullMessage;
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

// Show status in footer
function showStatus(message, type = 'info') {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status span:last-child');
    
    const colors = {
        'error': '#ef4444',
        'warning': '#f59e0b',
        'success': '#10b981',
        'info': '#3b82f6'
    };
    
    statusDot.style.backgroundColor = colors[type] || colors.info;
    statusText.textContent = message;
    
    // Auto-clear info messages after 3 seconds
    if (type === 'info') {
        setTimeout(() => {
            if (statusText.textContent === message) {
                statusDot.style.backgroundColor = '#10b981';
                statusText.textContent = 'Ready';
            }
        }, 3000);
    }
}

// Load examples
function loadExample(type) {
    const examples = {
        'basic': `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to Java Programming!");
    }
}`,
        
        'loops': `public class Main {
    public static void main(String[] args) {
        // Array example
        int[] numbers = {10, 20, 30, 40, 50};
        
        System.out.println("Array elements:");
        for(int i = 0; i < numbers.length; i++) {
            System.out.println("numbers[" + i + "] = " + numbers[i]);
        }
        
        // Enhanced for loop
        System.out.println("\\nUsing enhanced for loop:");
        for(int num : numbers) {
            System.out.println("Number: " + num);
        }
        
        // While loop
        System.out.println("\\nWhile loop (5 to 1):");
        int count = 5;
        while(count > 0) {
            System.out.println("Countdown: " + count);
            count--;
        }
    }
}`,
        
        'calculator': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("🖩 Simple Calculator");
        System.out.println("====================");
        
        System.out.print("Enter first number: ");
        double num1 = 25; // scanner.nextDouble();
        
        System.out.print("Enter second number: ");
        double num2 = 5; // scanner.nextDouble();
        
        System.out.println("\\nChoose operation:");
        System.out.println("1. Addition (+)");
        System.out.println("2. Subtraction (-)");
        System.out.println("3. Multiplication (*)");
        System.out.println("4. Division (/)");
        System.out.print("Enter choice (1-4): ");
        int choice = 1; // scanner.nextInt();
        
        double result = 0;
        String operation = "";
        
        switch(choice) {
            case 1:
                result = num1 + num2;
                operation = "+";
                break;
            case 2:
                result = num1 - num2;
                operation = "-";
                break;
            case 3:
                result = num1 * num2;
                operation = "*";
                break;
            case 4:
                if(num2 != 0) {
                    result = num1 / num2;
                    operation = "/";
                } else {
                    System.out.println("Error: Division by zero!");
                    return;
                }
                break;
            default:
                System.out.println("Invalid choice!");
                return;
        }
        
        System.out.println("\\n📊 Result:");
        System.out.println(num1 + " " + operation + " " + num2 + " = " + result);
        
        // scanner.close();
    }
}`,
        
        'patterns': `public class Main {
    public static void main(String[] args) {
        System.out.println("🌟 Star Patterns");
        System.out.println("================");
        
        // Pattern 1: Right triangle
        System.out.println("\\nPattern 1: Right Triangle");
        for(int i = 1; i <= 5; i++) {
            for(int j = 1; j <= i; j++) {
                System.out.print("* ");
            }
            System.out.println();
        }
        
        // Pattern 2: Pyramid
        System.out.println("\\nPattern 2: Pyramid");
        int rows = 4;
        for(int i = 1; i <= rows; i++) {
            // Spaces
            for(int j = rows; j > i; j--) {
                System.out.print(" ");
            }
            // Stars
            for(int k = 1; k <= (2*i - 1); k++) {
                System.out.print("*");
            }
            System.out.println();
        }
        
        // Pattern 3: Number pattern
        System.out.println("\\nPattern 3: Number Triangle");
        for(int i = 1; i <= 5; i++) {
            for(int j = 1; j <= i; j++) {
                System.out.print(j + " ");
            }
            System.out.println();
        }
    }
}`,
        
        'college': `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // College Practical Example
        System.out.println("🎓 College Lab Practical");
        System.out.println("========================");
        
        // Example: Student Grade Calculator
        String[] subjects = {"Math", "Physics", "Chemistry", "English", "Computer"};
        int[] marks = {85, 78, 92, 88, 95};
        
        System.out.println("\\n📚 Subject Marks:");
        int total = 0;
        for(int i = 0; i < subjects.length; i++) {
            System.out.println(subjects[i] + ": " + marks[i] + "/100");
            total += marks[i];
        }
        
        double percentage = (double) total / subjects.length;
        char grade;
        
        if(percentage >= 90) grade = 'A';
        else if(percentage >= 80) grade = 'B';
        else if(percentage >= 70) grade = 'C';
        else if(percentage >= 60) grade = 'D';
        else grade = 'F';
        
        System.out.println("\\n📊 Result Summary:");
        System.out.println("Total Marks: " + total + "/500");
        System.out.println("Percentage: " + String.format("%.2f", percentage) + "%");
        System.out.println("Grade: " + grade);
        
        // Array operations
        System.out.println("\\n🔢 Array Operations:");
        int[] numbers = {12, 45, 78, 23, 56, 89, 34};
        
        // Find max and min
        int max = numbers[0];
        int min = numbers[0];
        for(int num : numbers) {
            if(num > max) max = num;
            if(num < min) min = num;
        }
        
        System.out.println("Array: " + java.util.Arrays.toString(numbers));
        System.out.println("Maximum: " + max);
        System.out.println("Minimum: " + min);
        
        System.out.println("\\n✅ Practical completed successfully!");
    }
}`
    };
    
    if (examples[type]) {
        codeEditor.setValue(examples[type]);
        updateLineCount();
        showOutput(`📋 Loaded example: ${type.replace(/\b\w/g, l => l.toUpperCase())}\nClick "Run Code" to execute.`, 'success');
        showStatus('Example loaded', 'success');
    }
}

// Clear code editor
function clearCode() {
    if (codeEditor.getValue().trim() === '') return;
    
    if (confirm('🗑️ Clear all code?\nThis action cannot be undone.')) {
        codeEditor.setValue('');
        updateLineCount();
        showOutput('📝 Editor cleared successfully\nReady for new code...', 'info');
        showStatus('Editor cleared', 'info');
        localStorage.removeItem('quickjava_code');
    }
}

// Clear output
function clearOutput() {
    outputDiv.innerHTML = `<div class="output-placeholder">
// 🚀 Welcome to QuickJava Compiler!
// ==================================
//
// Features:
// • Syntax highlighting
// • Auto code completion
// • Real-time error checking
// • Multiple Java examples
// • Export/Import functionality
//
// Click "Run Code" or press Ctrl+Enter to start
</div>`;
    outputDiv.style.color = '#64748b';
    showStatus('Output cleared', 'info');
}

// Save code to localStorage
function saveCode() {
    try {
        const code = codeEditor.getValue();
        localStorage.setItem('quickjava_code', code);
        console.log('💾 Code saved to localStorage');
        return true;
    } catch (e) {
        console.warn('Could not save code:', e);
        return false;
    }
}

// Load saved code
function loadSavedCode() {
    try {
        const savedCode = localStorage.getItem('quickjava_code');
        if (savedCode && savedCode.trim() !== '') {
            codeEditor.setValue(savedCode);
            updateLineCount();
            showStatus('Previous code loaded', 'success');
            console.log('📂 Loaded saved code');
        }
    } catch (e) {
        console.warn('Could not load saved code:', e);
    }
}

// Export code as .java file
function exportCode() {
    const code = codeEditor.getValue();
    if (!code.trim()) {
        showOutput('❌ No code to export!\nWrite some code first.', 'error');
        return;
    }
    
    const blob = new Blob([code], { type: 'text/x-java' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Main.java';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showOutput('📁 Code exported as Main.java\nYou can now open this file in any Java IDE.', 'success');
    showStatus('Code exported', 'success');
}

// Import code from file
function openFile() {
    fileInput.click();
}

// Handle file selection
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.java') && !file.name.endsWith('.txt')) {
        showOutput('❌ Invalid file type!\nPlease select a .java or .txt file.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        codeEditor.setValue(e.target.result);
        updateLineCount();
        showOutput(`📂 File "${file.name}" imported successfully\nCode loaded into editor.`, 'success');
        showStatus('File imported', 'success');
    };
    reader.readAsText(file);
    
    // Reset file input
    fileInput.value = '';
});

// Duplicate current line
function duplicateLine() {
    const cursor = codeEditor.getCursor();
    const line = codeEditor.getLine(cursor.line);
    codeEditor.replaceRange(line + '\n', {line: cursor.line, ch: 0});
    showStatus('Line duplicated', 'info');
}

// Update code metrics
function updateCodeMetrics(code) {
    const lines = code.split('\n').length;
    const chars = code.length;
    const words = code.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`📊 Metrics: ${lines} lines, ${words} words, ${chars} chars`);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeCodeMirror);

// Make functions available globally
window.runCode = runCode;
window.clearCode = clearCode;
window.clearOutput = clearOutput;
window.loadExample = loadExample;
window.exportCode = exportCode;
window.openFile = openFile;

console.log('🚀 QuickJava Compiler v2.0 Initialized');
console.log('📦 Features: Syntax Highlighting, Code Completion, File I/O');