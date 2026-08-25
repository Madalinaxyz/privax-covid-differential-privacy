import React, { useEffect, useMemo, useState } from 'react'
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
  return `${Math.max(1, Math.round(words / 220))} min read`
}

// Stable slug for a heading, shared between the TOC and the rendered heading id.
function slugifyHeading(text) {
  return String(text).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Flatten ReactMarkdown children (strings / elements) into plain text.
function nodeText(children) {
  return React.Children.toArray(children)
    .map((c) => (typeof c === 'string' ? c : c?.props?.children ? nodeText(c.props.children) : ''))
    .join('')
}

export default function BlogPostView() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const { getUser } = useAuth()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    setLoading(true)
    setError(null)
    privaxApi.getBlogPost(slug)
      .then((r) => {
        setPost(r.data)
        // Related posts: share at least one tag, most shared first, max 3.
        const tags = new Set(r.data.tags || [])
        privaxApi.getBlogPosts({ size: 100 })
          .then((list) => {
            const others = (list.data.content || [])
              .filter((p) => p.slug !== r.data.slug)
              .map((p) => ({ p, shared: (p.tags || []).filter((t) => tags.has(t)).length }))
              .filter((x) => x.shared > 0)
              .sort((a, b) => b.shared - a.shared)
              .slice(0, 3)
              .map((x) => x.p)
            setRelated(others)
          })
          .catch(() => setRelated([]))
      })
      .catch((e) => {
        console.error(e)
        setError('Post not found.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  // Reading-progress bar.
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const scrolled = h.scrollTop
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? Math.min(100, (scrolled / max) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [post])

  // Build a table of contents from the h2/h3 headings in the markdown.
  const toc = useMemo(() => {
    if (!post?.content) return []
    const out = []
    post.content.split('\n').forEach((line) => {
      const m = /^(##|###)\s+(.*)$/.exec(line.trim())
      if (m) {
        const text = m[2].trim()
        out.push({ level: m[1].length, text, id: slugifyHeading(text) })
      }
    })
    return out
  }, [post])

  const mdComponents = useMemo(() => ({
    h2: ({ children }) => <h2 id={slugifyHeading(nodeText(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugifyHeading(nodeText(children))}>{children}</h3>,
  }), [])

  // The article header already renders post.title as the page <h1>. Many posts also
  // begin their markdown body with a "# Title" line, which would duplicate the title
  // and produce a second <h1>. Strip a single leading top-level heading (section
  // headings in these posts are all ## / ###, so a body # is always that duplicate).
  const bodyContent = useMemo(() => {
    if (!post?.content) return ''
    return post.content.replace(/^\s*#\s+.*(?:\r?\n|$)/, '')
  }, [post])

  const goTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
    <>
      <div className="blog-progress" style={{ width: `${progress}%` }} />

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

        <div className="blog-article-layout">
          {toc.length > 1 && (
            <aside className="blog-toc" aria-label="Table of contents">
              <span className="blog-toc-title">On this page</span>
              <ul>
                {toc.map((h, i) => (
                  <li key={i} className={h.level === 3 ? 'blog-toc-sub' : ''}>
                    <button onClick={() => goTo(h.id)}>{h.text}</button>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="blog-content">
            <ReactMarkdown components={mdComponents}>{bodyContent}</ReactMarkdown>
          </div>
        </div>

        {related.length > 0 && (
          <section className="blog-related">
            <h3 className="blog-related-title">Keep reading</h3>
            <div className="blog-related-grid">
              {related.map((r) => (
                <Link to={`/blog/${r.slug}`} key={r.id} className="blog-related-card">
                  <div className="blog-card-meta">
                    <time>{formatDate(r.publishedAt)}</time>
                    <span className="blog-meta-dot">·</span>
                    <span>{readingTime(r.content)}</span>
                  </div>
                  <h4>{r.title}</h4>
                  {r.excerpt && <p>{r.excerpt}</p>}
                  {r.tags && r.tags.length > 0 && <span className="blog-card-tag">{r.tags[0]}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
