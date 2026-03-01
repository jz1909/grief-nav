"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportPanel } from "@/components/mail/import-panel";
import { ContactsPanel } from "@/components/mail/contacts-panel";
import { DossiersPanel } from "@/components/mail/dossiers-panel";
import { ClassificationPanel } from "@/components/mail/classification-panel";

export default function MailAutomationPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mail Automation</h1>

        {/* Step Indicators */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-4 py-2 rounded ${
                step === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && <ImportPanel onComplete={() => setStep(2)} />}
        {step === 2 && <ContactsPanel onComplete={() => setStep(3)} />}
        {step === 3 && <DossiersPanel onComplete={() => setStep(4)} />}
        {step === 4 && <ClassificationPanel onComplete={() => setStep(5)} />}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Draft & Send</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Coming soon: Draft and send emails to your contact groups.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
