import React from "react";
import { EnterpriseModuleTabs } from "../components/EnterpriseModuleTabs";
import { EnterpriseTable } from "../components/EnterpriseTable";

export function ReviewsPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <>
      <EnterpriseModuleTabs active="applications" navigate={navigate} />
      <EnterpriseTable view="applications" navigate={navigate} />
    </>
  );
}
