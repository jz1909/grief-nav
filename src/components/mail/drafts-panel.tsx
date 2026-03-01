"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useNotificationDrafts,
  useGenerateNotifications,
  useUpdateDraft,
  useSendApprovedNotifications,
} from "@/hooks/use-mail-import";

interface DraftsPanelProps {
  onComplete?: () => void;
}

interface Draft {
  id: string;
  contactId: string;
  email: string;
  group: string;
  subject: string;
  body: string;
  tone: string;
  status: "draft" | "approved" | "sent" | "skipped";
  createdAt: string;
  sentAt: string | null;
}

export function DraftsPanel({ onComplete }: DraftsPanelProps) {
  const [deceasedName, setDeceasedName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const { data, isLoading, refetch } = useNotificationDrafts();
  const generateMutation = useGenerateNotifications();
  const updateMutation = useUpdateDraft();
  const sendMutation = useSendApprovedNotifications();

  const drafts: Draft[] = data?.drafts || [];
  const byStatus = data?.byStatus || { draft: 0, approved: 0, sent: 0, skipped: 0 };
  const byGroup = data?.byGroup || {};

  const handleGenerate = () => {
    if (!deceasedName.trim() || !senderName.trim()) return;
    generateMutation.mutate({ deceasedName, senderName });
  };

  const handleStatusChange = (draftId: string, status: Draft["status"]) => {
    updateMutation.mutate({ draftId, status });
  };

  const handleEditSave = () => {
    if (!editingDraft) return;
    updateMutation.mutate(
      {
        draftId: editingDraft.id,
        subject: editSubject,
        body: editBody,
      },
      {
        onSuccess: () => {
          setEditingDraft(null);
          setEditSubject("");
          setEditBody("");
        },
      }
    );
  };

  const handleSendApproved = () => {
    sendMutation.mutate();
  };

  const startEditing = (draft: Draft) => {
    setEditingDraft(draft);
    setEditSubject(draft.subject);
    setEditBody(draft.body);
  };

  const groups = Object.keys(byGroup);
  const filteredDrafts = activeGroup
    ? drafts.filter((d) => d.group === activeGroup)
    : drafts;

  const pendingDrafts = filteredDrafts.filter((d) => d.status === "draft");
  const approvedDrafts = filteredDrafts.filter((d) => d.status === "approved");
  const sentDrafts = filteredDrafts.filter((d) => d.status === "sent");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Draft & Send Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Form */}
        {drafts.length === 0 && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Generate sincere notification emails for your classified contacts.
              The AI will compose appropriate messages for each relationship group.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deceasedName">Name of Deceased</Label>
                <Input
                  id="deceasedName"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderName">Your Name</Label>
                <Input
                  id="senderName"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g., Jane Smith"
                />
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={
                generateMutation.isPending ||
                !deceasedName.trim() ||
                !senderName.trim()
              }
            >
              {generateMutation.isPending
                ? "Generating Drafts..."
                : "Generate Notification Drafts"}
            </Button>
            {generateMutation.isError && (
              <p className="text-sm text-red-600">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : "Error generating drafts. Please try again."}
              </p>
            )}
            {generateMutation.isSuccess && generateMutation.data?.draftsGenerated === 0 && (
              <p className="text-sm text-amber-600">
                No drafts were generated. Make sure you have classified contacts in Step 4.
                {generateMutation.data?.errors?.length > 0 && (
                  <span className="block mt-1">
                    Errors: {generateMutation.data.errors.join(", ")}
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Status Summary */}
        {drafts.length > 0 && (
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{byStatus.draft}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {byStatus.approved}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {byStatus.sent}
              </div>
              <div className="text-sm text-gray-500">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {byStatus.skipped}
              </div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
          </div>
        )}

        {/* Group Filter */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeGroup === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveGroup(null)}
            >
              All ({drafts.length})
            </Button>
            {groups.map((group) => (
              <Button
                key={group}
                variant={activeGroup === group ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveGroup(group)}
                className="capitalize"
              >
                {group} ({byGroup[group]})
              </Button>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingDraft && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Edit Draft for {editingDraft.email}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editSubject">Subject</Label>
                  <Input
                    id="editSubject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBody">Body</Label>
                  <Textarea
                    id="editBody"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingDraft(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Drafts */}
        {pendingDrafts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Pending Review ({pendingDrafts.length})</h3>
            {pendingDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={() => handleStatusChange(draft.id, "approved")}
                onSkip={() => handleStatusChange(draft.id, "skipped")}
                onEdit={() => startEditing(draft)}
                isPending={updateMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Approved Drafts */}
        {approvedDrafts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-green-700">
                Approved ({approvedDrafts.length})
              </h3>
              <Button
                onClick={handleSendApproved}
                disabled={sendMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {sendMutation.isPending
                  ? "Sending..."
                  : `Send ${approvedDrafts.length} Email${approvedDrafts.length > 1 ? "s" : ""}`}
              </Button>
            </div>
            {approvedDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onUnapprove={() => handleStatusChange(draft.id, "draft")}
                onEdit={() => startEditing(draft)}
                isPending={updateMutation.isPending}
                isApproved
              />
            ))}
          </div>
        )}

        {/* Sent Drafts */}
        {sentDrafts.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-700">
              Sent ({sentDrafts.length})
            </h3>
            {sentDrafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} isSent />
            ))}
          </div>
        )}

        {/* Send Success Message */}
        {sendMutation.isSuccess && (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg">
            Successfully sent {sendMutation.data?.sent} notification
            {sendMutation.data?.sent !== 1 ? "s" : ""}!
          </div>
        )}

        {isLoading && <p className="text-gray-500">Loading drafts...</p>}
      </CardContent>
    </Card>
  );
}

interface DraftCardProps {
  draft: Draft;
  onApprove?: () => void;
  onSkip?: () => void;
  onEdit?: () => void;
  onUnapprove?: () => void;
  isPending?: boolean;
  isApproved?: boolean;
  isSent?: boolean;
}

function DraftCard({
  draft,
  onApprove,
  onSkip,
  onEdit,
  onUnapprove,
  isPending,
  isApproved,
  isSent,
}: DraftCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 ${
        isApproved
          ? "border-green-200 bg-green-50"
          : isSent
            ? "border-blue-200 bg-blue-50"
            : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 capitalize">
              {draft.group}
            </span>
            <span className="text-xs text-gray-500">{draft.tone}</span>
          </div>
          <p className="font-medium truncate mt-1">{draft.email}</p>
          <p className="text-sm text-gray-600 truncate">{draft.subject}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!isSent && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          {!isApproved && !isSent && onApprove && (
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          )}
          {!isApproved && !isSent && onSkip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkip}
              disabled={isPending}
            >
              Skip
            </Button>
          )}
          {isApproved && onUnapprove && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnapprove}
              disabled={isPending}
            >
              Unapprove
            </Button>
          )}
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-blue-600 hover:underline mt-2"
      >
        {expanded ? "Hide" : "Show"} full message
      </button>

      {expanded && (
        <div className="mt-3 p-3 bg-white rounded border text-sm whitespace-pre-wrap font-mono">
          {draft.body}
        </div>
      )}
    </div>
  );
}
