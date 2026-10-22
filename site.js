'use strict';
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const navIndicator = document.createElement('span');
navIndicator.className = 'nav-indicator';
navIndicator.setAttribute('aria-hidden', 'true');
navigation?.append(navIndicator);
let activeNavLink = navigation?.querySelector('a[aria-current]');
function updateNavIndicator() {
  if (!navigation || !activeNavLink || !navigation.getClientRects().length) {
    navIndicator.style.opacity = '0';
    return;
  }
  // 依据文字本身定位，避免手机菜单的整行宽度改变下划线中心。
  const text = document.createRange();
  text.selectNodeContents(activeNavLink);
  const label = text.getBoundingClientRect();
  const nav = navigation.getBoundingClientRect();
  navIndicator.style.transform = `translate3d(${label.left + label.width / 2 - nav.left - 12}px, ${label.bottom - nav.top + 4}px, 0)`;
  navIndicator.style.opacity = '1';
}
function selectNav(link, current = 'location') {
  if (!link) return;
  navigation.querySelectorAll('a').forEach(item => {
    if (item === link) item.setAttribute('aria-current', current);
    else item.removeAttribute('aria-current');
  });
  activeNavLink = link;
  updateNavIndicator();
}
function closeMenu() { menu?.setAttribute('aria-expanded', 'false'); navigation?.classList.remove('open'); requestAnimationFrame(updateNavIndicator); }
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
  requestAnimationFrame(updateNavIndicator);
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });

