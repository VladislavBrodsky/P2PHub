import re

with open('frontend/src/pages/Subscription.tsx', 'r') as f:
    content = f.read()

# PRO Active State Changes
# Glow Effects
content = content.replace("isPlus ? 'bg-indigo-600' : 'bg-orange-600'", "isPlus ? 'bg-yellow-500' : 'bg-blue-600'")
content = content.replace("isPlus ? 'bg-indigo-500' : 'bg-amber-500'", "isPlus ? 'bg-yellow-400' : 'bg-blue-500'")
content = content.replace("isPlus ? 'text-indigo-300' : 'text-amber-400'", "isPlus ? 'text-yellow-600' : 'text-blue-400'")
content = content.replace("isPlus ? 'from-indigo-400 via-blue-600 to-indigo-900' : 'from-amber-300 via-orange-500 to-amber-800'", "isPlus ? 'from-yellow-300 via-yellow-400 to-orange-500' : 'from-blue-400 via-blue-600 to-blue-900'")
content = content.replace("border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/40 text-indigo-300", "border-yellow-500/50 hover:border-yellow-400 hover:bg-yellow-900/40 text-yellow-400")

# PRO Active Typography & Button
content = content.replace("text-4xl font-black mb-2 tracking-tighter text-white uppercase italic drop-shadow-md", "text-[38px] font-extrabold mb-2 tracking-tighter text-white drop-shadow-md leading-[0.9]")
content = content.replace("isPlus ? 'bg-linear-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 border-indigo-400/30 shadow-indigo-500/20' : 'bg-linear-to-r from-amber-500 hover:from-amber-400 to-orange-600 hover:to-orange-500 border-orange-400/30 shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)]'", "isPlus ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-400/50 shadow-[0_0_25px_rgba(255,215,0,0.4)]' : 'bg-blue-600 hover:bg-blue-500 border-blue-400/30 shadow-[0_0_20px_rgba(0,102,255,0.3)]'")

# Hero Section
content = content.replace("from-indigo-500 via-purple-600 to-indigo-900", "from-blue-500 via-blue-600 to-blue-800")
content = content.replace("bg-indigo-500 blur-2xl", "bg-blue-500 blur-2xl")
content = content.replace("group-hover:text-indigo-500", "group-hover:text-blue-500")
content = content.replace("from-indigo-500 via-purple-500 to-fuchsia-500", "from-blue-400 via-blue-500 to-blue-600")
content = content.replace("text-5xl font-black text-slate-900 dark:text-white tracking-[calc(-0.06em)] uppercase italic vibing-crystal-text leading-none", "text-[38px] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.9]")

# Plan Selector Top
content = content.replace("bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20", "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20")
content = content.replace("text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[0.85]", "text-[32px] font-extrabold text-slate-900 dark:text-white tracking-tighter leading-[0.9]")

# Toggle logic
content = content.replace("'left-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-indigo-600 shadow-indigo-500/20'", "'left-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-blue-600 shadow-blue-500/20'")
content = content.replace("'left-[calc(50%+0.375rem)] w-[calc(50%-0.375rem)] bg-linear-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-purple-500/30'", "'left-[calc(50%+0.375rem)] w-[calc(50%-0.375rem)] bg-linear-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-yellow-500/30'")
content = content.replace("selectedPlan === 'PRO' ? 'text-indigo-600 dark:text-white'", "selectedPlan === 'PRO' ? 'text-blue-600 dark:text-white'")

# Compare Grid
content = content.replace("w-1 h-4 bg-indigo-500 rounded-full", "w-1 h-4 bg-blue-500 rounded-full")
content = content.replace("selectedPlan === 'PRO_PLUS' ? 'text-indigo-500' : 'text-slate-900 dark:text-white'", "selectedPlan === 'PRO_PLUS' ? 'text-yellow-600' : 'text-slate-900 dark:text-white'")
content = content.replace("selectedPlan === 'PRO_PLUS' ? 'text-indigo-500/60' : 'text-slate-400 dark:text-white/20'", "selectedPlan === 'PRO_PLUS' ? 'text-yellow-600/60' : 'text-slate-400 dark:text-white/20'")
content = content.replace("bg-indigo-500/5", "bg-yellow-500/5")
content = content.replace("border-indigo-500/30", "border-yellow-500/30")

