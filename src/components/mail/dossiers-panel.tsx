"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDossiersForClassification } from "@/hooks/use-mail-import";

interface DossiersPanelProps {
  onComplete: () => void;
}

export function DossiersPanel({ onComplete }: DossiersPanelProps) {
  const { data, isLoading, refetch, isFetching } = useDossiersForClassification();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleBuild = () => {
    refetch();
  };

  const allDossiers = data?.batches?.flat() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Build Contact Dossiers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Analyze email patterns to understand your relationships.
        </p>

        <Button onClick={handleBuild} disabled={isFetching}>
          {isFetching ? "Building..." : "Build Dossiers"}
        </Button>

        {allDossiers.length > 0 && (
          <>
            <p>{allDossiers.length} dossiers built</p>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {allDossiers.slice(0, 20).map((dossier: any) => (
                <div key={dossier.contactId} className="border rounded p-3">
                  <div
                    className="cursor-pointer flex justify-between"
                    onClick={() =>
                      setExpanded(
                        expanded === dossier.contactId ? null : dossier.contactId
                      )
                    }
                  >
                    <span className="font-medium">{dossier.email}</span>
                    <span className="text-gray-500">
                      {dossier.messageCount} messages
                    </span>
                  </div>

                  {expanded === dossier.contactId && (
                    <div className="mt-2 text-sm space-y-1">
                      <p>Domain: {dossier.domain}</p>
                      <p>Last seen: {dossier.lastSeenDaysAgo} days ago</p>
                      {dossier.signatureHints.length > 0 && (
                        <p>Hints: {dossier.signatureHints.join(", ")}</p>
                      )}
                      {dossier.topicKeywords.length > 0 && (
                        <p>Keywords: {dossier.topicKeywords.join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={onComplete}>Continue to Classification</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
