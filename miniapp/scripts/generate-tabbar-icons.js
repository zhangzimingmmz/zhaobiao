/**
 * 生成 TabBar 图标
 * 运行: node scripts/generate-tabbar-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG 图标路径
const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  heart: '<path d="M12 20.5s-7-4.44-7-10.2C5 7.1 7.1 5 9.7 5c1.67 0 3.03.86 3.8 2.13C14.27 5.86 15.63 5 17.3 5 19.9 5 22 7.1 22 10.3c0 5.76-7 10.2-7 10.2H12Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 19a7 7 0 0 1 14 0"/>',
};

// 颜色配置
const COLORS = {
  normal: '#4E5969',
  active: '#1677FF',
};

// 生成 SVG 字符串
function generateSVG(iconName, color, size = 81) {
  const markup = ICONS[iconName];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  ${markup}
</svg>`;
}

// 创建目录
const outputDir = path.join(__dirname, '../src/assets/tabbar');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成图标配置
const icons = [
  { name: 'home', filename: 'home' },
  { name: 'heart', filename: 'favorites' },
  { name: 'user', filename: 'profile' },
];

// 异步生成所有图标
async function generateIcons() {
  console.log('开始生成 TabBar 图标...\n');
  
  for (const { name, filename } of icons) {
    // 未选中状态
    const normalSVG = Buffer.from(generateSVG(name, COLORS.normal));
    await sharp(normalSVG)
      .resize(81, 81)
      .png()
      .toFile(path.join(outputDir, `${filename}.png`));
    console.log(`✓ 生成 ${filename}.png`);
    
    // 选中状态
    const activeSVG = Buffer.from(generateSVG(name, COLORS.active));
    await sharp(activeSVG)
      .resize(81, 81)
      .png()
      .toFile(path.join(outputDir, `${filename}-active.png`));
    console.log(`✓ 生成 ${filename}-active.png`);
  }
  
  console.log('\n✅ 所有 TabBar 图标生成完成！');
  console.log(`📁 图标位置: ${outputDir}\n`);
}

generateIcons().catch(err => {
  console.error('❌ 生成图标失败:', err);
  process.exit(1);
});