# Primary CTA
content = content.replace("'bg-linear-to-r from-indigo-500 via-blue-600 to-purple-600 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)]'", "'bg-blue-600 border border-blue-400/30 shadow-[0_0_20px_rgba(0,102,255,0.3)]'")
content = content.replace("'bg-linear-to-r from-purple-500 via-fuchsia-500 to-indigo-500 shadow-[0_20px_40px_-10px_rgba(168,85,247,0.4)]'", "'bg-yellow-400 text-black border border-yellow-400/50 shadow-[0_0_25px_rgba(255,215,0,0.4)]'")
content = content.replace("text-indigo-500 group-hover:scale-110", "text-blue-500 group-hover:scale-110")
content = content.replace("hover:border-indigo-500/50 hover:bg-indigo-500/5", "hover:border-blue-500/50 hover:bg-blue-500/5")

# Benefits Headline
content = content.replace("'bg-linear-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-900/20 dark:to-purple-900/10 border-indigo-500/20 dark:border-indigo-500/20'", "'bg-blue-500/5 dark:bg-blue-900/10 border-blue-500/20 dark:border-blue-500/20'")
content = content.replace("'bg-linear-to-br from-purple-500/5 to-fuchsia-500/5 dark:from-purple-900/20 dark:to-fuchsia-900/10 border-purple-500/20 dark:border-purple-500/20'", "'bg-yellow-500/5 dark:bg-yellow-900/10 border-yellow-500/20 dark:border-yellow-500/20'")
content = content.replace("bg-indigo-500", "bg-blue-500") # Covers the blur
content = content.replace("text-indigo-600 dark:text-indigo-400", "text-blue-600 dark:text-blue-400")
content = content.replace("text-purple-600 dark:text-purple-400", "text-yellow-600 dark:text-yellow-500")
content = content.replace("isExpanded ? 'rotate-180 text-indigo-500'", "isExpanded ? 'rotate-180 text-blue-500'")
content = content.replace("selectedPlan === 'PRO' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'", "selectedPlan === 'PRO' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-500'")

# Payment Section
content = content.replace("bg-indigo-500/20 blur-[100px]", "${selectedPlan === 'PRO' ? 'bg-blue-500/20' : 'bg-yellow-500/20'} blur-[100px]")
content = content.replace("from-indigo-500/5 via-transparent to-fuchsia-500/5", "from-blue-500/5 via-transparent to-yellow-500/5")
content = content.replace("bg-indigo-500/10 border border-indigo-500/20", "${selectedPlan === 'PRO' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600'}")
content = content.replace("rgba(99,102,241,0.3)", "rgba(0,102,255,0.3)")
content = content.replace("rgba(99,102,241,0)", "rgba(0,102,255,0)")
content = content.replace("from-indigo-500 to-fuchsia-500", "from-blue-500 to-yellow-500")
# The text-animate-shimmer bit
content = content.replace("dark:from-indigo-400 dark:via-fuchsia-400 dark:to-indigo-400", "dark:from-blue-400 dark:via-yellow-400 dark:to-blue-400")
content = content.replace("bg-indigo-500/10 flex", "bg-blue-500/10 flex")
content = content.replace("group-hover:bg-indigo-500", "group-hover:bg-blue-500")

content = content.replace("bg-linear-to-r from-indigo-600 via-blue-600 to-purple-600", "${selectedPlan === 'PRO' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-yellow-400 hover:bg-yellow-300 text-black'}")
content = content.replace("shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)]", "shadow-[0_0_20px_rgba(0,102,255,0.3)]")

# Fix button class in payment
content = content.replace("text-white rounded-[2rem]", "rounded-[2rem]") # removes forced text-white to allow PRO+ text-black

# Social Proof Stats
content = content.replace("text-indigo-500 dark:text-blue-400", "text-blue-500 dark:text-blue-400")
content = content.replace("bg-indigo-500/10", "bg-blue-500/10")

# FAQ Section
content = content.replace("bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30", "bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30")

# Specific regex for text-indigo-???
content = re.sub(r'text-indigo-(400|500|600)', r'text-blue-\1', content)
content = re.sub(r'border-indigo-(400|500|600)', r'border-blue-\1', content)
content = re.sub(r'bg-indigo-(400|500|600)', r'bg-blue-\1', content)
content = re.sub(r'shadow-indigo-(400|500|600)', r'shadow-blue-\1', content)

with open('frontend/src/pages/Subscription.tsx', 'w') as f:
    f.write(content)
