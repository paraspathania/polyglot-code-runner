const codeTemplates = {
    python: `def compute_magic(depth):
    """A beautiful recursion example"""
    if depth == 0:
        return "✨ Magic Achieved ✨"
    
    prefix = "-" * (5 - depth)
    print(f"{prefix}> Diving deeper: level {depth}")
    return compute_magic(depth - 1)

# Let's run some Python!
print("--- OmniCode Execution Initiated ---")
result = compute_magic(5)
print(f"\\nResult: {result}")
`,
    nodejs: `function computeMagic(depth) {
    // A beautiful recursion example
    if (depth === 0) {
        return "✨ Magic Achieved ✨";
    }
    
    const prefix = "-".repeat(5 - depth);
    console.log(\`\${prefix}> Diving deeper: level \${depth}\`);
    return computeMagic(depth - 1);
}

// Let's run some Node.js!
console.log("--- OmniCode Execution Initiated ---");
const result = computeMagic(5);
console.log(\`\\nResult: \${result}\`);
`,
    c: `#include <stdio.h>

void computeMagic(int depth) {
    if (depth == 0) {
        printf("✨ Magic Achieved ✨\\n");
        return;
    }
    
    for (int i = 0; i < 5 - depth; i++) printf("-");
    printf("> Diving deeper: level %d\\n", depth);
    computeMagic(depth - 1);
}

int main() {
    printf("--- OmniCode Execution Initiated ---\\n");
    computeMagic(5);
    return 0;
}
`,
    cpp: `#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cout << "Enter your name: ";
    std::getline(std::cin, name);
    
    if (name.empty()) {
        std::cout << "\\nHello, OmniCode! (No input provided)\\n";
    } else {
        std::cout << "\\nHello, " << name << "! Welcome to OmniCode.\\n";
    }
    return 0;
}
`,
    java: `import java.util.Scanner;

public class Main {
    public static void computeMagic(int depth) {
        if (depth == 0) {
            System.out.println("✨ Magic Achieved ✨");
            return;
        }
        
        for (int i = 0; i < 5 - depth; i++) System.out.print("-");
        System.out.println("> Diving deeper: level " + depth);
        computeMagic(depth - 1);
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        
        if (scanner.hasNextLine()) {
            String name = scanner.nextLine();
            if (name.trim().isEmpty()) {
                System.out.println("\\nHello, OmniCode! (No input provided)");
            } else {
                System.out.println("\\nHello, " + name + "! Welcome to OmniCode.");
            }
        }
        
        System.out.println("\\n--- OmniCode Execution Initiated ---");
        computeMagic(5);
        scanner.close();
    }
}
`
};

// Utility to get current system time
function getSysTime() {
    const now = new Date();
    return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
}

// Initialize CodeMirror
const editorArea = document.getElementById('code-editor');
const editor = CodeMirror.fromTextArea(editorArea, {
    mode: 'python',
    theme: 'material-ocean',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    lineWrapping: true
});

// Set initial content
editor.setValue(codeTemplates.python);

const langSelector = document.getElementById('language-selector');
const runBtn = document.getElementById('run-btn');
const terminal = document.getElementById('terminal');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');

langSelector.addEventListener('change', (e) => {
    const lang = e.target.value;
    let mode = 'javascript';
    if (lang === 'python') mode = 'python';
    if (lang === 'c' || lang === 'cpp') mode = 'text/x-c++src';
    if (lang === 'java') mode = 'text/x-java';
    
    editor.setOption('mode', mode);
    editor.setValue(codeTemplates[lang]);
});

// Set initial system time for welcome messages
document.querySelectorAll('.sys-time').forEach(el => el.textContent = getSysTime());

runBtn.addEventListener('click', async () => {
    const code = editor.getValue();
    const language = langSelector.value;
    const input = document.getElementById('stdin-input').value;
    
    if (!code.trim()) return;

    // Update UI for loading state
    runBtn.disabled = true;
    runBtn.innerHTML = '<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> <span>Executing...</span>';
    
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } } .spinner { animation: spin 1s linear infinite; }';
        document.head.appendChild(style);
    }

    terminal.innerHTML = `<div class="welcome-msg"><span class="sys-time">${getSysTime()}</span> Container provisioning...</div>`;
    setStatus('running', 'Running');
    
    const startTime = performance.now();

    try {
        const response = await fetch('/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language, code, input })
        });

        const result = await response.json();
        const executionTime = (performance.now() - startTime).toFixed(0);

        if (!response.ok) {
            setStatus('error', 'Failed');
            renderOutput(result.stdout, result.stderr, result.error || 'Execution failed', executionTime, result.source);
        } else {
            setStatus('success', 'Success');
            renderOutput(result.stdout, result.stderr, null, executionTime, result.source);
        }

    } catch (err) {
        setStatus('error', 'Error');
        renderOutput('', '', 'Network error: Could not reach the API. Is it running?', '-', 'none');
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = '<svg class="run-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> <span>Execute</span>';
    }
});

function setStatus(state, text) {
    statusBadge.className = `status-badge ${state}`;
    statusText.textContent = text;
}

function renderOutput(stdout, stderr, error, timeMs, source) {
    let html = '';
    
    if (stdout) {
        html += `<div class="out-stream"><pre>${escapeHtml(stdout)}</pre></div>`;
    }
    
    if (stderr) {
        html += `<div class="err-stream"><pre>${escapeHtml(stderr)}</pre></div>`;
    }
    
    if (error) {
        html += `<div class="sys-err"><strong>System Error</strong><br><pre>${escapeHtml(error)}</pre></div>`;
    }
    
    if (!stdout && !stderr && !error) {
        html += `<div class="welcome-msg"><span class="sys-time">${getSysTime()}</span> Process exited with code 0 (No output)</div>`;
    }
    
    const sourceIcon = source === 'cache' 
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 13 9 20 9"></polyline><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';

    // Add meta info
    html += `
        <div class="meta-info">
            <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${timeMs}ms</span>
            <span>${sourceIcon} ${source.toUpperCase()}</span>
        </div>`;
    
    terminal.innerHTML = html;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Mouse tracking glow effect
document.querySelectorAll('.pane').forEach(pane => {
    pane.addEventListener('mousemove', e => {
        const rect = pane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        pane.style.setProperty('--mouse-x', `${x}px`);
        pane.style.setProperty('--mouse-y', `${y}px`);
    });
});
