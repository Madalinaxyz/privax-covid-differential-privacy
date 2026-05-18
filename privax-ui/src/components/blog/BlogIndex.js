import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { privaxApi } from '../misc/PrivaxApi'
import { useAuth } from '../context/AuthContext'
import './blog.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogIndex() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const { getUser } = useAuth()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    privaxApi.getBlogPosts({ size: 50 })
      .then((r) => setPosts(r.data.content || []))
      .catch((e) => console.error('Failed to load blog posts', e))
      .finally(() => setLoading(false))
  }, [])

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
            <Link to="/blog/new" className="blog-btn blog-btn-primary">
              + New post
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="blog-empty">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="blog-empty">No posts yet.</div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <Link to={`/blog/${post.slug}`} key={post.id} className="blog-card">
              <div
                className="blog-card-cover"
                style={{ backgroundImage: `url(${post.coverImage || '/blog-placeholder.svg'})` }}
              />
              <div className="blog-card-body">
                <div className="blog-card-meta">
                  <time>{formatDate(post.publishedAt)}</time>
                  {post.tags && post.tags.length > 0 && (
                    <span className="blog-card-tag">{post.tags[0]}</span>
                  )}
                </div>
                <h2>{post.title}</h2>
                {post.excerpt && <p>{post.excerpt}</p>}
                <span className="blog-card-author">{post.author || '—'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
