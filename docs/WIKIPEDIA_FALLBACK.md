# Wikipedia API Fallback System

This document explains how the Wikipedia API fallback system works and how to use it in your application.

## Overview

The Wikipedia API fallback system provides resilient data retrieval when the primary AI servers are unavailable. It automatically falls back to Wikipedia search and content extraction while maintaining the same API interface.

## Components

### 1. Client-Side Utilities (`src/lib/wikipedia-fallback.ts`)

Main utility functions for client-side operations:

- **`searchWikipedia(query, limit)`** - Search Wikipedia for topics
- **`fetchWikipediaExtract(pageTitle)`** - Get full article extract
- **`fetchStudyContentWithFallback(query, primaryFetch)`** - Wrapper that tries primary API first, then Wikipedia
- **`getWikipediaStudyReferences(topic)`** - Get multiple Wikipedia references for a topic
- **`checkApiAvailability(apiUrl)`** - Health check for primary API

### 2. Study API with Fallback (`src/lib/study-api.ts`)

Updated study API that includes fallback support:

- **`callStudyAI()`** - Original function (unchanged)
- **`callStudyAIWithFallback()`** - New function with Wikipedia fallback

### 3. Custom Hook (`src/hooks/useStudyAIWithFallback.ts`)

React hook for managing Study AI with fallback:

```typescript
const { loading, data, error, source, fallbackUsed, call } = useStudyAIWithFallback();

await call(
  "generate-flashcards",
  content,
  topic,
  difficulty,
  gradeLevel,
  model,
  expertise
);
```

### 4. Server-Side Handler (`supabase/functions/wikipedia-fallback/handler.ts`)

Server-side utilities for edge functions:

- **`searchWikipediaServer(query)`** - Server-side Wikipedia search
- **`fetchWikipediaExtractServer(pageTitle)`** - Server-side extract fetching
- **`tryWikipediaFallback(topic)`** - Automatic fallback with retry logic
- **`formatWikipediaForAction(action, content)`** - Format content based on action type

## Usage Examples

### Basic Fallback Usage (Client-Side)

```typescript
import { callStudyAIWithFallback } from "@/lib/study-api";

try {
  const { result, source, fallback } = await callStudyAIWithFallback(
    "generate-flashcards",
    undefined,
    "photosynthesis",
    "medium",
    "9"
  );
  
  console.log(`Got result from ${source} (fallback: ${fallback})`);
  console.log(result);
} catch (error) {
  console.error("Failed to get content", error);
}
```

### Using the React Hook

```typescript
import { useStudyAIWithFallback } from "@/hooks/useStudyAIWithFallback";

function MyComponent() {
  const { loading, data, error, source, fallbackUsed, call } = useStudyAIWithFallback();

  const handleGenerate = async () => {
    try {
      await call("explain-concept", undefined, "quantum mechanics");
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {fallbackUsed && <p>Using Wikipedia as fallback (main server down)</p>}
      {data && <p>{data}</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleGenerate}>Generate</button>
    </div>
  );
}
```

### Direct Wikipedia Search

```typescript
import { searchWikipedia, getWikipediaStudyReferences } from "@/lib/wikipedia-fallback";

// Simple search
const results = await searchWikipedia("quantum physics", 3);
results.forEach(r => {
  console.log(`${r.title}: ${r.extract}`);
  console.log(`URL: ${r.url}`);
});

// Get study references
const references = await getWikipediaStudyReferences("evolution");
```

### Server-Side Fallback (in Supabase Functions)

```typescript
import { tryWikipediaFallback, formatWikipediaForAction } from "../wikipedia-fallback/handler.ts";

// In your Supabase function:
try {
  // Try primary API
  const result = await primaryAIService.call(action, content);
  return { success: true, result, source: "primary" };
} catch (error) {
  console.log("Primary API failed, trying Wikipedia");
  
  const fallback = await tryWikipediaFallback(topic, { retries: 2 });
  
  if (fallback.success) {
    const formatted = formatWikipediaForAction(action, fallback.content, fallback.source);
    return { success: true, result: formatted, source: "wikipedia" };
  }
  
  throw new Error("All sources failed");
}
```

## Benefits

1. **Resilience** - Application continues working when main servers are down
2. **Automatic Fallback** - No manual intervention needed
3. **Transparent to Users** - Same API interface, with optional fallback notification
4. **Rate-Limited Friendly** - Wikipedia API has generous rate limits
5. **No Additional Costs** - Wikipedia is free with no API keys required
6. **Educational Content** - Wikipedia articles are reliable for educational purposes

## API Response Format

All fallback functions return consistent response formats:

### Client-Side Response
```typescript
{
  success: boolean;
  source: "primary" | "wikipedia" | "error";
  data: string;
  error?: string;
}
```

### Hook State
```typescript
{
  loading: boolean;
  data: string | null;
  error: string | null;
  source: "primary" | "wikipedia" | "error" | null;
  fallbackUsed: boolean;
}
```

## Configuration

### Timeout Settings
```typescript
import { checkApiAvailability } from "@/lib/wikipedia-fallback";

// Check if primary API is available
const isAvailable = await checkApiAvailability(
  "https://ai.gateway.lovable.dev/v1/health",
  5000 // 5 second timeout
);
```

### Server-Side Options
```typescript
import { tryWikipediaFallback } from "../wikipedia-fallback/handler.ts";

await tryWikipediaFallback("topic", {
  timeout: 3000,    // Max 3 seconds per request
  retries: 2        // Retry up to 2 times
});
```

## Action Type Support

The system currently handles these action types with Wikipedia fallback:

- `explain-concept` - Full Wikipedia article
- `summarize` - First 300 characters
- `generate-flashcards` - Formatted as JSON flashcard
- `mind-map` - Hierarchical format
- Other actions - Full article with metadata

## Limitations

1. Wikipedia content may not match exact learning objectives
2. Quality varies by topic (well-documented topics work best)
3. Wikipedia doesn't provide interactive learning features
4. No personalization or difficulty adaptation from Wikipedia

## Error Handling

The system handles errors gracefully:

```typescript
// All functions include try-catch internally
// Errors are logged and don't crash the application
// User-facing errors are notified via toast messages

// Always wrapped in try-catch on the calling side
try {
  const result = await callStudyAIWithFallback(...);
} catch (error) {
  // Handle error appropriately
}
```

## Testing

To test the fallback system:

```typescript
// Test with primary API unavailable
import { callStudyAIWithFallback } from "@/lib/study-api";

// Simulate primary API failure by mocking supabase.functions.invoke
const testResult = await callStudyAIWithFallback(
  "explain-concept",
  undefined,
  "relativity",
  "hard"
);

console.log(`Source: ${testResult.source}`); // Should be "wikipedia"
console.log(`Fallback Used: ${testResult.fallback}`); // Should be true
```

## Future Enhancements

Potential improvements to the fallback system:

1. **Multiple Fallback Sources** - Add support for other encyclopedias or APIs
2. **Response Caching** - Cache Wikipedia results for faster subsequent requests
3. **Quality Scoring** - Score Wikipedia articles and select best matches
4. **Content Formatting** - Better formatting for different action types
5. **Offline Support** - Download and cache Wikipedia data locally
6. **Search Optimization** - Improved query parsing and search algorithms

## Support

For issues or questions about the Wikipedia fallback system:

1. Check the function documentation in the code
2. Review error messages in the application logs
3. Test with known topics (e.g., "photosynthesis", "gravity")
4. Check Wikipedia API status at https://en.wikipedia.org/wiki/Wikipedia:Status
