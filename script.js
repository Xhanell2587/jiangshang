/* ============================================================
   江上清风 — 动态加载视频与手记
   - 视频清单: ./videos/manifest.json
   - 手记清单: ./notes/manifest.json
   - 手记内容: ./notes/<file>.md
   注：直接以 file:// 打开时，部分浏览器可能阻止本地 fetch。
       建议使用 `python3 -m http.server` 在本目录起一个本地服务。
   ============================================================ */

(function(){
  // ----- Mobile nav toggle -----
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  toggle?.addEventListener('click', () => menu.classList.toggle('open'));
  menu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => menu.classList.remove('open'))
  );

  // ----- Helpers -----
  async function loadJSON(url){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw new Error(res.status);
      return await res.json();
    }catch(e){
      console.warn('加载失败:', url, e);
      return null;
    }
  }

  // ============================================================
   //  Videos
   // ============================================================
  const videoGrid = document.getElementById('videoGrid');

  // Fallback / sample manifest (用于直接打开时的演示)
  const sampleVideos = [
    {
      title: '江上清风（示例）',
      desc: '一段关于山海与晨光的随笔影像。',
      cover: 'https://picsum.photos/seed/video1/640/360',
      src: ''
    },
    {
      title: '夜读札记（示例）',
      desc: '深夜灯下，书页翻动的声音。',
      cover: 'https://picsum.photos/seed/video2/640/360',
      src: ''
    },
    {
      title: '远行手帐（示例）',
      desc: '一程山水，一程心事。',
      cover: 'https://picsum.photos/seed/video3/640/360',
      src: ''
    }
  ];

  function renderVideos(list){
    videoGrid.innerHTML = '';
    list.forEach((v, i) => {
      const card = document.createElement('div');
      card.className = 'video-card';
      const title = v.title || '未命名';
      const initial = title.trim().slice(0, 2);
      const isExternal = /^https?:\/\//i.test(v.src || '') && v.openInPage === false;
      const coverURL = resolveLocalPath(v.cover);

      card.innerHTML = `
        <div class="video-thumb">
          <div class="video-fallback">${escapeHTML(initial)}</div>
          ${coverURL ? `<img class="video-cover" alt="" src="${escapeAttr(coverURL)}">` : ''}
          <div class="video-play">${isExternal ? '↗' : '▶'}</div>
          ${isExternal ? '<div class="video-tag">外链跳转</div>' : ''}
        </div>
        <div class="video-meta">
          <h3 class="video-title">${escapeHTML(title)}</h3>
          <p class="video-desc">${escapeHTML(v.desc || '')}</p>
        </div>`;

      // 封面加载失败 → 隐藏 img，露出 fallback
      const img = card.querySelector('.video-cover');
      if(img) img.addEventListener('error', () => img.remove());

      card.addEventListener('click', () => handleVideoClick(v));
      videoGrid.appendChild(card);
    });
  }

  // ----- Video modal -----
  const modal = document.getElementById('videoModal');
  const modalPlayer = document.getElementById('modalPlayer');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc  = document.getElementById('modalDesc');
  const modalLink  = document.getElementById('modalLink');
  const modalClose = modal.querySelector('.modal-close');
  const modalBackdrop = modal.querySelector('.modal-backdrop');

  // 识别外链平台并返回可嵌入的播放器信息
  function resolveSource(src, explicitType){
    if(!src) return null;
    const s = String(src).trim();

    // 显式 type 优先
    if(explicitType === 'iframe') return { kind:'iframe', url:s, original:s };
    if(explicitType === 'video')  return { kind:'video',  url:s, original:s };

    // YouTube：watch?v=, youtu.be/, /shorts/, /embed/
    let m;
    if((m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/))){
      return { kind:'iframe', url:`https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`, original:s };
    }

    // Bilibili：BV / av / 已是 player 页
    if(/player\.bilibili\.com\/player\.html/.test(s)){
      return { kind:'iframe', url:s, original:s };
    }
    if((m = s.match(/bilibili\.com\/video\/(BV[\w]+)/))){
      const p = new URL(s, location.href);
      const part = p.searchParams.get('p') || '1';
      return {
        kind:'iframe',
        url:`https://player.bilibili.com/player.html?bvid=${m[1]}&page=${part}&autoplay=0&high_quality=1`,
        original:s
      };
    }
    if((m = s.match(/bilibili\.com\/video\/av(\d+)/))){
      return {
        kind:'iframe',
        url:`https://player.bilibili.com/player.html?aid=${m[1]}&autoplay=0&high_quality=1`,
        original:s
      };
    }

    // 微信视频号：channels.weixin.qq.com 是官方嵌入域；
    // weixin.qq.com/sph/... 是分享短链（注意：微信对 iframe 有防盗链，部分场景会被拒绝）
    if(/channels\.weixin\.qq\.com/.test(s) || /weixin\.qq\.com\/sph\//.test(s)){
      return { kind:'iframe', url:s, original:s };
    }

    // 西瓜 / 抖音 / Vimeo 等通用 iframe 嵌入页
    if(/vimeo\.com\/(?:video\/)?(\d+)/.test(s)){
      const id = s.match(/vimeo\.com\/(?:video\/)?(\d+)/)[1];
      return { kind:'iframe', url:`https://player.vimeo.com/video/${id}`, original:s };
    }

    // 看上去是网页链接但不是已知平台 → 仍尝试 iframe
    if(/^https?:\/\//i.test(s) && !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(s)){
      return { kind:'iframe', url:s, original:s };
    }

    // 默认作为本地 / 直链视频文件处理（自动补 videos/ 前缀）
    return { kind:'video', url:resolveLocalPath(s), original:s };
  }

  // 入口：根据 openInPage 决定是弹预览还是直接跳转
  function handleVideoClick(v){
    if(!v.src){
      alert('该视频尚未上传。\n请将视频文件放入 videos/ 文件夹，或在 videos/manifest.json 的 src 中填入外链（B站/油管/视频号等）。');
      return;
    }
    const isURL = /^https?:\/\//i.test(v.src);
    if(isURL && v.openInPage === false){
      window.open(v.src, '_blank', 'noopener');
      return;
    }
    openVideo(v);
  }

  function openVideo(v){
    if(!v.src) return;
    const info = resolveSource(v.src, v.type);
    modalPlayer.innerHTML = '';

    if(info.kind === 'iframe'){
      const iframe = document.createElement('iframe');
      iframe.src = info.url;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer';
      iframe.scrolling = 'no';
      modalPlayer.appendChild(iframe);
    }else{
      const video = document.createElement('video');
      video.src = info.url;
      video.controls = true;
      video.playsInline = true;
      modalPlayer.appendChild(video);
      video.play().catch(()=>{});
    }

    modalTitle.textContent = v.title || '';
    modalDesc.textContent  = v.desc  || '';
    modalLink.innerHTML = /^https?:\/\//i.test(info.original)
      ? `原始链接：<a href="${info.original}" target="_blank" rel="noopener">${escapeHTML(info.original)}</a>`
      : '';
    modal.hidden = false;
  }
  function closeVideo(){
    modalPlayer.innerHTML = ''; // 清空 iframe / video，停止播放
    modal.hidden = true;
  }
  modalClose.addEventListener('click', closeVideo);
  modalBackdrop.addEventListener('click', closeVideo);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeVideo(); });

  // ============================================================
   //  Notes
   // ============================================================
  const noteList = document.getElementById('noteList');
  const noteView = document.getElementById('noteView');

  const sampleNotes = [
    {
      title: '欢迎来到江上清风（示例）',
      date: '2026-05-10',
      file: ''
    }
  ];

  const sampleNoteBody = `# 欢迎来到「江上清风」

这是一篇示例手记。请把你的 \`.md\` 文件放进 \`notes/\` 文件夹，
然后在 \`notes/manifest.json\` 添加一条记录：

\`\`\`json
{ "title": "标题", "date": "2026-05-10", "file": "my-note.md" }
\`\`\`

## 它支持什么

- **加粗**、*斜体*、~~删除线~~
- 列表、引用
- 代码块与行内 \`code\`
- 图片、链接

> 江上之清风，与山间之明月，耳得之而为声，目遇之而成色。
`;

  function renderNoteList(list){
    noteList.innerHTML = '';
    list.forEach((n, i) => {
      const a = document.createElement('div');
      a.className = 'note-item';
      a.innerHTML = `
        <span class="t">${escapeHTML(n.title || '未命名')}</span>
        <span class="d">${escapeHTML(n.date || '')}</span>`;
      a.addEventListener('click', () => {
        document.querySelectorAll('.note-item').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
        loadNote(n);
      });
      noteList.appendChild(a);
    });
  }

  async function loadNote(n){
    if(!n.file){
      noteView.innerHTML = marked.parse(sampleNoteBody);
      renderMathInElement(noteView, { delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]});
      return;
    }
    try{
      const res = await fetch('notes/' + n.file, { cache: 'no-store' });
      if(!res.ok) throw new Error(res.status);
      const md = await res.text();
      noteView.innerHTML = marked.parse(md);
      renderMathInElement(noteView, { delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]});
    }catch(e){
      noteView.innerHTML = `<p class="note-placeholder">加载失败：${escapeHTML(n.file)}</p>`;
    }
  }

  // ============================================================
   //  Init
   // ============================================================
  function showFileProtoTip(){
    if(location.protocol !== 'file:') return;
    const tip = document.createElement('div');
    tip.style.cssText = `
      position:fixed;left:50%;bottom:18px;transform:translateX(-50%);
      background:#3a2a12;color:#ffd98a;border:1px solid #d6b56a;
      padding:10px 16px;border-radius:8px;font-size:.85rem;z-index:99;
      max-width:92%;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.4)`;
    tip.innerHTML = '当前以 <code>file://</code> 打开，浏览器禁止读取本地 JSON。<br/>请在本目录运行 <code>python3 -m http.server 8000</code> 后访问 <code>http://localhost:8000</code>。';
    document.body.appendChild(tip);
  }

  (async function init(){
    showFileProtoTip();

    const videos = await loadJSON('videos/manifest.json');
    renderVideos(videos && videos.length ? videos : sampleVideos);

    const notes = await loadJSON('notes/manifest.json');
    renderNoteList(notes && notes.length ? notes : sampleNotes);
  })();

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
  }
  function escapeAttr(s){ return escapeHTML(s); }

  // 相对路径自动加 videos/ 前缀（封面 / 本地视频文件名）
  function resolveLocalPath(p){
    if(!p) return '';
    if(/^https?:\/\//i.test(p) || p.startsWith('/') || p.startsWith('data:')) return p;
    if(p.startsWith('videos/') || p.startsWith('./')) return p;
    return 'videos/' + p;
  }
})();
