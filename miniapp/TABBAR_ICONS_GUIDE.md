# TabBar 图标准备指南

## 需要的图标文件

在 `miniapp/src/assets/tabbar/` 目录下需要准备以下 6 个图标文件：

1. `home.png` - 首页未选中
2. `home-active.png` - 首页选中
3. `favorites.png` - 收藏未选中  
4. `favorites-active.png` - 收藏选中
5. `profile.png` - 我的未选中
6. `profile-active.png` - 我的选中

## 图标规格

- 尺寸：81px × 81px（推荐）或 40px × 40px
- 格式：PNG
- 背景：透明
- 颜色：
  - 未选中：灰色 #4E5969
  - 选中：蓝色 #1677FF

## 快速获取图标的方法

### 方法一：使用 iconfont（推荐）
1. 访问 https://www.iconfont.cn/
2. 搜索"首页"、"收藏"、"用户"图标
3. 下载 PNG 格式，选择 81px 尺寸
4. 分别下载灰色和蓝色两个版本

### 方法二：在线 SVG 转 PNG
1. 访问 https://svgtopng.com/
2. 使用项目中的 SVG 路径（见下方）
3. 设置尺寸为 81px
4. 设置颜色并导出

### 方法三：使用设计工具
使用 Figma/Sketch/Photoshop 绘制简单图标并导出

## 项目中的 SVG 路径

```javascript
// 首页 (home)
<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>

// 收藏 (heart)
<path d="M12 20.5s-7-4.44-7-10.2C5 7.1 7.1 5 9.7 5c1.67 0 3.03.86 3.8 2.13C14.27 5.86 15.63 5 17.3 5 19.9 5 22 7.1 22 10.3c0 5.76-7 10.2-7 10.2H12Z"/>

// 我的 (user)
<circle cx="12" cy="8" r="3.5"/><path d="M5 19a7 7 0 0 1 14 0"/>
```

## 临时方案

如果暂时没有图标，可以：
1. 先使用纯色方块占位
2. 或者暂时移除 iconPath 配置，只显示文字
3. 后续再补充图标

## 放置位置

将准备好的 6 个图标文件放到：
```
miniapp/src/assets/tabbar/
├── home.png
├── home-active.png
├── favorites.png
├── favorites-active.png
├── profile.png
└── profile-active.png
```

放置完成后，开发模式会自动热更新，无需重新编译。
