import re

file_path = '/Users/grandmaestro/Documents/P2PHub/frontend/src/components/Marketing/IncomePotential.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update the generic visibility trigger
content = content.replace(
    """    // Trigger math section once target is hit AND plan is unlocked
    useEffect(() => {
        if (isStrategyUnlocked && estimatedMonthlyRaw >= 43200 && !showMathSection) {
            setShowMathSection(true);
        }
    }, [isStrategyUnlocked, estimatedMonthlyRaw, showMathSection]);""",
    """    // Trigger math section once plan is unlocked
    useEffect(() => {
        if (isStrategyUnlocked && !showMathSection) {
            setShowMathSection(true);
        }
    }, [isStrategyUnlocked, showMathSection]);"""
)

# 2. Extract the math breakdown block
# We know it starts with '                {/* ──────────────── $1/MIN MATH BREAKDOWN ──────────────── */}'
# And ends with '                </AnimatePresence>' just before '{/* Dual Mode Calculator / Unlocked Network Status */}'

start_marker = "                {/* ──────────────── $1/MIN MATH BREAKDOWN ──────────────── */}\n                <AnimatePresence>"
end_marker = "                </AnimatePresence>\n\n                {/* Dual Mode Calculator / Unlocked Network Status */}"

if start_marker in content and end_marker in content:
    start_idx = content.index(start_marker)
    # the end marker ends right before the dual mode calculator comment
    end_idx = content.index(end_marker) + len("                </AnimatePresence>\n")
    
    math_block = content[start_idx:end_idx]
    
    # Remove from top
    content = content[:start_idx] + content[end_idx:]
    
    # Insert before the stats grid
    # "                    )}\n                </div>\n\n                <div className=\"grid grid-cols-2 gap-3 relative z-10\">"
    insert_marker = "                    )}\n                </div>\n\n                <div className=\"grid grid-cols-2 gap-3 relative z-10\">"
    
    if insert_marker in content:
        insert_idx = content.index(insert_marker) + len("                    )}\n                </div>\n\n")
        content = content[:insert_idx] + math_block + "\n" + content[insert_idx:]
        print("Successfully extracted and moved the math block.")
        
        with open(file_path, 'w') as f:
            f.write(content)
    else:
        print("Could not find insert marker.")
else:
    print("Could not find start/end markers for extraction.")