if (navigation) {
  updateNavIndicator();
  requestAnimationFrame(() => navIndicator.classList.add('is-ready'));
  new ResizeObserver(updateNavIndicator).observe(navigation);
  document.fonts?.ready.then(updateNavIndicator);
  const homeSections = document.querySelector('#selected') && document.querySelector('#about');
  if (homeSections) {
    const sectionLinks = [
      [document.querySelector('.personal-hero'), navigation.querySelector('a[href="index.html"]')],
      [document.querySelector('#selected'), navigation.querySelector('a[href="index.html#selected"]')],
      [document.querySelector('#capabilities'), navigation.querySelector('a[href="index.html#capabilities"]')],
      [document.querySelector('#about'), navigation.querySelector('a[href="index.html#about"]')],
      [document.querySelector('#contact'), navigation.querySelector('a[href="index.html#contact"]')]
    ].filter(([section, link]) => section && link);
    function selectVisibleSection() {
      const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
      const activationLine = Math.max(headerBottom + 16, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
      let current = sectionLinks[0];
      for (const entry of sectionLinks) if (entry[0].getBoundingClientRect().top <= activationLine + 4) current = entry;
      // 页脚无法滚到顶部时，在接近页底才选中，避免提前覆盖“关于我”。
      const contact = sectionLinks.at(-1);
      const rect = contact[0].getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom <= innerHeight + 4) current = contact;
      selectNav(current[1], current === sectionLinks[0] ? 'page' : 'location');
    }
    let sectionObserver;
    function observeSections() {
      sectionObserver?.disconnect();
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const activationLine = Math.min(innerHeight - 2, Math.max(headerHeight + 16, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0));
      sectionObserver = new IntersectionObserver(selectVisibleSection, {
        rootMargin: `-${activationLine}px 0px -${Math.max(0, innerHeight - activationLine - 2)}px 0px`, threshold: 0
      });
      sectionLinks.forEach(([section]) => sectionObserver.observe(section));
      selectVisibleSection();
    }
    new ResizeObserver(observeSections).observe(document.documentElement);
    new IntersectionObserver(selectVisibleSection, { threshold: [0, .25, .5, .75, .99, 1] }).observe(document.querySelector('#contact'));
    window.addEventListener('hashchange', selectVisibleSection);
    window.addEventListener('resize', observeSections);
    observeSections();
  }
}
const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.dataset.copy); toast.textContent = '邮箱已复制'; }
  catch { toast.textContent = '请手动复制邮箱：' + button.dataset.copy; }
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}));
const imageDialog = document.querySelector('.image-dialog');
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  imageDialog.querySelector('img').src = button.dataset.image;
  imageDialog.querySelector('img').alt = button.querySelector('img').alt;
  imageDialog.querySelector('p').textContent = button.closest('figure').querySelector('figcaption').textContent;
  imageDialog.showModal();
}));
imageDialog?.querySelector('.dialog-close').addEventListener('click', () => imageDialog.close());
imageDialog?.addEventListener('click', event => { if (event.target === imageDialog) {
  const bounds = imageDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageDialog.close();
} });
const filterButtons = document.querySelectorAll('[data-filter]');
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  document.querySelectorAll('[data-category]').forEach(row => { row.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== row.dataset.category; });
}));
const skills = {
  resume: {
    title: '用已确认的经历，改写目标岗位简历。',
    desc: '用户希望按 JD 优化简历时触发。先读取简历、档案和岗位要求，再判断哪些信息可以调整、哪些必须确认。',
    input: '目标岗位 JD、当前简历、已确认的个人档案',
    flow: '区分事实与表达 → 调整相关内容 → 列出待确认项 → 按场景权限保存',
    boundary: '不编造公司、证书或经历；未确认的硬事实不能直接写入正式材料。',
    done: '写入必须有明确意图，保存成功以工具回执为证据。',
    value: '将“生成质量”拆成事实、表达和授权三个问题，让用户在需要判断的节点参与。',
    source: 'resume-tailoring.md'
  },
  discovery: {
    title: '先确认搜索目标，再比较岗位机会。',
    desc: '用户要求发现、筛选或比较公开岗位时触发，将模糊的“帮我找工作”转化为有条件的搜索与比较。',
    input: '目标岗位、城市和其他筛选条件，以及实际可见的岗位页面',
    flow: '明确需求 → 浏览公开岗位 → 提取职位事实 → 按要求比较 → 保留来源',
    boundary: '岗位发现与申请是不同的任务；发现岗位不等于获准上传简历或提交申请。',
    done: '输出可比较的岗位信息，并保留可以核对的来源链接。',
    value: '拆开信息获取与外部行动，避免用户的一次搜索意图被扩大为投递授权。',
    source: 'job-discovery.md'
  },
  form: {
    title: '填写表单之前，先确认目标与资料。',
    desc: '面向企业招聘官网与 ATS 的申请表单；BOSS 招呼与聊天属于其他工作流。优先批量填表，再校验和修复剩余字段。',
    input: '明确的公司与岗位、已授权档案、绑定的简历与允许上传的文件',
    flow: '核对目标与历史记录 → 批量填写 → 校验缺项 → 按权限提交 → 验证结果',
    boundary: '不猜测缺失事实，不绕过登录或验证码；结果未知时停止，避免重复提交。',
    done: '仅在获得有效回执或明确页面成功状态后，记录申请成功。',
    value: '为高风险外部操作定义授权、幂等和成功判据，让任务结束状态可验证。',
    source: 'company-career-form.md'
  }
};
const skillTabs = [...document.querySelectorAll('[data-skill]')];
function activateSkill(tab) {
  skillTabs.forEach(item => { const active = item === tab; item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1; });
  const data = skills[tab.dataset.skill];
  for (const key of ['title', 'desc', 'input', 'flow', 'boundary', 'done', 'value']) document.querySelector('[data-skill-' + key + ']').textContent = data[key];
  document.querySelector('[data-skill-source]').href = 'assets/skills/' + data.source;
  document.querySelector('#skill-panel').setAttribute('aria-labelledby', tab.id);
}
skillTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateSkill(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % skillTabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + skillTabs.length - 1) % skillTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = skillTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); activateSkill(skillTabs[next]); skillTabs[next].focus(); }
  });
});
const scenarios = {
  avery: {
    resume: [
      ['确认目标', '用户希望根据 AI 产品经理 JD 优化简历。先读取目标要求、当前简历和已确认档案。'],
      ['判断资料是否充分', '示例档案包含项目经历与职责，可据此调整表达；不新增未经确认的业绩数字。'],
      ['提出调整方案', '突出问题定义、方案取舍和评测设计，生成待审核草稿。此时尚未写入简历。'],
      ['等待保存意图', '真实产品中，只有在用户要求保存、场景允许且满足确认策略时，才调用写工具。'],
      ['用回执核对结果', '模拟到此结束。真实流程应核对保存回执；本页没有修改任何简历。']
    ],
    missing: [
      ['读取现有档案', '目标要求突出用户增长，但示例档案只有功能开发记录，没有真实用户规模和增长数据。'],
      ['识别硬事实缺口', '“用户增长 30%”不是措辞优化，而是需要事实依据的成果声明。'],
      ['交给用户补充', '询问是否有真实试用人数、记录周期或增长基线；没有就保留定性描述。'],
      ['安全结束', '缺少依据时，不把增长数据写入简历。完成的是澄清和草稿准备，而不是虚构成果。']
    ],
    apply: [
      ['核对目标与历史', '确认公司和岗位与请求一致，检查是否已经投递，避免重复提交。'],
      ['填写并校验', '使用授权档案填写，核对简历与附件。缺失事实集中询问，不选择猜测值。'],
      ['进入确认节点', '根据当前权限，展示或请求确认关键操作。验证码、登录和敏感授权交给用户。'],
      ['检查执行证据', '假设页面返回“状态未知”：不能记录投递成功，也不能再次点击提交。'],
      ['交由用户核实', '停止自动操作，请用户检查真实结果。模拟结束，本页没有访问任何招聘网站。']
    ]
  },
  rag: {
    clear: [
      ['理解问题', '用户询问报销材料，意图明确，先检索现有差旅制度。'],
      ['召回与精排', '虚构示例：制度说明报销需提交发票、行程单和审批记录。'],
      ['验证证据', '材料条款直接回答了问题，证据充分，无需改写或重复检索。'],
      ['回答并附来源', '示例回答：需提交发票、行程单和审批记录。来源：虚构《差旅制度》第 3 节。']
    ],
    ambiguous: [
      ['识别歧义', '“补贴”可能指餐补、交通补贴或差旅补贴，问题没有给出必要范围。'],
      ['避免擅自选题', '即使检索到了差旅制度，也不能假设用户问的就是差旅补贴。'],
      ['请求澄清', '您想了解哪一类补贴，以及哪个地区或适用群体的标准？'],
      ['等待补充信息', '在得到明确范围前不输出具体金额。模拟结束，真实系统应继续处理用户回复。']
    ],
    insufficient: [
      ['检索现有制度', '虚构示例：只找到当年差旅补贴标准，没有下一年度的调整公告。'],
      ['判断证据不足', '当年的标准不能支持“明年会提高”的结论。'],
      ['有限重检索', '换一种表达检索下一年度调整计划，仅重试一次，仍无足够证据。'],
      ['停止并说明缺口', '当前资料没有下一年度调整信息，无法判断是否提高。建议补充正式公告。']
    ]
  }
};
document.querySelectorAll('[data-demo]').forEach(demo => {
  const select = demo.querySelector('select');
  const log = demo.querySelector('.demo-log');
  const nextButton = demo.querySelector('[data-demo-next]');
  const hint = demo.querySelector('.demo-hint');
  const progress = demo.querySelector('[data-demo-progress]');
  let step = 0;
  function reset() {
    step = 0;
    log.replaceChildren();
    nextButton.disabled = false;
    nextButton.textContent = '开始演示';
    hint.hidden = false;
    progress.textContent = '准备就绪';
  }
  select.addEventListener('change', reset);
  demo.querySelector('[data-demo-reset]').addEventListener('click', reset);
  nextButton.addEventListener('click', () => {
    const script = scenarios[demo.dataset.demo][select.value];
    if (step >= script.length) return;
    hint.hidden = true;
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const description = document.createElement('p');
    title.textContent = script[step][0];
    description.textContent = script[step][1];
    item.append(title, description);
    log.append(item);
    step += 1;
    progress.textContent = step + ' / ' + script.length;
    const complete = step === script.length;
    nextButton.textContent = complete ? '演示已结束' : '下一步';
    nextButton.disabled = complete;
    if (complete) progress.textContent += ' · 模拟完成';
    item.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  });
});
const caseLinks = [...document.querySelectorAll('.case-nav a')];
const caseMenu = document.querySelector('.case-nav-toggle');
const caseDirectory = document.querySelector('#case-directory');
function closeCaseMenu() {
  caseMenu?.setAttribute('aria-expanded', 'false');
  caseDirectory?.classList.remove('open');
}
caseMenu?.addEventListener('click', () => {
  const open = caseMenu.getAttribute('aria-expanded') !== 'true';
  caseMenu.setAttribute('aria-expanded', String(open));
  caseDirectory.classList.toggle('open', open);
});
caseDirectory?.addEventListener('click', event => { if (event.target.closest('a')) closeCaseMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && caseMenu?.getAttribute('aria-expanded') === 'true') {
    closeCaseMenu();
    caseMenu.focus();
  }
});
// 原型使用独立页面，桌面按完整画布等比展示，手机采用原型自身的响应式布局。
document.querySelectorAll('.prototype-viewer').forEach(viewer => {
  const viewport = viewer.querySelector('.prototype-viewport');
  const frame = viewer.querySelector('iframe');
  const button = viewer.querySelector('[data-prototype-fullscreen]');
  function fitPrototype() {
    const full = document.fullscreenElement === viewer;
    const width = viewport.clientWidth;
    const homePreview = viewer.classList.contains('home-prototype');
    const mobile = homePreview ? window.innerWidth <= 760 : width < 760;
    viewport.style.minHeight = mobile && !full ? '660px' : '';
    const height = viewport.clientHeight;
    const baseWidth = mobile ? width : Number(viewer.dataset.canvasWidth || 1280);
    const baseHeight = mobile ? height : Number(viewer.dataset.canvasHeight || 800);
    const scale = mobile ? 1 : Math.min(width / baseWidth, height / baseHeight);
    frame.style.width = baseWidth + 'px';
    frame.style.height = baseHeight + 'px';
    frame.style.transform = full ? `translate(-50%, -50%) scale(${scale})` : `scale(${scale})`;
    if (button) button.textContent = full ? '退出全屏' : '全屏展示';
  }
  new ResizeObserver(fitPrototype).observe(viewport);
  document.addEventListener('fullscreenchange', fitPrototype);
  button?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === viewer) await document.exitFullscreen();
      else await viewer.requestFullscreen();
    } catch {
      toast.textContent = '当前浏览器无法全屏，可直接观看下方展示，或使用独立入口体验完整原型。';
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
    }
  });
  fitPrototype();
});
if (caseLinks.length && 'IntersectionObserver' in window) {
  caseLinks[0].classList.add('active');
  caseLinks[0].setAttribute('aria-current', 'location');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      caseLinks.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-150px 0px -55% 0px' });
  document.querySelectorAll('.case-section[id]').forEach(section => observer.observe(section));
}

