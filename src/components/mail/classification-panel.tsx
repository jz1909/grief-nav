"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useClassificationStatus,
  useClassifyContacts,
  useContacts,
  useOverrideClassification,
} from "@/hooks/use-mail-import";

interface ClassificationPanelProps {
  onComplete: () => void;
}

export function ClassificationPanel({ onComplete }: ClassificationPanelProps) {
  const { data: status, isLoading: statusLoading } = useClassificationStatus();
  const { data: contactsData } = useContacts();
  const classifyMutation = useClassifyContacts();
  const overrideMutation = useOverrideClassification();

  const handleClassify = () => {
    classifyMutation.mutate({});
  };

  const handleOverride = (contactId: string, newGroup: string) => {
    overrideMutation.mutate({ contactId, group: newGroup });
  };

  const contacts = contactsData?.contacts || [];
  const groups = status?.byGroup || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Classify Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            <p>Total contacts: {status?.total || 0}</p>
            <p>Classified: {status?.classified || 0}</p>
            <p>Unclassified: {status?.unclassified || 0}</p>
          </div>
        )}

        <Button
          onClick={handleClassify}
          disabled={classifyMutation.isPending}
        >
          {classifyMutation.isPending ? "Classifying..." : "Classify with AI"}
        </Button>

        {groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((g: any) => (
              <div key={g.group}>
                <h4 className="font-semibold capitalize">
                  {g.group} ({g.count})
                </h4>
                <div className="ml-4 space-y-1">
                  {contacts
                    .filter((c: any) => c.group === g.group)
                    .slice(0, 5)
                    .map((c: any) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="text-sm">{c.primaryEmail}</span>
                        <select
                          value={c.group}
                          onChange={(e) => handleOverride(c.id, e.target.value)}
                          className="text-xs border rounded px-1"
                        >
                          {status?.defaultCategories?.map((cat: any) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(status?.classified || 0) > 0 && (
          <Button onClick={onComplete}>Continue to Draft</Button>
        )}
      </CardContent>
    </Card>
  );
}
