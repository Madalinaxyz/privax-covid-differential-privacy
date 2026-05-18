package com.covid.api.blog;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BlogPostService {

    private final BlogPostRepository repository;

    /**
     * Returns posts paginated. Defaults to newest-first if no sort is provided.
     */
    public Page<BlogPost> getPosts(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("publishedAt").descending()
            );
        }
        return repository.findAll(pageable);
    }

    public BlogPost getBySlug(String slug) {
        return repository.findBySlug(slug)
            .orElseThrow(() -> new BlogPostNotFoundException("Blog post not found: " + slug));
    }

    public BlogPost createPost(BlogPostDTO dto) {
        BlogPost post = new BlogPost();
        applyDto(post, dto);
        if (post.getSlug() == null || post.getSlug().isBlank()) {
            post.setSlug(generateUniqueSlug(dto.getTitle()));
        }
        return repository.save(post);
    }

    public BlogPost updatePost(Long id, BlogPostDTO dto) {
        BlogPost post = repository.findById(id)
            .orElseThrow(() -> new BlogPostNotFoundException("Blog post not found: id=" + id));
        applyDto(post, dto);
        return repository.save(post);
    }

    public void deletePost(Long id) {
        if (!repository.existsById(id)) {
            throw new BlogPostNotFoundException("Blog post not found: id=" + id);
        }
        repository.deleteById(id);
    }

    /* ──────────────────────────────────────────────────────── */

    private void applyDto(BlogPost post, BlogPostDTO dto) {
        if (dto.getTitle()       != null) post.setTitle(dto.getTitle());
        if (dto.getExcerpt()     != null) post.setExcerpt(dto.getExcerpt());
        if (dto.getContent()     != null) post.setContent(dto.getContent());
        if (dto.getAuthor()      != null) post.setAuthor(dto.getAuthor());
        if (dto.getCoverImage()  != null) post.setCoverImage(dto.getCoverImage());
        if (dto.getTags()        != null) post.setTags(dto.getTags());
        if (dto.getSlug() != null && !dto.getSlug().isBlank()) {
            post.setSlug(dto.getSlug());
        }
    }

    private String generateUniqueSlug(String title) {
        String base = slugify(title);
        String slug = base;
        int suffix = 2;
        while (repository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }

    private String slugify(String input) {
        if (input == null) return "post";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .toLowerCase(Locale.ROOT)
            .trim();
        normalized = normalized.replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");
        return normalized.isEmpty() ? "post" : normalized;
    }
}
