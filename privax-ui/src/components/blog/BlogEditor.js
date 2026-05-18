import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { privaxApi } from '../misc/PrivaxApi'
import { useAuth } from '../context/AuthContext'
import './blog.css'

const BLANK_POST = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  coverImage: '',
  tags: [],
}

export default function BlogEditor() {
  const { slug } = useParams()        // present when editing an existing post
  const navigate = useNavigate()
  const { getUser } = useAuth()
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  const [post, setPost]     = useState(BLANK_POST)
  const [postId, setPostId] = useState(null)
  const [tagsRaw, setTagsRaw] = useState('')
  const [mode, setMode]     = useState('write')   // 'write' | 'preview'
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (slug) {
      privaxApi.getBlogPost(slug)
        .then((r) => {
          setPost(r.data)
          setPostId(r.data.id)
          setTagsRaw((r.data.tags || []).join(', '))
        })
        .catch((e) => {
          console.error(e)
          setError('Failed to load the post.')
        })
    }
  }, [slug])

  if (!isAdmin) return <Navigate to="/" replace />

  const set = (field, value) => setPost((p) => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!post.title.trim() || !post.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      ...post,
      tags: tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      if (postId) {
        const r = await privaxApi.updateBlogPost(postId, payload)
        navigate(`/blog/${r.data.slug}`)
      } else {
        const r = await privaxApi.createBlogPost(payload)
        navigate(`/blog/${r.data.slug}`)
      }
    } catch (e) {
      console.error(e)
      setError(e.response?.data?.message || 'Failed to save. Check your input.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="blog-editor-page">
      <div className="blog-editor-header">
        <div>
          <span className="blog-eyebrow">{postId ? 'Edit post' : 'New post'}</span>
          <h1 className="blog-editor-title">{postId ? post.title || 'Untitled' : 'Compose a new entry'}</h1>
        </div>
        <div className="blog-editor-actions">
          <button
            onClick={() => setMode(mode === 'write' ? 'preview' : 'write')}
            className="blog-btn blog-btn-ghost"
          >
            {mode === 'write' ? 'Preview' : 'Write'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="blog-btn blog-btn-primary"
          >
            {saving ? 'Saving…' : (postId ? 'Update post' : 'Publish')}
          </button>
        </div>
      </div>

      {error && <div className="blog-error">{error}</div>}

      <div className="blog-editor-fields">
        <label className="blog-field">
          <span>Title</span>
          <input value={post.title} onChange={(e) => set('title', e.target.value)} placeholder="A clear, honest headline" />
        </label>

        <div className="blog-field-row">
          <label className="blog-field">
            <span>Slug <em>(optional — auto-generated from title)</em></span>
            <input value={post.slug || ''} onChange={(e) => set('slug', e.target.value)} placeholder="auto-from-title" />
          </label>
          <label className="blog-field">
            <span>Author</span>
            <input value={post.author || ''} onChange={(e) => set('author', e.target.value)} placeholder="e.g. The patient who built Privax" />
          </label>
        </div>

        <label className="blog-field">
          <span>Cover image URL <em>(optional)</em></span>
          <input value={post.coverImage || ''} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://…" />
        </label>

        <label className="blog-field">
          <span>Tags <em>(comma-separated)</em></span>
          <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="origin, personal, differential-privacy" />
        </label>

        <label className="blog-field">
          <span>Excerpt</span>
          <textarea
            value={post.excerpt || ''}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="A short summary shown on the blog index (2-3 sentences)."
            rows={3}
          />
        </label>

        <label className="blog-field blog-field-content">
          <span>Content <em>(Markdown — use ** for bold, # for headings, etc.)</em></span>
          {mode === 'write' ? (
            <textarea
              value={post.content || ''}
              onChange={(e) => set('content', e.target.value)}
              placeholder={"# A heading\n\nWrite your post in Markdown…"}
              rows={20}
              className="blog-content-input"
            />
          ) : (
            <div className="blog-content-preview">
              <ReactMarkdown>{post.content || '*(nothing to preview yet)*'}</ReactMarkdown>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}
