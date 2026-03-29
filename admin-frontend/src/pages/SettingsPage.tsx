import React, { useEffect, useState } from "react";
import { Card, Button, Input, Space, message } from "antd";
import { getContactSettings, updateContactSettings } from "../lib/api";
import { isSuperAdmin } from "../lib/auth";

type SupportContact = {
  name: string;
  phone: string;
};

export function SettingsPage({ navigate }: { navigate: (path: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getContactSettings();
        setSupportContacts(
          Array.isArray(data.supportContacts) && data.supportContacts.length > 0
            ? data.supportContacts
            : data.supportPhone
              ? [{ name: "客服电话", phone: data.supportPhone }]
              : [],
        );
      } catch (err) {
        message.error(err instanceof Error ? err.message : "读取客服电话失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const handleSave = async () => {
    const normalized = supportContacts
      .map((item) => ({ name: item.name.trim(), phone: item.phone.trim() }))
      .filter((item) => item.name || item.phone);

    if (normalized.some((item) => !item.name || !item.phone)) {
      message.error("请完整填写客服名称和电话号码");
      return;
    }

    setSaving(true);
    try {
      const data = await updateContactSettings(normalized);
      setSupportContacts(data.supportContacts || []);
      message.success((data.supportContacts || []).length > 0 ? "客服联系方式已保存" : "客服联系方式已清空");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "保存客服电话失败");
    } finally {
      setSaving(false);
    }
  };

  const handleContactChange = (index: number, field: keyof SupportContact, value: string) => {
    setSupportContacts((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddContact = () => {
    setSupportContacts((prev) => [...prev, { name: "", phone: "" }]);
  };

  const handleRemoveContact = (index: number) => {
    setSupportContacts((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="客服电话设置" loading={loading}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 12, color: "#595959", fontSize: 14 }}>
            小程序“我的 &gt; 联系客服”和“忘记密码 &gt; 人工协助”会读取这里配置的客服列表；如果配置多位客服，小程序会弹出号码列表供用户选择拨打。
          </div>
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {supportContacts.map((item, index) => (
              <Space key={`support-contact-${index}`} align="start" style={{ display: "flex" }}>
                <Input
                  value={item.name}
                  onChange={(event) => handleContactChange(index, "name", event.target.value)}
                  placeholder={`客服名称，例如 客服${index + 1}`}
                  maxLength={16}
                  style={{ width: 180 }}
                />
                <Input
                  value={item.phone}
                  onChange={(event) => handleContactChange(index, "phone", event.target.value)}
                  placeholder="请输入电话号码，例如 400-123-4567"
                  maxLength={32}
                  style={{ width: 260 }}
                />
                <Button danger onClick={() => handleRemoveContact(index)}>
                  删除
                </Button>
              </Space>
            ))}
          </div>
          <Space wrap>
            <Button onClick={handleAddContact}>新增客服</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </Space>
        </div>
      </Card>

      {isSuperAdmin() ? (
        <Card title="审核员管理">
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 12, color: "#595959", fontSize: 14 }}>
              超级管理员可在这里统一管理审核员账号，包括新增、重置密码和启用/停用。
            </div>
            <Button onClick={() => navigate("/settings/reviewers")}>进入审核员管理</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
