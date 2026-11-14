import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const companySizes = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

export function ProductDemoNextStep({ automation, shipmentVolume, showShipmentVolume = false }: { automation: "product-intelligence" | "shipment-readiness"; shipmentVolume?: string; showShipmentVolume?: boolean }) {
  const [companySize, setCompanySize] = useState("");
  const [selectedShipmentVolume, setSelectedShipmentVolume] = useState("");
  const effectiveShipmentVolume = shipmentVolume ?? selectedShipmentVolume;
  const canContinue = Boolean(companySize) && (!showShipmentVolume || Boolean(effectiveShipmentVolume));
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <p className="text-sm font-semibold">How many people are in your company?</p>
      <p className="mt-1 text-xs text-muted-foreground">Choose your approximate team size to continue to the demo request.</p>
      {showShipmentVolume && (
        <label className="mt-3 grid gap-2 text-sm">
          Monthly shipment volume
          <select value={selectedShipmentVolume} onChange={(event) => setSelectedShipmentVolume(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 font-normal">
            <option value="">Select monthly shipment volume</option>
            <option value="1–10">1–10 shipments</option>
            <option value="11–50">11–50 shipments</option>
            <option value="51–100">51–100 shipments</option>
            <option value="101+">101+ shipments</option>
          </select>
        </label>
      )}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-2 text-sm">
          Company size
          <select value={companySize} onChange={(event) => setCompanySize(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 font-normal">
            <option value="">Select company size</option>
            {companySizes.map((size) => <option key={size} value={size}>{size} employees</option>)}
          </select>
        </label>
        {canContinue ? (
          <Button asChild variant="hero">
            <Link to="/request-demo" search={{ automation, companySize, shipmentVolume: effectiveShipmentVolume }}>
              Continue to demo request <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button variant="hero" disabled>
            Continue to demo request <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
