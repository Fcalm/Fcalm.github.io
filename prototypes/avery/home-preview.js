'use strict';

// 仅锁定首页原型内部的手动滚动。滚轮与触屏手势沿浏览器原生滚动链交给首页，
// 避免把 iframe 的事件坐标重新当成页面滚动距离，放大实际滚动速度。
if (window.parent !== window && new URLSearchParams(location.search).get('embed') === 'home') {
  const style = document.createElement('style');
  style.textContent = 'html,body,.scroll,.panel-scroll,textarea{overflow:hidden!important;scrollbar-width:none!important;overscroll-behavior:auto!important}*::-webkit-scrollbar{display:none!important}';
  document.head.append(style);
}
