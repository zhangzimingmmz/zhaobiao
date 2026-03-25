## 1. 更新 SECONDARY_MAP 配置

- [ ] 1.1 在 `miniapp/src/pages/index/index.tsx` 中找到 `SECONDARY_MAP` 常量
- [ ] 1.2 将 `construction: []` 改为包含三个 Tab 的配置数组
- [ ] 1.3 添加三个 Tab 对象：`{ id: 'plan', label: '招标计划' }`、`{ id: 'preview', label: '招标文件预公示' }`、`{ id: 'announcement', label: '招标公告' }`

## 2. 更新 getCategory 函数

- [ ] 2.1 在 `getCategory()` 函数中添加 construction 的分支判断
- [ ] 2.2 实现 secondary 到 category code 的映射：plan → 002001009, preview → 002001010, announcement → 002001001
- [ ] 2.3 设置默认值为 '002001010' 以保持向后兼容

## 3. 移除固定小节标题

- [ ] 3.1 找到工程建设板块的小节标题渲染逻辑（"招标文件预公示"）
- [ ] 3.2 添加条件判断：只在 `secondaryTabs.length === 0` 时显示固定标题
- [ ] 3.3 确保有 secondary tabs 时不显示固定标题

## 4. 测试与验证

- [ ] 4.1 本地启动小程序，验证工程建设板块显示三个 Tab
- [ ] 4.2 测试点击每个 Tab，验证数据正确加载（招标计划、招标文件预公示、招标公告）
- [ ] 4.3 测试筛选功能在每个 Tab 下是否正常工作
- [ ] 4.4 测试收藏功能在每个 Tab 下是否正常工作
- [ ] 4.5 验证政府采购和信息公开板块未受影响

## 5. 文档更新

- [ ] 5.1 更新 `openspec/specs/engineering-tender-preview-and-c-suppression/spec.md`，反映新的产品决策
- [ ] 5.2 在规范中说明工程建设板块现在有三个 Tab，而不是单一板块
