async function loadPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(display_name, avatar_url)')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error(error); return []; }
  return data;
}

async function createPost(content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to post.');
  const { error } = await supabase.from('posts').insert({ author_id: user.id, content });
  if (error) throw error;
}

async function loadComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return []; }
  return data;
}

async function createComment(postId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to comment.');
  const { error } = await supabase.from('comments').insert({ post_id: postId, author_id: user.id, content });
  if (error) throw error;
}

function renderPostCard(post) {
  const name = post.profiles?.display_name || 'Member';
  const date = new Date(post.created_at).toLocaleDateString();
  const div = document.createElement('div');
  div.className = 'card post-card';
  div.innerHTML = `
    ${post.pinned ? '<p class="pinned-tag">📌 Pinned</p>' : ''}
    <p class="post-meta"><strong>${name}</strong> · ${date}</p>
    <p class="post-content">${post.content.replace(/</g, '&lt;')}</p>
    <button class="btn btn-ghost comment-toggle" data-post="${post.id}">💬 Comments</button>
    <div class="comments-block" id="comments-${post.id}" style="display:none; margin-top:14px;"></div>
  `;
  return div;
}

async function initFeed(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '<p style="color:var(--text-mid)">Loading posts…</p>';
  const posts = await loadPosts();
  container.innerHTML = '';
  if (posts.length === 0) {
    container.innerHTML = '<p style="color:var(--text-mid)">No posts yet — be the first to share something.</p>';
    return;
  }
  posts.forEach(post => container.appendChild(renderPostCard(post)));

  container.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('comment-toggle')) return;
    const postId = e.target.dataset.post;
    const block = document.getElementById(`comments-${postId}`);
    if (block.style.display === 'none') {
      block.style.display = 'block';
      block.innerHTML = 'Loading comments…';
      const comments = await loadComments(postId);
      block.innerHTML = comments.map(c => `
        <p style="font-size:0.88rem; color:var(--text-mid); margin:8px 0;">
          <strong style="color:var(--text-hi);">${c.profiles?.display_name || 'Member'}:</strong> ${c.content.replace(/</g,'&lt;')}
        </p>`).join('') || '<p style="color:var(--text-low); font-size:0.85rem;">No comments yet.</p>';
      block.innerHTML += `
        <form class="comment-form" data-post="${postId}" style="display:flex; gap:8px; margin-top:10px;">
          <input placeholder="Write a comment…" required style="flex:1;" />
          <button class="btn btn-primary" type="submit">Post</button>
        </form>`;
    } else {
      block.style.display = 'none';
    }
  });

  container.addEventListener('submit', async (e) => {
    if (!e.target.classList.contains('comment-form')) return;
    e.preventDefault();
    const postId = e.target.dataset.post;
    const input = e.target.querySelector('input');
    try {
      await createComment(postId, input.value);
      input.value = '';
      e.target.previousElementSibling?.remove();
      document.getElementById(`comments-${postId}`).style.display = 'none';
      document.querySelector(`.comment-toggle[data-post="${postId}"]`).click();
    } catch (err) {
      alert(err.message);
    }
  });
      }
