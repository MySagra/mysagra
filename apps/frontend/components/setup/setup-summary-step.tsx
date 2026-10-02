"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/locale-context";
import type { SetupData, SetupStep } from "./setup-wizard";

interface SetupSummaryStepProps {
  data: SetupData;
  onEdit: (step: SetupStep) => void;
}

export function SetupSummaryStep({ data, onEdit }: SetupSummaryStepProps) {
  const { t } = useLocale();
  const [showTechnical, setShowTechnical] = useState(false);
  const { orders } = data.settings;

  const modeLabels = {
    HIDDEN: t.setup.modeHidden,
    OPTIONAL: t.setup.modeOptional,
    REQUIRED: t.setup.modeRequired,
  };

  function describeTable() {
    if (orders.table === "HIDDEN") return modeLabels.HIDDEN;

    const hasNumber = orders.tableInputs.includes("NUMBER");
    const hasText = orders.tableInputs.includes("TEXT");
    let inputs = hasNumber && hasText
      ? t.setup.summaryTableNumberOrText
      : hasNumber ? t.setup.summaryTableNumber : t.setup.summaryTableText;

    if (hasNumber && orders.maxTables) {
      inputs += ` (${t.setup.summaryTableMax.replace("{max}", String(orders.maxTables))})`;
    }
    return `${modeLabels[orders.table]} · ${inputs}`;
  }

  // only the last characters of the token are shown
  const maskedToken = `••••${data.token.trim().slice(-4)}`;

  const rows: { label: string; value: string; step: SetupStep }[] = [
    { label: t.setup.summaryToken, value: maskedToken, step: "token" },
    { label: t.setup.summarySagra, value: data.sagraName.trim(), step: "sagra" },
    { label: t.setup.summaryAdmin, value: data.username.trim(), step: "account" },
    { label: t.setup.summaryCustomer, value: modeLabels[orders.customer], step: "cashier" },
    { label: t.setup.summaryTable, value: describeTable(), step: "cashier" },
    { label: t.setup.summaryTicket, value: data.settings.showTicketNumbers ? t.setup.yes : t.setup.no, step: "cashier" },
  ];

  // what will be sent, secrets excluded
  const technicalPayload = {
    sagra: { name: data.sagraName.trim() },
    user: { username: data.username.trim() },
    settings: data.settings,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.setup.summaryTitle}</h1>
        <p className="text-muted-foreground">{t.setup.summaryDescription}</p>
      </div>

      <dl className="divide-y rounded-xl border bg-card">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="truncate text-sm font-semibold">{row.value}</dd>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              {t.setup.edit}
            </button>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          aria-expanded={showTechnical}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTechnical ? t.setup.hideTechnical : t.setup.showTechnical}
        </button>
        {showTechnical && (
          <pre className="max-h-64 overflow-auto rounded-xl border bg-card p-4 font-mono text-xs text-muted-foreground">
            {JSON.stringify(technicalPayload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
