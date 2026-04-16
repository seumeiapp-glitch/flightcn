import type { Metadata } from "next";

import { TelemetryGeoPage } from "@/components/telemetry/telemetry-geo-page";

export const metadata: Metadata = {
  title: "Telemetria Global",
  description:
    "Monitoramento geografico em tempo real - visualize logins, instalacoes e atividade global da plataforma.",
};

export default function TelemetryPage() {
  return <TelemetryGeoPage />;
}
