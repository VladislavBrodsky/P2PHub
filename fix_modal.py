import re

file_path = '/Users/grandmaestro/Developer/P2PHub/frontend/src/pages/Pro/components/ProDashboardModals.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace button typography
content = content.replace(
    'className={`flex-1 py-2 rounded-xl text-label font-black uppercase tracking-widest',
    'className={`flex-1 py-2 rounded-xl text-label font-bold uppercase tracking-wider'
)
content = content.replace(
    'className={`shrink-0 py-2 px-3 rounded-2xl text-label font-black uppercase tracking-widest',
    'className={`shrink-0 py-2.5 px-3.5 rounded-xl text-label font-bold uppercase tracking-wider'
)

# Now manually replace each platform's motion.div and its closing tag.
# We will use Regex for this, but VERY carefully.

pattern = r'(<motion\.div key="([^"]+)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className=")space-y-3(">\s*<div className="flex items-center gap-3 p-4 )(bg-[a-zA-Z]+-\d+/5|bg-\[\#[A-Za-z0-9]+\]/5|bg-black) rounded-2xl border (border-[a-zA-Z]+-\d+/15|border-\[\#[A-Za-z0-9]+\]/15)(">\s*(?:<div className="w-10 h-10[^>]+>.*?</div>\s*<div className="flex-1 min-w-0">.*?</div>\s*<button[^>]+>.*?</button>\s*</div>)\s*)<div className="space-y-(?:1\.5|2)">'

def repl(m):
    start_tag = m.group(1) # <motion.div ... className="
    key = m.group(2) # pro-tg, etc
    after_spacey3 = m.group(3) # ">\n  <div className="flex items-center gap-3 p-4 
    bg_color = m.group(4) # bg-emerald-500/5
    border_color = m.group(5) # border-emerald-500/15
    end_of_header_and_inputs = m.group(6) # ">\n <div w-10...> ... </div>\n</div>\n <div className="space-y-2">

    # Replace className on motion wrapper
    new_motion = f'{start_tag}rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-black/20 overflow-hidden flex flex-col shadow-xs"'
    
    # Replace header classes (remove rounded-2xl, replace border class with border-b)
    # The start of the header div ends with `bg-emerald-500/5 ` then we need to add `border-b` and the `border_color`
    # Our match after_spacey3 ends with `p-4 `
    new_header = f'>\n                                                        <div className="flex items-center gap-3 p-4 sm:p-5 {bg_color} border-b {border_color}'
    
    # The inside of the header and the beginning of the inputs wrapper
    # we need to inject `<div className="p-4 sm:p-5 space-y-4">` right before the inputs div.
    # The end_of_header_and_inputs ends right before `<div className="space-y-2">`
    # Wait, the regex captures the whole header inner content, up to the end of the header div, 
    # and then matches `<div className="space-y-2">` which we ate.
    # Actually, we ate `<div className="space-y-X">`. We need to put it back inside the new wrapper.
    
    # Let's refine the regex replacement. We captured the inner HTML of the header inside `end_of_header_and_inputs`.
    # Wait, the regex `end_of_header_and_inputs` includes `">\n ... \n</div>\n` which is the closing of the header div.
    
    # Let's just do it cleanly by finding `<motion.div key="KEY" ...` manually for each key.
    return m.group(0)

print("regex ready to test, but I will use a custom block replacer script instead to avoid regex errors.")
