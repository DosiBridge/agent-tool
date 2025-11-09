#!/bin/bash
# Comprehensive streaming endpoint test

API_URL="${1:-https://agentapi.dosibridge.com}"
TIMEOUT=30

echo "🧪 Testing Streaming Endpoint"
echo "================================"
echo "📍 URL: $API_URL/api/chat/stream"
echo "⏱️  Timeout: ${TIMEOUT}s"
echo ""

PAYLOAD='{
  "message": "Say hello in exactly 3 words",
  "session_id": "test-'$(date +%s)'",
  "mode": "agent"
}'

echo "📤 Request:"
echo "$PAYLOAD" | jq .
echo ""
echo "📥 Response Stream:"
echo "--------------------------------"

# Track what we receive
CONNECTED=false
HAS_CONTENT=false
HAS_ERROR=false
CHUNK_COUNT=0

timeout $TIMEOUT curl -N -s -X POST "$API_URL/api/chat/stream" \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d "$PAYLOAD" 2>&1 | while IFS= read -r line || [ -n "$line" ]; do
    if [[ -n "$line" ]]; then
      echo "$line"
      
      # Check for connection
      if echo "$line" | grep -q '"status":"connected"'; then
        CONNECTED=true
        echo "  ✅ Connection established"
      fi
      
      # Check for status messages
      if echo "$line" | grep -q '"status":"initializing_agent"'; then
        echo "  🔄 Initializing agent..."
      fi
      
      if echo "$line" | grep -q '"status":"connecting_mcp_servers"'; then
        SERVER_COUNT=$(echo "$line" | sed 's/data: //' | jq -r '.server_count' 2>/dev/null || echo "?")
        echo "  🔄 Connecting to $SERVER_COUNT MCP servers..."
      fi
      
      # Check for errors
      if echo "$line" | grep -q '"error"'; then
        HAS_ERROR=true
        ERROR_MSG=$(echo "$line" | sed 's/data: //' | jq -r '.error' 2>/dev/null || echo "$line")
        echo ""
        echo "  ❌ ERROR: $ERROR_MSG"
        break
      fi
      
      # Check for content chunks
      if echo "$line" | grep -q '"chunk"' && ! echo "$line" | grep -q '"chunk":""'; then
        CHUNK=$(echo "$line" | sed 's/data: //' | jq -r '.chunk' 2>/dev/null)
        if [[ -n "$CHUNK" ]]; then
          HAS_CONTENT=true
          CHUNK_COUNT=$((CHUNK_COUNT + 1))
          printf "%s" "$CHUNK"
        fi
      fi
      
      # Check for completion
      if echo "$line" | grep -q '"done":true'; then
        echo ""
        echo ""
        if echo "$line" | grep -q 'tools_used'; then
          TOOLS=$(echo "$line" | sed 's/data: //' | jq -r '.tools_used[]' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
          if [[ -n "$TOOLS" ]]; then
            echo "  ✅ Stream completed - Tools used: $TOOLS"
          else
            echo "  ✅ Stream completed successfully"
          fi
        else
          echo "  ✅ Stream completed"
        fi
        break
      fi
    fi
  done

echo ""
echo "================================"
echo "📊 Test Summary:"
echo "  Connection: $([ "$CONNECTED" = true ] && echo "✅" || echo "❌")"
echo "  Content: $([ "$HAS_CONTENT" = true ] && echo "✅ ($CHUNK_COUNT chunks)" || echo "❌")"
echo "  Errors: $([ "$HAS_ERROR" = true ] && echo "❌" || echo "✅")"
echo "================================"

