package com.covid.api.blog;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class BlogPostNotFoundException extends RuntimeException {
    public BlogPostNotFoundException(String message) {
        super(message);
    }
}
