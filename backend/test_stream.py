#!/usr/bin/env python3
"""
Test script for streaming endpoint
"""
import asyncio
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

import httpx


async def test_streaming():
    """Test the streaming endpoint"""
    url = "http://localhost:8000/api/chat/stream"
    
    payload = {
        "message": "Hello, say hi back in 5 words",
        "session_id": "test",
        "mode": "agent"
    }
    
    print("🧪 Testing streaming endpoint...")
    print(f"📍 URL: {url}")
    print(f"📤 Payload: {json.dumps(payload, indent=2)}")
    print("\n" + "="*60)
    print("📥 Stream Response:")
    print("="*60 + "\n")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    print(f"❌ Error: HTTP {response.status_code}")
                    print(f"Response: {await response.aread()}")
                    return False
                
                chunk_count = 0
                has_content = False
                has_error = False
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    if line.startswith("data: "):
                        data_str = line[6:]  # Remove "data: " prefix
                        try:
                            data = json.loads(data_str)
                            chunk_count += 1
                            
                            # Check for connection message
                            if data.get("status") == "connected":
                                print("✅ Connection message received")
                                print(f"   Data: {data_str}\n")
                                continue
                            
                            # Check for errors
                            if "error" in data:
                                has_error = True
                                print(f"❌ Error received:")
                                print(f"   {data.get('error', 'Unknown error')}")
                                if "traceback" in data:
                                    print(f"   Traceback: {data['traceback'][:200]}...")
                                return False
                            
                            # Check for content chunks
                            if "chunk" in data and data.get("chunk"):
                                has_content = True
                                # Print chunk (without newline for streaming effect)
                                print(data["chunk"], end="", flush=True)
                            
                            # Check for completion
                            if data.get("done"):
                                print("\n")
                                if "tools_used" in data:
                                    print(f"✅ Tools used: {data['tools_used']}")
                                print(f"✅ Stream completed successfully")
                                print(f"📊 Total chunks received: {chunk_count}")
                                return True
                                
                        except json.JSONDecodeError as e:
                            print(f"⚠️  Failed to parse JSON: {data_str[:100]}")
                            print(f"   Error: {e}")
                    else:
                        # Handle non-data lines (comments, etc.)
                        if line.startswith(":"):
                            continue
                        print(f"⚠️  Unexpected line format: {line[:100]}")
                
                # If we get here, stream ended without done message
                if not has_content and not has_error:
                    print("\n⚠️  Stream ended without content or error")
                    print("   This might indicate the LLM is not configured")
                    return False
                
                return has_content
                
    except httpx.TimeoutException:
        print("❌ Request timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Starting streaming endpoint test...\n")
    result = asyncio.run(test_streaming())
    
    print("\n" + "="*60)
    if result:
        print("✅ TEST PASSED: Streaming endpoint is working correctly!")
    else:
        print("❌ TEST FAILED: Streaming endpoint has issues")
    print("="*60)
    
    sys.exit(0 if result else 1)

