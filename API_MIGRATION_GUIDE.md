# API Migration Guide

## From Lovable AI Gateway to Multiple APIs

This project has been migrated from using a single Lovable AI Gateway to using multiple APIs:

### ✅ New API Integrations

1. **Google Gemini API** (Primary)
   - Models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite
   - Get API key: https://makersuite.google.com/app/apikey

2. **Hugging Face API** (Fallback/Alternative)
   - Models: Mistral-7B, Llama-3.2-3B, Gemma-2-2B
   - Get API key: https://huggingface.co/settings/tokens

3. **Wikipedia API** (Enhanced)
   - Free content fallback
   - Improved error handling
   - Better content formatting

### 🔧 Configuration Steps

1. **Get API Keys**:
   ```bash
   # Gemini API Key
   # Visit: https://makersuite.google.com/app/apikey
   
   # Hugging Face API Key  
   # Visit: https://huggingface.co/settings/tokens
   ```

2. **Add to Supabase Edge Functions**:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add: `GEMINI_API_KEY=your_key_here`
   - Add: `HUGGINGFACE_API_KEY=your_key_here`

3. **Deploy Functions**:
   ```bash
   supabase functions deploy study-ai
   supabase functions deploy wikipedia-fallback
   ```

### 🎯 Benefits

- **Cost Control**: Choose between free (Wikipedia) and paid APIs
- **Redundancy**: Multiple API providers ensure reliability
- **Model Choice**: Access to different AI models for different use cases
- **No Vendor Lock**: Not dependent on a single provider

### 📊 Model Selection

- **gemini-flash-lite**: Fast, lightweight responses
- **gemini-2.5-flash**: Balanced speed and quality
- **gemini-2.5-pro**: Highest quality responses
- **huggingface-mistral**: Open-source alternative
- **huggingface-llama**: Meta's Llama model
- **huggingface-gemma**: Google's open model

### 🔄 Fallback Logic

1. Try selected API (Gemini or Hugging Face)
2. If API fails, try Wikipedia fallback
3. If all fail, return appropriate error

### 🚀 Features Maintained

- All 19 study actions work identically
- Grade-level appropriate content
- Expertise-specific prompts
- Error handling and rate limiting
- Wikipedia content integration
