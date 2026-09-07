import React from 'react';
import {
  OpenAIDark,
  ClaudeAI,
  Gemini,
  Meta,
  DeepSeek,
  MistralAI,
  GrokDark,
  QwenDark,
  Cohere,
  VercelDark,
} from '@ridemountainpig/svgl-react';
import { OpenRouterLogo } from '../ui/icons/OpenRouterLogo';
import {
  ZaiLogo,
  TencentLogo,
  ByteDanceLogo,
  MiniMaxLogo,
  MoonshotLogo,
  GemmaLogo,
  NvidiaLogo,
  InceptionLogo,
} from '../ui/icons/BrandLogos';
import { Cpu } from 'lucide-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { detectModelBrand } from '../../services/modelCatalogService';

interface ModelBrandIconProps {
  modelIdOrBrand: string;
  className?: string;
}

export const ModelBrandIcon: React.FC<ModelBrandIconProps> = ({
  modelIdOrBrand,
  className = 'w-4 h-4',
}) => {
  const brand =
    modelIdOrBrand.includes('/') || modelIdOrBrand.includes('-')
      ? detectModelBrand(modelIdOrBrand)
      : modelIdOrBrand.toLowerCase();

  switch (brand) {
    case 'gobetter':
    case 'gobe':
    case 'gobetter-free':
      return <GobeAiLogo className={`${className} shrink-0`} variant="brand" size={16} disableAnimation={true} />;
    case 'openai':
      return <OpenAIDark className={`${className} shrink-0`} />;
    case 'anthropic':
    case 'claude':
      return <ClaudeAI className={`${className} shrink-0`} />;
    case 'gemini':
    case 'google':
      return <Gemini className={`${className} shrink-0`} />;
    case 'gemma':
      return <GemmaLogo className={`${className} shrink-0`} />;
    case 'meta':
    case 'llama':
      return <Meta className={`${className} shrink-0`} />;
    case 'deepseek':
      return <DeepSeek className={`${className} shrink-0`} />;
    case 'xai':
    case 'grok':
      return <GrokDark className={`${className} shrink-0`} />;
    case 'qwen':
    case 'alibaba':
      return <QwenDark className={`${className} shrink-0`} />;
    case 'mistral':
      return <MistralAI className={`${className} shrink-0`} />;
    case 'moonshot':
    case 'kimi':
      return <MoonshotLogo className={`${className} shrink-0`} />;
    case 'zai':
    case 'zhipu':
      return <ZaiLogo className={`${className} shrink-0`} />;
    case 'tencent':
      return <TencentLogo className={`${className} shrink-0`} />;
    case 'bytedance':
      return <ByteDanceLogo className={`${className} shrink-0`} />;
    case 'minimax':
      return <MiniMaxLogo className={`${className} shrink-0`} />;
    case 'nvidia':
    case 'nemotron':
      return <NvidiaLogo className={`${className} shrink-0`} />;
    case 'inception':
    case 'inceptionlabs':
    case 'mercury':
      return <InceptionLogo className={`${className} shrink-0`} />;
    case 'cohere':
      return <Cohere className={`${className} shrink-0`} />;
    case 'openrouter':
      return <OpenRouterLogo className={`${className} shrink-0`} />;
    case 'vercel':
      return <VercelDark className={`${className} shrink-0`} />;
    default:
      return <Cpu className={`${className} shrink-0 text-zinc-400`} />;
  }
};
