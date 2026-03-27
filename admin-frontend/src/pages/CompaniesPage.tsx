import React from "react";
import { EnterpriseModuleTabs } from "../components/EnterpriseModuleTabs";
import { EnterpriseTable } from "../components/EnterpriseTable";

export function CompaniesPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <>
      <EnterpriseModuleTabs active="companies" navigate={navigate} />
      <EnterpriseTable view="companies" navigate={navigate} />
    </>
  );
}