// 只有新段落进入焦点且旧段落完全淡出后才换图；向上滚动同样适用。
document.querySelectorAll('[data-app-flow]').forEach(flow => {
  const section = flow.closest('.app-walkthrough');
  const heading = section.querySelector(':scope > .section-heading');
  const steps = [...flow.querySelectorAll('[data-flow-step]')];
  const copies = steps.map(step => step.querySelector('.app-flow-copy'));
  const frames = [...flow.querySelectorAll('[data-flow-frame]')];
  const desktop = matchMedia('(min-width: 961px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let pending = false;
  function selectFrame(index) {
    if (index === current) return;
    frames.forEach((frame, i) => {
      const active = i === index;
      frame.classList.toggle('is-current', active);
      frame.setAttribute('aria-hidden', String(!active));
      frame.querySelector('button').tabIndex = active ? 0 : -1;
    });
    current = index;
    flow.dataset.activeScene = String(index);
  }
  function updateFlow() {
    pending = false;
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const headingHeight = heading.getBoundingClientRect().height;
    section.style.setProperty('--flow-header-top', `${headerBottom}px`);
    section.style.setProperty('--flow-heading-height', `${headingHeight}px`);
    const enabled = desktop.matches && !reducedMotion.matches;
    flow.classList.toggle('is-enhanced', enabled);
    if (!enabled) {
      copies.forEach(copy => copy.style.removeProperty('opacity'));
      return;
    }
    // 吸顶标题占用视口顶部，内容焦点以标题下方的实际阅读区域为准。
    const contentTop = headerBottom + headingHeight;
    const usableHeight = Math.max(1, innerHeight - contentTop);
    const focusLine = contentTop + usableHeight / 2;
    const focused = [];
    copies.forEach((copy, i) => {
      const rect = steps[i].getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - focusLine) / usableHeight;
      const opacity = Math.max(0, Math.min(1, (.32 - distance) / .20));
      copy.style.opacity = String(opacity);
      if (opacity >= .999) focused.push(i);
    });
    if (focused.length && Number(copies[current].style.opacity) === 0) selectFrame(focused[0]);
  }
  function scheduleUpdate() {
    if (!pending) { pending = true; requestAnimationFrame(updateFlow); }
  }
  flow.dataset.activeScene = '0';
  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate);
  desktop.addEventListener('change', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  document.fonts?.ready.then(scheduleUpdate);
  new ResizeObserver(scheduleUpdate).observe(flow);
  new ResizeObserver(scheduleUpdate).observe(heading);
  updateFlow();
});

// 线条只在页脚可见时绘制，离开视口即暂停。
const contactFooter = document.querySelector('footer#contact');
if (contactFooter) {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      contactFooter.classList.toggle('is-in-view', entries[0].isIntersecting);
    }, { threshold: 0 }).observe(contactFooter);
  } else contactFooter.classList.add('is-in-view');
}
