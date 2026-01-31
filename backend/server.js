// JavaLab Backend Server
// Compiles and executes Java code

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create temp directory
const tempDir = path.join(os.tmpdir(), 'javalab-temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Cleanup old files on startup
cleanupTempFiles();

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'JavaLab Compiler API',
        version: '1.0.0',
        endpoints: {
            compile: 'POST /compile',
            health: 'GET /health'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Main compilation endpoint
app.post('/compile', async (req, res) => {
    const startTime = Date.now();
    const { code, language = 'java', version = '17' } = req.body;
    
    console.log(`📦 Received compilation request`);
    
    // Validate input
    if (!code || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'No code provided',
            output: '❌ Error: No Java code to compile'
        });
    }
    
    // Check code length (limit to prevent abuse)
    if (code.length > 10000) {
        return res.status(400).json({
            success: false,
            error: 'Code too long (max 10,000 characters)',
            output: '❌ Error: Code exceeds maximum length (10,000 characters)'
        });
    }
    
    // Check for malicious code patterns
    if (containsMaliciousCode(code)) {
        return res.status(400).json({
            success: false,
            error: 'Potentially malicious code detected',
            output: '❌ Security Error: Code contains restricted patterns'
        });
    }
    
    try {
        // Create unique filename
        const filename = `Main_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const javaFilePath = path.join(tempDir, `${filename}.java`);
        const classFilePath = path.join(tempDir, `${filename}.class`);
        
        // Ensure code has proper class structure
        let processedCode = ensureMainClass(code);
        
        // Write Java code to file
        fs.writeFileSync(javaFilePath, processedCode, 'utf8');
        console.log(`📝 Java file created: ${javaFilePath}`);
        
        // Compile Java code
        const compileResult = await compileJava(javaFilePath, tempDir);
        
        if (!compileResult.success) {
            // Cleanup
            cleanupFile(javaFilePath);
            
            return res.json({
                success: false,
                output: formatCompilationError(compileResult.error),
                executionTime: Date.now() - startTime
            });
        }
        
        // Execute compiled Java program
        const executionResult = await executeJava(filename, tempDir);
        
        // Cleanup files
        cleanupFile(javaFilePath);
        cleanupFile(classFilePath);
        
        // Check for timeout or other errors
        if (executionResult.timedOut) {
            return res.json({
                success: false,
                output: `⏰ Error: Program execution timed out (5 seconds)\n\n` +
                       `Possible reasons:\n` +
                       `• Infinite loop\n` +
                       `• Waiting for input (Scanner not supported)\n` +
                       `• Too much computation\n\n` +
                       `Tip: Use simple loops and avoid infinite loops.`,
                executionTime: Date.now() - startTime
            });
        }
        
        // Return result
        res.json({
            success: true,
            output: executionResult.output,
            executionTime: Date.now() - startTime
        });
        
    } catch (error) {
        console.error('❌ Server error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message,
            output: `❌ Server Error: ${error.message}\n\n` +
                   `Please try again or contact support.`
        });
    }
});

// Helper Functions

// Compile Java code
function compileJava(filePath, outputDir) {
    return new Promise((resolve) => {
        const command = `javac -d ${outputDir} "${filePath}"`;
        
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    success: false,
                    error: stderr || stdout || error.message
                });
            } else {
                resolve({
                    success: true,
                    output: stdout
                });
            }
        });
    });
}

// Execute Java program
function executeJava(className, classPath) {
    return new Promise((resolve) => {
        const command = `cd "${classPath}" && java ${className}`;
        
        // Set timeout to prevent infinite loops
        const childProcess = exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
            resolve({
                output: stdout || stderr,
                timedOut: false
            });
        });
        
        // Handle timeout
        childProcess.on('timeout', () => {
            childProcess.kill();
            resolve({
                output: '',
                timedOut: true
            });
        });
        
        // Handle any input attempts (prevent blocking)
        childProcess.stdin.end();
    });
}

// Ensure code has proper Main class
function ensureMainClass(code) {
    // Check if code already has Main class
    if (code.includes('public class Main') || code.includes('class Main')) {
        return code;
    }
    
    // Wrap code in Main class if not present
    return `public class Main {
    public static void main(String[] args) {
        // User code starts here
${code}
        // User code ends here
    }
}`;
}

// Security check
function containsMaliciousCode(code) {
    const dangerousPatterns = [
        /Runtime\.getRuntime\(\)/g,
        /ProcessBuilder/g,
        /exec\(/g,
        /System\.exit\(/g,
        /Thread\.sleep\(/g,
        /FileWriter/g,
        /FileOutputStream/g,
        /Socket\(/g,
        /ServerSocket\(/g,
        /Class\.forName/g,
        /javax\.script/g,
        /native\s/g,
        /synchronized\s*\(/g,
        /wait\(/g,
        /notify\(/g
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            return true;
        }
    }
    
    return false;
}

// Format compilation error for better display
function formatCompilationError(error) {
    let formattedError = error.toString();
    
    // Remove file paths for security
    formattedError = formattedError.replace(/\/tmp\/[^:\s]+/g, 'Main.java');
    
    // Make error messages more readable
    formattedError = formattedError
        .replace(/error:/gi, '❌ Error:')
        .replace(/warning:/gi, '⚠️ Warning:')
        .replace(/Main\.java:/g, 'Line ');
    
    // Add header
    formattedError = `❌ Compilation Failed\n` +
                    `════════════════════════════════════════\n\n` +
                    formattedError +
                    `\n\n💡 Tips:\n` +
                    `• Check for missing semicolons\n` +
                    `• Ensure braces are balanced\n` +
                    `• Verify variable declarations\n` +
                    `• Check method signatures`;
    
    return formattedError;
}

// Cleanup single file
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.warn(`Could not delete file ${filePath}:`, error.message);
    }
}

// Cleanup old temp files
function cleanupTempFiles() {
    try {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                // Ignore errors
            }
        });
    } catch (error) {
        console.warn('Could not cleanup temp files:', error.message);
    }
}

// Schedule periodic cleanup
setInterval(cleanupTempFiles, 10 * 60 * 1000); // Every 10 minutes

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 JavaLab Backend running on port ${PORT}`);
    console.log(`📁 Temp directory: ${tempDir}`);
    console.log(`🔧 Ready to compile Java code`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down JavaLab backend...');
    
    // Cleanup temp directory
    try {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
        }
    } catch (error) {
        console.warn('Could not cleanup temp directory:', error.message);
    }
    
    process.exit(0);
});

module.exports = app; 