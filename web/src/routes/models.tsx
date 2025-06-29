import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export const Route = createFileRoute('/models')({
  component: Models,
});

function Models() {
  const { data: models } = trpc.models.list.useQuery();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Available Models</h2>
        <p className="text-muted-foreground">
          AI models available through your configured providers
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {models?.map((model) => (
          <Card key={`${model.provider}-${model.id}`}>
            <CardHeader>
              <CardTitle className="text-lg">{model.name}</CardTitle>
              <CardDescription>{model.provider}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{model.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}