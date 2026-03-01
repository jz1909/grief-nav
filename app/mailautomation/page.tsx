"use client";

import { useState } from "react";
import { ImportPanel } from "@/components/mail/import-panel";
import { ContactsPanel } from "@/components/mail/contacts-panel";
import { DossiersPanel } from "@/components/mail/dossiers-panel";
import { ClassificationPanel } from "@/components/mail/classification-panel";
import { DraftsPanel } from "@/components/mail/drafts-panel";

export default function MailAutomationPage() {
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, label: "Import" },
    { num: 2, label: "Contacts" },
    { num: 3, label: "Dossiers" },
    { num: 4, label: "Classify" },
    { num: 5, label: "Draft & Send" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mail Automation</h1>

        {/* Step Indicators */}
        <div className="flex gap-2 flex-wrap">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`px-4 py-2 rounded text-sm ${
                step === s.num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && <ImportPanel onComplete={() => setStep(2)} />}
        {step === 2 && <ContactsPanel onComplete={() => setStep(3)} />}
        {step === 3 && <DossiersPanel onComplete={() => setStep(4)} />}
        {step === 4 && <ClassificationPanel onComplete={() => setStep(5)} />}
        {step === 5 && <DraftsPanel />}
      </div>
    </div>
  );
}
