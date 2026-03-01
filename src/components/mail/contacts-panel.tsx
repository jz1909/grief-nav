"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/hooks/use-mail-import";

interface ContactsPanelProps {
  onComplete: () => void;
}

export function ContactsPanel({ onComplete }: ContactsPanelProps) {
  const { data, isLoading } = useContacts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">Loading contacts...</CardContent>
      </Card>
    );
  }

  const contacts = data?.contacts || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Review Contacts ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-2">
          {contacts.map((contact: any) => (
            <div
              key={contact.id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{contact.primaryEmail}</p>
                {contact.displayName && (
                  <p className="text-sm text-gray-500">{contact.displayName}</p>
                )}
              </div>
              {contact.group && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {contact.group}
                </span>
              )}
            </div>
          ))}
        </div>

        <Button onClick={onComplete}>Continue to Analysis</Button>
      </CardContent>
    </Card>
  );
}
