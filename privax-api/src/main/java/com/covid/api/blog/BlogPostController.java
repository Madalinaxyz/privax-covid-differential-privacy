package com.covid.api.blog;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogPostController {

    private final BlogPostService service;

    /** Public — list all posts (newest first by default). */
    @GetMapping
    public ResponseEntity<Page<BlogPost>> getPosts(Pageable pageable) {
        return ResponseEntity.ok(service.getPosts(pageable));
    }

    /** Public — fetch a single post by slug. */
    @GetMapping("/{slug}")
    public ResponseEntity<BlogPost> getPost(@PathVariable String slug) {
        return ResponseEntity.ok(service.getBySlug(slug));
    }

    /** Admin only — create a new post. */
    @PostMapping
    public ResponseEntity<BlogPost> createPost(@RequestBody BlogPostDTO dto) {
        return ResponseEntity.ok(service.createPost(dto));
    }

    /** Admin only — update an existing post. */
    @PutMapping("/{id}")
    public ResponseEntity<BlogPost> updatePost(@PathVariable Long id, @RequestBody BlogPostDTO dto) {
        return ResponseEntity.ok(service.updatePost(id, dto));
    }

    /** Admin only — delete a post. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        service.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
