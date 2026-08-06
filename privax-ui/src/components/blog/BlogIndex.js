import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { privaxApi } from '../misc/PrivaxApi'
import { useAuth } from '../context/AuthContext'
import './blog.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readingTime(content) {
  if (!content) return '1 min read'
  const words = content.trim().split(/\s+/).length
  return `${Math.max(1, Math.round(words / 220))} min read`
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const { getUser } = useAuth()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    privaxApi.getBlogPosts({ size: 100 })
      .then((r) => setPosts(r.data.content || []))
      .catch((e) => console.error('Failed to load blog posts', e))
      .finally(() => setLoading(false))
  }, [])

  // All unique tags, most common first.
  const allTags = useMemo(() => {
    const counts = {}
    posts.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])
  }, [posts])

  const isFiltering = query.trim() !== '' || activeTag !== null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      const matchesTag = !activeTag || (p.tags || []).includes(activeTag)
      if (!matchesTag) return false
      if (!q) return true
      const haystack = [p.title, p.excerpt, p.author, ...(p.tags || [])].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [posts, query, activeTag])

  // Newest post is the hero; only shown when the reader isn't filtering.
  const featured = !isFiltering && posts.length > 0 ? posts[0] : null
  const gridPosts = featured ? filtered.filter((p) => p.id !== featured.id) : filtered

  return (
    <div className="blog-page">
      <div className="blog-header">
        <div className="blog-header-left">
          <span className="blog-eyebrow">The Privax Journal</span>
          <h1 className="blog-title">Stories</h1>
        </div>
        <p className="blog-sub">
          Personal essays, data insights, and platform notes — for everyone who's been heard,
          and everyone who hasn't yet.
        </p>
        {isAdmin && (
          <div className="blog-admin-actions">
            <Link to="/blog/new" className="blog-btn blog-btn-primary">+ New post</Link>
          </div>
        )}
      </div>

      {/* Search + tag filters */}
      {!loading && posts.length > 0 && (
        <div className="blog-toolbar">
          <div className="blog-search">
            <svg className="blog-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories…"
              aria-label="Search stories"
            />
            {query && (
              <button className="blog-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
            )}
          </div>
          <div className="blog-tags-bar">
            <button
              className={`blog-tag-chip ${activeTag === null ? 'is-active' : ''}`}
              onClick={() => setActiveTag(null)}
            >All</button>
            {allTags.map((t) => (
              <button
                key={t}
                className={`blog-tag-chip ${activeTag === t ? 'is-active' : ''}`}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >{t}</button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="blog-empty">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="blog-empty">No posts yet.</div>
      ) : (
        <>
          {/* Featured hero */}
          {featured && (
            <Link to={`/blog/${featured.slug}`} className="blog-featured">
              <div
                className="blog-featured-cover"
                style={{ backgroundImage: `url(${featured.coverImage || '/blog-placeholder.svg'})` }}
              />
              <div className="blog-featured-body">
                <span className="blog-featured-badge">Latest</span>
                <div className="blog-card-meta">
                  <time>{formatDate(featured.publishedAt)}</time>
                  <span className="blog-meta-dot">·</span>
                  <span>{readingTime(featured.content)}</span>
                </div>
                <h2>{featured.title}</h2>
                {featured.excerpt && <p>{featured.excerpt}</p>}
                <div className="blog-featured-foot">
                  <span className="blog-card-author">{featured.author || '—'}</span>
                  <span className="blog-featured-cta">Read →</span>
                </div>
              </div>
            </Link>
          )}

          {isFiltering && (
            <div className="blog-result-count">
              {gridPosts.length === 0
                ? 'No stories match your search.'
                : `${gridPosts.length} ${gridPosts.length === 1 ? 'story' : 'stories'}`}
              {activeTag && <> tagged <strong>{activeTag}</strong></>}
              {query && <> matching “<strong>{query}</strong>”</>}
            </div>
          )}

          <div className="blog-grid">
            {gridPosts.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card">
                <div
                  className="blog-card-cover"
                  style={{ backgroundImage: `url(${post.coverImage || '/blog-placeholder.svg'})` }}
                />
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <time>{formatDate(post.publishedAt)}</time>
                    <span className="blog-meta-dot">·</span>
                    <span>{readingTime(post.content)}</span>
                  </div>
                  <h2>{post.title}</h2>
                  {post.excerpt && <p>{post.excerpt}</p>}
                  <div className="blog-card-foot">
                    <span className="blog-card-author">{post.author || '—'}</span>
                    {post.tags && post.tags.length > 0 && (
                      <span className="blog-card-tag">{post.tags[0]}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
