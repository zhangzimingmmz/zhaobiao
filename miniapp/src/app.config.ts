export default {
  pages: [
    'pages/index/index',
    'pages/favorites/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/info-detail/index',
    'pages/webview/index',
    'pages/login/index',
    'pages/register/index',
    'pages/audit-status/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677FF',
    navigationBarTitleText: '招投标信息平台',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1677FF',
    backgroundColor: '#fff',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/favorites/index', text: '收藏' },
      { pagePath: 'pages/profile/index', text: '我的' },
    ],
  },
}
