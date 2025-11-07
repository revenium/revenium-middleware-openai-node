// Direct match check for known LiteLLM model names
export const knownModels = [
'gpt-4o',
'gpt-4o-mini',
'gpt-4',
'gpt-4-turbo',
'gpt-4-vision-preview',
'gpt-3.5-turbo',
'gpt-3.5-turbo-instruct',
'text-embedding-3-large',
'text-embedding-3-small',
'text-embedding-ada-002',
'dall-e-3',
'dall-e-2',
'whisper-1',
'tts-1',
'tts-1-hd'
];

export const MESSAGE_PATTERNS_TYPE_NETWORK = ["network", "timeout", "ECONNRESET"];
export const ERROR_MESSAGE_PATTERNS_TYPE_CONFIG = ["config", "key", "unauthorized"];