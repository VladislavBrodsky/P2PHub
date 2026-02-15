import asyncio
import os
import sys
import time

backend_dir = os.path.dirname(os.path.abspath(__file__))

# Manual .env parsing (dotenv library has issues with complex values)
env_path = os.path.join(backend_dir, ".env")
with open(env_path) as f:
    for line in f:
        if line.startswith('OPENAI_API_KEY='):
            os.environ['OPENAI_API_KEY'] = line.split('=', 1)[1].strip()
        elif line.startswith('GOOGLE_API_KEY='):
            os.environ['GOOGLE_API_KEY'] = line.split('=', 1)[1].strip()
        elif line.startswith('DATABASE_URL=') and 'DATABASE_URL' not in os.environ:
            os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip()

print(f"✓ Loaded OPENAI_API_KEY: {len(os.environ.get('OPENAI_API_KEY', ''))} chars")
print(f"✓ Loaded GOOGLE_API_KEY: {len(os.environ.get('GOOGLE_API_KEY', ''))} chars")

sys.path.append(backend_dir)

from app.models.partner import Partner
from app.services.viral_service import viral_studio


async def main():
    print("=" * 70)
    print("🚀 VIRAL STUDIO PERFORMANCE TEST")
    print("=" * 70)
    
    partner = Partner(
        id=999,
        telegram_id="test_perf",
        username="performance_test",
        referral_code="perf_test",
        is_pro=True
    )

    # Test 3 different scenarios
    scenarios = [
        ("Lifestyle Flex", "Digital Nomads"),
        ("FOMO Builder", "Crypto Traders"),
        ("Passive Income Proof", "Network Builders")
    ]
    
    total_runs = len(scenarios)
    results = []
    
    for idx, (post_type, audience) in enumerate(scenarios, 1):
        print(f"\n{'='*70}")
        print(f"Test {idx}/{total_runs}: {post_type} → {audience}")
        print(f"{'='*70}")
        
        start_time = time.time()
        
        result = await viral_studio.generate_viral_content(
            partner=partner,
            post_type=post_type,
            target_audience=audience,
            language="English"
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if "error" in result:
            print(f"❌ ERROR: {result['error']}")
            continue
        
        # Extract metrics
        text_length = len(result.get('text', ''))
        title_length = len(result.get('title', ''))
        has_image = bool(result.get('image_url'))
        tokens = result.get('tokens_openai', 0)
        
        metrics = {
            'duration': duration,
            'text_length': text_length,
            'title_length': title_length,
            'has_image': has_image,
            'tokens': tokens,
            'post_type': post_type,
            'audience': audience
        }
        results.append(metrics)
        
        # Display results
        print("\n⏱️  TIMING:")
        print(f"   Total Duration: {duration:.2f}s")
        
        print("\n📊 CONTENT:")
        print(f"   Title: {result.get('title', 'N/A')[:60]}...")
        print(f"   Text Length: {text_length:,} chars")
        print(f"   Hashtags: {len(result.get('hashtags', []))} tags")
        
        print("\n🖼️  IMAGE:")
        print(f"   Generated: {'✅' if has_image else '❌'}")
        print(f"   URL: {result.get('image_url', 'None')}")
        
        print("\n💰 RESOURCES:")
        print(f"   OpenAI Tokens: {tokens:,}")
        
        # Small delay between tests
        if idx < total_runs:
            print("\n⏳ Waiting 2s before next test...")
            await asyncio.sleep(2)
    
    # Overall statistics
    print(f"\n{'='*70}")
    print("📈 OVERALL PERFORMANCE STATISTICS")
    print(f"{'='*70}")
    
    if results:
        avg_duration = sum(r['duration'] for r in results) / len(results)
        min_duration = min(r['duration'] for r in results)
        max_duration = max(r['duration'] for r in results)
        success_rate = sum(1 for r in results if r['has_image']) / len(results) * 100
        avg_tokens = sum(r['tokens'] for r in results) / len(results)
        
        print("\n⏱️  TIMING ANALYSIS:")
        print(f"   Average: {avg_duration:.2f}s")
        print(f"   Fastest: {min_duration:.2f}s")
        print(f"   Slowest: {max_duration:.2f}s")
        
        print("\n✅ SUCCESS METRICS:")
        print(f"   Image Generation Rate: {success_rate:.0f}%")
        print(f"   Successful Runs: {sum(1 for r in results if r['has_image'])}/{len(results)}")
        
        print("\n💰 RESOURCE USAGE:")
        print(f"   Avg Tokens/Generation: {avg_tokens:.0f}")
        print(f"   Est. Cost/Generation: ${(avg_tokens / 1000 * 0.015):.4f}")
        
        print(f"\n{'='*70}")
        print("✅ PERFORMANCE TEST COMPLETE")
        print(f"{'='*70}")
    else:
        print("❌ No successful runs to analyze")

if __name__ == "__main__":
    asyncio.run(main())
