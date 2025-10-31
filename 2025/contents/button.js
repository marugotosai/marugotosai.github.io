(() => {
  // ===== 設定 =====
  const BREAKPOINT = 880; // これ以上の幅はPC挙動（遷移させず差し替え）。変更可。
  const selectorThumbs = 'a.thumb-item';           // カードのセレクタ（複数可）
  const selectorBlock  = '.contents-list-outer.desktop'; // 差し替え先のコンテナ

  // 差し替え先の要素（あなたのHTMLに合わせてセレクタはこのままでOK）
  const els = {
    block: document.querySelector(selectorBlock),
    image: document.querySelector(`${selectorBlock} .contents-list-outer-image`),
    title: document.querySelector(`${selectorBlock} .contents-list-outer-title`),
    type:  document.querySelector(`${selectorBlock} .type`),
    place: document.querySelector(`${selectorBlock} .place`),
    time:  document.querySelector(`${selectorBlock} .time`),
    desc:  document.querySelector(`${selectorBlock} .contents-list-outer-description`)
  };

  // 画像先読みしてから反映（チラつき防止）
  const preload = (src) => new Promise((resolve, reject) => {
    if (!src) { resolve(); return; }
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // 失敗してもとりあえず進める
    img.src = src;
  });

  // 現在選択の管理
  const thumbs = Array.from(document.querySelectorAll(selectorThumbs));
  let currentEl = null;

  // PC判定
  const isDesktop = () => window.innerWidth >= BREAKPOINT;

  // 差し替え本体
  async function applyFromThumb(el, pushHash = true) {
    if (!el || !els.block) return;

    // data属性を取得（HTML側で持っているものを利用）
    const id    = el.dataset.id    || el.id || '';
    const title = el.dataset.title || el.querySelector('.thumb-item-title')?.textContent?.trim() || '';
    const type  = el.dataset.type  || '';
    const place = el.dataset.place || '';
    const time  = el.dataset.time  || '';
    const desc  = el.dataset.description || ''; // <br> を活かすため innerHTML で入れる
    const thumb = el.dataset.thumb || el.querySelector('img')?.getAttribute('src') || '';

    // 見た目のアクティブ状態
    if (currentEl) currentEl.classList.remove('is-active');
    el.classList.add('is-active');
    currentEl = el;
    el.setAttribute('aria-current', 'true');

    // 右ブロックに反映（フェード）
    els.block.classList.add('loading');
    await preload(thumb);

    if (els.image) {
      els.image.src = thumb || '';
      els.image.alt = title || '';
    }
    if (els.title) els.title.textContent = title || '';
    if (els.type)  els.type.textContent  = type  || '';
    if (els.place) els.place.textContent = place || '';
    if (els.time)  els.time.textContent  = time  || '';
    if (els.desc)  els.desc.innerHTML    = desc  || '';

    // URL共有用にハッシュだけ更新（PC時）
    if (pushHash && id && isDesktop()) {
      // 既存のクエリ等は保ったまま #id だけ付け替え
      const url = new URL(window.location.href);
      url.hash = id;
      history.replaceState(null, '', url);
    }

    // フェード解除
    requestAnimationFrame(() => els.block.classList.remove('loading'));
  }

  // クリック/キーボード挙動
  thumbs.forEach((a) => {
    // Spaceキーでのアクション（アンカーはEnterのみ既定なので補助）
    a.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        a.click();
      }
    });

    a.addEventListener('click', (e) => {
      // PCでは遷移させず、その場で差し替え（js-no-nav が付いている時のみ）
      const blockNav = a.classList.contains('js-no-nav') && isDesktop();
      if (blockNav) {
        e.preventDefault();
        applyFromThumb(a, true);
      } else {
        // モバイル等は通常遷移（/assets/... へ）
        // ただし「モーダル開きたい」など別挙動にしたい時はここで分岐可能
      }
    });
  });

  // 初期表示：URL #id があればそれを選択、無ければ最初の要素や is-active を選択
  function initFromHash() {
    const id = location.hash.replace('#','');
    let target = null;
    if (id) target = thumbs.find(t => (t.dataset.id || t.id) === id);
    if (!target) target = document.querySelector(`${selectorThumbs}.is-active`) || thumbs[0];
    if (isDesktop()) applyFromThumb(target, false);
  }
  window.addEventListener('resize', () => {
    // 画面幅の切り替え時、PCになったらその場で右ブロックを同期
    if (isDesktop() && currentEl) applyFromThumb(currentEl, false);
  });
  window.addEventListener('hashchange', () => {
    // ハッシュ直打ちでPC表示に反映（モバイル時は無視してOK）
    if (isDesktop()) initFromHash();
  });

  initFromHash();
})();
