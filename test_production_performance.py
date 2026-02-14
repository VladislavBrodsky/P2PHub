#!/usr/bin/env python3
"""
Production Performance Test for Viral Marketing Studio
Tests the live Railway API endpoint to measure real-world performance
"""

import requests
import time
import json

# Production API endpoint
BASE_URL = "https://p2phub-production.up.railway.app"
ENDPOINT = f"{BASE_URL}/api/pro/viral/generate"

# Test scenarios
scenarios = [
    {
        "post_type": "Lifestyle Flex",
        "target_audience": "Digital Nomads",
        "language": "English"
    },
    {
        "post_type": "FOMO Builder", 
        "target_audience": "Cryptocurrency Traders",
        "language": "English"
    },
    {
        "post_type": "Passive Income Proof",
        "target_audience": "Network Builders",
        "language": "English"
    }
]

print("=" * 80)
print("🚀 PRODUCTION VIRAL STUDIO PERFORMANCE TEST")
print("=" * 80)
print(f"📡 API Endpoint: {ENDPOINT}")
print(f"🔍 Testing {len(scenarios)} scenarios")
print("=" * 80)

results = []

for idx, scenario in enumerate(scenarios, 1):
    print(f"\n{'=' * 80}")
    print(f"Test {idx}/{len(scenarios)}: {scenario['post_type']} → {scenario['target_audience']}")
    print(f"{'=' * 80}")
    
    # Prepare request
    payload = {
        "telegram_id": "test_user_123",  # Test user
        **scenario
    }
    
    # Measure timing
    start_time = time.time()
    
    try:
        response = requests.post(
            ENDPOINT,
            json=payload,
            timeout=60  # 60 second timeout
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Parse response
        if response.status_code == 200:
            data = response.json()
            
            # Extract metrics
            metrics = {
                'duration': duration,
                'status_code': response.status_code,
                'success': True,
                'has_text': bool(data.get('text')),
                'has_image': bool(data.get('image_url')),
                'title': data.get('title', 'N/A'),
                'text_length': len(data.get('text', '')),
                'hashtags_count': len(data.get('hashtags', [])),
                'image_url': data.get('image_url'),
                'tokens': data.get('tokens_openai', 0),
                'scenario': scenario
            }
            
            results.append(metrics)
            
            # Display results
            print(f"\n⏱️  TIMING:")
            print(f"   Total Duration: {duration:.2f}s")
            print(f"   Status Code: {response.status_code}")
            
            print(f"\n📊 CONTENT:")
            print(f"   Title: {metrics['title'][:70]}...")
            print(f"   Text Length: {metrics['text_length']:,} characters")
            print(f"   Hashtags: {metrics['hashtags_count']} tags")
            
            print(f"\n🖼️  IMAGE:")
            if metrics['has_image']:
                print(f"   ✅ Generated: YES")
                print(f"   URL: {metrics['image_url']}")
                # Test image accessibility
                try:
                    img_response = requests.head(BASE_URL + metrics['image_url'], timeout=5)
                    if img_response.status_code == 200:
                        print(f"   ✅ Image Accessible: YES")
                    else:
                        print(f"   ⚠️  Image Accessible: NO (status {img_response.status_code})")
                except Exception as e:
                    print(f"   ⚠️  Image Check Failed: {e}")
            else:
                print(f"   ❌ Generated: NO")
            
            print(f"\n💰 RESOURCES:")
            print(f"   OpenAI Tokens: {metrics['tokens']:,}")
            
        else:
            print(f"\n❌ API ERROR:")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
            results.append({
                'duration': duration,
                'status_code': response.status_code,
                'success': False,
                'scenario': scenario
            })
    
    except requests.Timeout:
        print(f"\n❌ REQUEST TIMEOUT (>60s)")
        results.append({
            'duration': 60.0,
            'status_code': 0,
            'success': False,
            'error': 'timeout',
            'scenario': scenario
        })
    
    except Exception as e:
        print(f"\n❌ REQUEST ERROR: {e}")
        results.append({
            'duration': 0,
            'status_code': 0,
            'success': False,
            'error': str(e),
            'scenario': scenario
        })
    
    # Small delay between tests
    if idx < len(scenarios):
        print(f"\n⏳ Waiting 3s before next test...")
        time.sleep(3)

# Overall statistics
print(f"\n{'=' * 80}")
print("📈 PRODUCTION PERFORMANCE SUMMARY")
print(f"{'=' * 80}")

successful = [r for r in results if r.get('success')]
failed = [r for r in results if not r.get('success')]

if successful:
    avg_duration = sum(r['duration'] for r in successful) / len(successful)
    min_duration = min(r['duration'] for r in successful)
    max_duration = max(r['duration'] for r in successful)
    image_success_rate = sum(1 for r in successful if r.get('has_image')) / len(successful) * 100
    avg_tokens = sum(r.get('tokens', 0) for r in successful) / len(successful)
    
    print(f"\n⏱️  TIMING ANALYSIS:")
    print(f"   Average Duration: {avg_duration:.2f}s")
    print(f"   Fastest: {min_duration:.2f}s")
    print(f"   Slowest: {max_duration:.2f}s")
    
    print(f"\n✅ SUCCESS METRICS:")
    print(f"   Total Tests: {len(results)}")
    print(f"   Successful: {len(successful)}")
    print(f"   Failed: {len(failed)}")
    print(f"   Success Rate: {len(successful)/len(results)*100:.0f}%")
    print(f"   Image Generation Rate: {image_success_rate:.0f}%")
    
    print(f"\n💰 RESOURCE USAGE:")
    print(f"   Avg Tokens per Request: {avg_tokens:.0f}")
    print(f"   Est. Cost per Request: ${(avg_tokens / 1000 * 0.015):.4f}")
    
    print(f"\n{'=' * 80}")
    print("✅ PRODUCTION TEST COMPLETE")
    print(f"{'=' * 80}")
    
    # Summary verdict
    if avg_duration < 10:
        print(f"\n🚀 PERFORMANCE: EXCELLENT (<10s average)")
    elif avg_duration < 15:
        print(f"\n✅ PERFORMANCE: GOOD (10-15s average)")
    elif avg_duration < 20:
        print(f"\n⚠️  PERFORMANCE: ACCEPTABLE (15-20s average)")
    else:
        print(f"\n❌ PERFORMANCE: NEEDS OPTIMIZATION (>20s average)")
        
else:
    print(f"\n❌ ALL TESTS FAILED")
    print(f"   Total Tests: {len(results)}")
    print(f"   Failed: {len(failed)}")
    
    for idx, fail in enumerate(failed, 1):
        print(f"\n   Test {idx} Error:")
        print(f"      Scenario: {fail.get('scenario', {}).get('post_type')}")
        print(f"      Error: {fail.get('error', 'Unknown')}")
