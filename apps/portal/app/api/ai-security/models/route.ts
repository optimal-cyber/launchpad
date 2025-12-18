export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { AIModel, AIModelSource, RiskLevel } from '@/lib/ai-security-types';

// In-memory store for AI models (would be database in production)
const aiModelsStore = new Map<string, AIModel>();

// Initialize with sample models
const sampleModels: AIModel[] = [
  {
    id: 'model-1',
    name: 'GPT-4 Turbo',
    source: 'openai',
    modelType: 'text-generation',
    version: 'gpt-4-1106-preview',
    framework: 'OpenAI API',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    overallScore: 87,
    riskLevel: 'low',
    lastAssessed: '2024-12-15T10:30:00Z',
    license: 'Proprietary',
    tags: ['llm', 'chat', 'production']
  },
  {
    id: 'model-2',
    name: 'Claude 3 Sonnet',
    source: 'anthropic',
    modelType: 'text-generation',
    version: 'claude-3-sonnet-20240229',
    framework: 'Anthropic API',
    endpoint: 'https://api.anthropic.com/v1/messages',
    overallScore: 92,
    riskLevel: 'low',
    lastAssessed: '2024-12-14T14:20:00Z',
    license: 'Proprietary',
    tags: ['llm', 'chat', 'production']
  },
  {
    id: 'model-3',
    name: 'Llama 2 70B',
    source: 'huggingface',
    modelType: 'text-generation',
    version: '2.0',
    framework: 'Transformers',
    huggingfaceId: 'meta-llama/Llama-2-70b-chat-hf',
    author: 'Meta',
    downloads: 1500000,
    overallScore: 78,
    riskLevel: 'medium',
    lastAssessed: '2024-12-10T09:00:00Z',
    license: 'Llama 2 Community',
    tags: ['llm', 'open-source', 'chat']
  },
  {
    id: 'model-4',
    name: 'Mistral 7B Instruct',
    source: 'huggingface',
    modelType: 'text-generation',
    version: '0.2',
    framework: 'Transformers',
    huggingfaceId: 'mistralai/Mistral-7B-Instruct-v0.2',
    author: 'Mistral AI',
    downloads: 2300000,
    overallScore: 75,
    riskLevel: 'medium',
    lastAssessed: '2024-12-08T11:15:00Z',
    license: 'Apache 2.0',
    tags: ['llm', 'open-source', 'instruct']
  },
  {
    id: 'model-5',
    name: 'Local Ollama - Llama3',
    source: 'ollama',
    modelType: 'text-generation',
    version: '3.0',
    framework: 'Ollama',
    endpoint: 'http://localhost:11434',
    overallScore: 65,
    riskLevel: 'medium',
    tags: ['llm', 'local', 'development']
  },
  {
    id: 'model-6',
    name: 'Sentiment Classifier',
    source: 'huggingface',
    modelType: 'text-classification',
    version: '1.0',
    framework: 'Transformers',
    huggingfaceId: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    author: 'cardiffnlp',
    downloads: 500000,
    overallScore: 82,
    riskLevel: 'low',
    lastAssessed: '2024-12-01T08:00:00Z',
    license: 'MIT',
    tags: ['classification', 'sentiment', 'nlp']
  },
  {
    id: 'model-7',
    name: 'Code Generation Model',
    source: 'huggingface',
    modelType: 'text-generation',
    version: '15B',
    framework: 'Transformers',
    huggingfaceId: 'bigcode/starcoder',
    author: 'bigcode',
    downloads: 800000,
    overallScore: 58,
    riskLevel: 'high',
    tags: ['code', 'generation', 'development']
  },
  {
    id: 'model-8',
    name: 'Embedding Model',
    source: 'huggingface',
    modelType: 'embedding',
    version: '2.0',
    framework: 'Sentence Transformers',
    huggingfaceId: 'sentence-transformers/all-MiniLM-L6-v2',
    author: 'sentence-transformers',
    downloads: 5000000,
    overallScore: 88,
    riskLevel: 'low',
    lastAssessed: '2024-12-12T16:00:00Z',
    license: 'Apache 2.0',
    tags: ['embedding', 'rag', 'search']
  }
];

// Initialize store with sample models
sampleModels.forEach(model => {
  aiModelsStore.set(model.id, model);
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') as AIModelSource | null;
    const riskLevel = searchParams.get('riskLevel') as RiskLevel | null;
    const modelType = searchParams.get('modelType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let models = Array.from(aiModelsStore.values());

    // Apply filters
    if (source) {
      models = models.filter(m => m.source === source);
    }
    if (riskLevel) {
      models = models.filter(m => m.riskLevel === riskLevel);
    }
    if (modelType) {
      models = models.filter(m => m.modelType === modelType);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.huggingfaceId?.toLowerCase().includes(searchLower) ||
        m.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort by lastAssessed (most recent first), then by name
    models.sort((a, b) => {
      if (a.lastAssessed && b.lastAssessed) {
        return new Date(b.lastAssessed).getTime() - new Date(a.lastAssessed).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    const total = models.length;
    const start = (page - 1) * pageSize;
    const paginatedModels = models.slice(start, start + pageSize);

    return NextResponse.json({
      models: paginatedModels,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, source, modelType, version, framework, endpoint, huggingfaceId, tags } = body;

    if (!name || !source) {
      return NextResponse.json(
        { error: 'name and source are required' },
        { status: 400 }
      );
    }

    const id = `model-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

    const newModel: AIModel = {
      id,
      name,
      source,
      modelType: modelType || 'unknown',
      version: version || '1.0',
      framework: framework || 'unknown',
      endpoint,
      huggingfaceId,
      overallScore: 0,
      riskLevel: 'unknown',
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    aiModelsStore.set(id, newModel);

    return NextResponse.json(newModel, { status: 201 });
  } catch (error) {
    console.error('Error creating AI model:', error);
    return NextResponse.json(
      { error: 'Failed to create AI model' },
      { status: 500 }
    );
  }
}
