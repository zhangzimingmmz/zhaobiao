import React, { useEffect, useState } from "react";
import { Card, Button, Input, message } from "antd";
import { getContactSettings, updateContactSettings } from "../lib/api";

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportPhone, setSupportPhone] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getContactSettings();
        setSupportPhone(data.supportPhone || "");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "读取客服电话失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updateContactSettings(supportPhone.trim());
      setSupportPhone(data.supportPhone || "");
      message.success(data.supportPhone ? "客服电话已保存" : "客服电话已清空");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "保存客服电话失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="客服电话设置" loading={loading}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ marginBottom: 12, color: "#595959", fontSize: 14 }}>
          小程序“我的 &gt; 联系客服”会读取这里配置的号码，并支持用户直接拨打。
        </div>
        <Input
          value={supportPhone}
          onChange={(event) => setSupportPhone(event.target.value)}
          placeholder="请输入客服电话，例如 400-123-4567"
          maxLength={32}
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" onClick={handleSave} loading={saving}>
          保存
        </Button>
      </div>
    </Card>
  );
}
