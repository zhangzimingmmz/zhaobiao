import React from "react";
import { Segmented } from "antd";

type EnterpriseModuleTabsProps = {
  active: "applications" | "companies";
  navigate: (path: string) => void;
};

export function EnterpriseModuleTabs({ active, navigate }: EnterpriseModuleTabsProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Segmented
        value={active}
        options={[
          { label: "申请视图", value: "applications" },
          { label: "企业档案", value: "companies" },
        ]}
        onChange={(value) =>
          navigate(value === "applications" ? "/enterprise/applications" : "/enterprise/companies")
        }
      />
    </div>
  );
}
