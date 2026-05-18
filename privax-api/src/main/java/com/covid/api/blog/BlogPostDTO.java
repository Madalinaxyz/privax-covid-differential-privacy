package com.covid.api.blog;

import lombok.Data;
import java.util.List;

@Data
public class BlogPostDTO {
    private String slug;       // optional — auto-generated from title if blank
    private String title;
    private String excerpt;
    private String content;
    private String author;
    private String coverImage;
    private List<String> tags;
}
