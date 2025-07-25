import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { CheckCircle, XCircle } from 'lucide-react';

export const Route = createFileRoute('/config')({
  component: Configuration,
});

function Configuration() {
  const { data: config } = trpc.config.get.useQuery();

  const providers = [
    {
      name: 'OpenAI',
      key: 'openai' as const,
      configured: config?.openai?.configured,
      apiKey: config?.openai?.apiKey,
      baseURL: config?.openai?.baseURL,
    },
    {
      name: 'Google Gemini',
      key: 'google' as const,
      configured: config?.google?.configured,
      apiKey: config?.google?.apiKey,
      baseURL: config?.google?.baseURL,
    },
    {
      name: 'Azure OpenAI',
      key: 'azure' as const,
      configured: config?.azure?.configured,
      apiKey: config?.azure?.apiKey,
      baseURL: config?.azure?.baseURL,
    },
    {
      name: 'xAI Grok',
      key: 'xai' as const,
      configured: config?.xai?.configured,
      apiKey: config?.xai?.apiKey,
      baseURL: config?.xai?.baseURL,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground">
          Manage your API keys and provider settings
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{provider.name}</CardTitle>
                {provider.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <CardDescription>
                {provider.configured ? 'Configured' : 'Not configured'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provider.apiKey && (
                  <div>
                    <span className="text-sm text-muted-foreground">API Key: </span>
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {provider.apiKey}
                    </code>
                  </div>
                )}
                {provider.baseURL && (
                  <div>
                    <span className="text-sm text-muted-foreground">Base URL: </span>
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {provider.baseURL}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          To update your API keys, run <code className="bg-background px-1 py-0.5 rounded">npx ultra-mcp config</code> in your terminal.
        </p>
      </div>
    </div>
  );
}