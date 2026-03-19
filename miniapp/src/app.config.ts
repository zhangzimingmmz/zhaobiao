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
    navigationBarTitleText: '金堂招讯通',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#4E5969',
    selectedColor: '#1677FF',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      { 
        pagePath: 'pages/index/index', 
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      { 
        pagePath: 'pages/favorites/index', 
        text: '收藏',
        iconPath: 'assets/tabbar/favorites.png',
        selectedIconPath: 'assets/tabbar/favorites-active.png'
      },
      { 
        pagePath: 'pages/profile/index', 
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      },
    ],
  },
}
