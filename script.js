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
      card.innerHTML = `
        <div class="video-thumb" style="background-image:url('${v.cover || ''}')">
          <div class="video-play">▶</div>
        </div>
        <div class="video-meta">
          <h3 class="video-title">${escapeHTML(v.title || '未命名')}</h3>
          <p class="video-desc">${escapeHTML(v.desc || '')}</p>
        </div>`;
      card.addEventListener('click', () => openVideo(v));
      videoGrid.appendChild(card);
    });
  }

  // ----- Video modal -----
  const modal = document.getElementById('videoModal');
  const modalVideo = document.getElementById('modalVideo');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc  = document.getElementById('modalDesc');
  const modalClose = modal.querySelector('.modal-close');
  const modalBackdrop = modal.querySelector('.modal-backdrop');

  function openVideo(v){
    if(!v.src){
      alert('该视频尚未上传。\n请将视频文件放入 videos/ 文件夹，并在 videos/manifest.json 中填写 src 字段。');
      return;
    }
    modalVideo.src = v.src;
    modalTitle.textContent = v.title || '';
    modalDesc.textContent = v.desc || '';
    modal.hidden = false;
    modalVideo.play().catch(()=>{});
  }
  function closeVideo(){
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
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
      return;
    }
    try{
      const res = await fetch('notes/' + n.file, { cache: 'no-store' });
      if(!res.ok) throw new Error(res.status);
      const md = await res.text();
      noteView.innerHTML = marked.parse(md);
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
})();
