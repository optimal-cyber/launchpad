export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { AIModel, AIModelSource, HuggingFaceModelInfo, LocalModelInfo } from '@/lib/ai-security-types';

// Simulated HuggingFace API response
async function discoverHuggingFaceModels(query?: string, organization?: string): Promise<AIModel[]> {
  // In production, this would call the HuggingFace API
  // const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
  // const response = await fetch(`https://huggingface.co/api/models?search=${query}`, {
  //   headers: { Authorization: `Bearer ${HF_TOKEN}` }
  // });

  const mockModels: AIModel[] = [
    {
      id: `hf-${Date.now()}-1`,
      name: 'Llama-2-7b-chat-hf',
      source: 'huggingface',
      modelType: 'text-generation',
      version: '2.0',
      framework: 'Transformers',
      huggingfaceId: 'meta-llama/Llama-2-7b-chat-hf',
      author: 'Meta',
      downloads: 5000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'Llama 2 Community',
      tags: ['llm', 'chat', 'open-source']
    },
    {
      id: `hf-${Date.now()}-2`,
      name: 'Mistral-7B-Instruct-v0.2',
      source: 'huggingface',
      modelType: 'text-generation',
      version: '0.2',
      framework: 'Transformers',
      huggingfaceId: 'mistralai/Mistral-7B-Instruct-v0.2',
      author: 'Mistral AI',
      downloads: 3000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'Apache 2.0',
      tags: ['llm', 'instruct', 'open-source']
    },
    {
      id: `hf-${Date.now()}-3`,
      name: 'CodeLlama-34b-Instruct-hf',
      source: 'huggingface',
      modelType: 'text-generation',
      version: '1.0',
      framework: 'Transformers',
      huggingfaceId: 'codellama/CodeLlama-34b-Instruct-hf',
      author: 'Meta',
      downloads: 1500000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'Llama 2 Community',
      tags: ['code', 'instruct', 'llm']
    },
    {
      id: `hf-${Date.now()}-4`,
      name: 'Phi-2',
      source: 'huggingface',
      modelType: 'text-generation',
      version: '2.0',
      framework: 'Transformers',
      huggingfaceId: 'microsoft/phi-2',
      author: 'Microsoft',
      downloads: 2000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'MIT',
      tags: ['llm', 'small', 'efficient']
    },
    {
      id: `hf-${Date.now()}-5`,
      name: 'BERT-base-uncased',
      source: 'huggingface',
      modelType: 'text-classification',
      version: '1.0',
      framework: 'Transformers',
      huggingfaceId: 'bert-base-uncased',
      author: 'Google',
      downloads: 50000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'Apache 2.0',
      tags: ['bert', 'nlp', 'classification']
    },
    {
      id: `hf-${Date.now()}-6`,
      name: 'Whisper-large-v3',
      source: 'huggingface',
      modelType: 'audio',
      version: '3.0',
      framework: 'Transformers',
      huggingfaceId: 'openai/whisper-large-v3',
      author: 'OpenAI',
      downloads: 4000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'MIT',
      tags: ['audio', 'speech-to-text', 'transcription']
    },
    {
      id: `hf-${Date.now()}-7`,
      name: 'CLIP-ViT-L-14',
      source: 'huggingface',
      modelType: 'image-text',
      version: '1.0',
      framework: 'Transformers',
      huggingfaceId: 'openai/clip-vit-large-patch14',
      author: 'OpenAI',
      downloads: 8000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'MIT',
      tags: ['multimodal', 'image', 'embedding']
    },
    {
      id: `hf-${Date.now()}-8`,
      name: 'Stable-Diffusion-XL',
      source: 'huggingface',
      modelType: 'image-generation',
      version: '1.0',
      framework: 'Diffusers',
      huggingfaceId: 'stabilityai/stable-diffusion-xl-base-1.0',
      author: 'Stability AI',
      downloads: 6000000,
      overallScore: 0,
      riskLevel: 'unknown',
      license: 'CreativeML Open RAIL++-M',
      tags: ['image-generation', 'diffusion', 'creative']
    }
  ];

  // Filter by query if provided
  if (query) {
    const queryLower = query.toLowerCase();
    return mockModels.filter(m =>
      m.name.toLowerCase().includes(queryLower) ||
      m.huggingfaceId?.toLowerCase().includes(queryLower) ||
      m.tags?.some(t => t.toLowerCase().includes(queryLower))
    );
  }

  return mockModels;
}

// Discover local AI model endpoints
async function discoverLocalModels(endpoints: string[]): Promise<AIModel[]> {
  const discoveredModels: AIModel[] = [];

  // Default endpoints to check
  const defaultEndpoints = [
    'http://localhost:11434', // Ollama
    'http://localhost:8000',  // vLLM / FastAPI
    'http://localhost:8501',  // TensorFlow Serving
    'http://localhost:8080',  // Triton
  ];

  const endpointsToCheck = endpoints.length > 0 ? endpoints : defaultEndpoints;

  // In production, this would actually ping the endpoints
  // For now, simulate discovery
  const mockLocalModels: AIModel[] = [
    {
      id: `local-${Date.now()}-1`,
      name: 'llama3:latest',
      source: 'ollama',
      modelType: 'text-generation',
      version: '3.0',
      framework: 'Ollama',
      endpoint: 'http://localhost:11434',
      overallScore: 0,
      riskLevel: 'unknown',
      tags: ['local', 'llm', 'ollama']
    },
    {
      id: `local-${Date.now()}-2`,
      name: 'codellama:13b',
      source: 'ollama',
      modelType: 'text-generation',
      version: '1.0',
      framework: 'Ollama',
      endpoint: 'http://localhost:11434',
      overallScore: 0,
      riskLevel: 'unknown',
      tags: ['local', 'code', 'ollama']
    },
    {
      id: `local-${Date.now()}-3`,
      name: 'mistral:7b',
      source: 'ollama',
      modelType: 'text-generation',
      version: '0.2',
      framework: 'Ollama',
      endpoint: 'http://localhost:11434',
      overallScore: 0,
      riskLevel: 'unknown',
      tags: ['local', 'llm', 'ollama']
    }
  ];

  return mockLocalModels;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, query, organization, localEndpoints, filters } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'source is required (huggingface, local, or both)' },
        { status: 400 }
      );
    }

    let discoveredModels: AIModel[] = [];

    if (source === 'huggingface' || source === 'both') {
      const hfModels = await discoverHuggingFaceModels(query, organization);
      discoveredModels = [...discoveredModels, ...hfModels];
    }

    if (source === 'local' || source === 'both') {
      const localModels = await discoverLocalModels(localEndpoints || []);
      discoveredModels = [...discoveredModels, ...localModels];
    }

    // Apply filters
    if (filters) {
      if (filters.modelType && filters.modelType.length > 0) {
        discoveredModels = discoveredModels.filter(m =>
          filters.modelType.includes(m.modelType)
        );
      }
      if (filters.framework && filters.framework.length > 0) {
        discoveredModels = discoveredModels.filter(m =>
          filters.framework.includes(m.framework)
        );
      }
      if (filters.minDownloads) {
        discoveredModels = discoveredModels.filter(m =>
          (m.downloads || 0) >= filters.minDownloads
        );
      }
      if (filters.license && filters.license.length > 0) {
        discoveredModels = discoveredModels.filter(m =>
          m.license && filters.license.includes(m.license)
        );
      }
    }

    return NextResponse.json({
      source,
      models: discoveredModels,
      total: discoveredModels.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error discovering models:', error);
    return NextResponse.json(
      { error: 'Failed to discover AI models' },
      { status: 500 }
    );
  }
}
