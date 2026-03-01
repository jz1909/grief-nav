"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImportStats, useImportEmails } from "@/hooks/use-mail-import";

interface ImportPanelProps {
  onComplete: () => void;
}

export function ImportPanel({ onComplete }: ImportPanelProps) {
  const { data: stats, isLoading: statsLoading } = useImportStats();
  const importMutation = useImportEmails();

  const handleImport = async () => {
    await importMutation.mutateAsync();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Import Contacts from Gmail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statsLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            <p>Messages imported: {stats?.messageCount || 0}</p>
            <p>Contacts found: {stats?.contactCount || 0}</p>
            {stats?.lastImportDate && (
              <p className="text-sm text-gray-500">
                Last import: {new Date(stats.lastImportDate).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? "Importing..." : "Import from Gmail"}
          </Button>

          {(stats?.contactCount || 0) > 0 && (
            <Button variant="outline" onClick={onComplete}>
              Continue
            </Button>
          )}
        </div>

        {importMutation.isError && (
          <p className="text-red-600">
            Import failed: {importMutation.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
