import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/usage')({
  component: Usage,
});

function Usage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Detailed usage statistics and history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed usage table coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}