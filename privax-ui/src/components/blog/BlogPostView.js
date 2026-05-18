import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { privaxApi } from '../misc/PrivaxApi'
import { useAuth } from '../context/AuthContext'
import './blog.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readingTime(content) {
  if (!content) return '1 min'
  const words = content.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 220))
  return `${minutes} min read`
}

export default function BlogPostView() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getUser } = useAuth()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    setLoading(true)
    privaxApi.getBlogPost(slug)
      .then((r) => setPost(r.data))
      .catch((e) => {
        console.error(e)
        setError('Post not found.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handleDelete = async () => {
    if (!post) return
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    try {
      await privaxApi.deleteBlogPost(post.id)
      navigate('/blog')
    } catch (e) {
      console.error('Delete failed', e)
      alert('Failed to delete the post.')
    }
  }

  if (loading) {
    return <div className="blog-page"><div className="blog-empty">Loading…</div></div>
  }
  if (error || !post) {
    return (
      <div className="blog-page">
        <div className="blog-empty">{error || 'Post not found.'}</div>
        <Link to="/blog" className="blog-back">← Back to all posts</Link>
      </div>
    )
  }

  return (
    <article className="blog-article-page">
      <div className="blog-article-top">
        <Link to="/blog" className="blog-back">← Back to all posts</Link>
        {isAdmin && (
          <div className="blog-admin-inline">
            <Link to={`/blog/${post.slug}/edit`} className="blog-btn blog-btn-ghost">Edit</Link>
            <button onClick={handleDelete} className="blog-btn blog-btn-danger">Delete</button>
          </div>
        )}
      </div>

      <div
        className="blog-cover-hero"
        style={{ backgroundImage: `url(${post.coverImage || '/blog-placeholder.svg'})` }}
      />

      <header className="blog-article-header">
        <div className="blog-article-meta">
          <time>{formatDate(post.publishedAt)}</time>
          <span className="blog-meta-dot">·</span>
          <span>{readingTime(post.content)}</span>
          {post.tags && post.tags.map((t) => (
            <span key={t} className="blog-card-tag">{t}</span>
          ))}
        </div>
        <h1 className="blog-article-title">{post.title}</h1>
        {post.excerpt && <p className="blog-lead">{post.excerpt}</p>}
        {post.author && <p className="blog-byline">By <strong>{post.author}</strong></p>}
      </header>

      <div className="blog-content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  )
}
