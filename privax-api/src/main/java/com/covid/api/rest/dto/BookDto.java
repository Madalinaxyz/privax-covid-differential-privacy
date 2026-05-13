package com.covid.api.rest.dto;

import com.covid.api.book.Book;

public record BookDto(String isbn, String title) {

    public static BookDto from(Book book) {
        return new BookDto(book.getIsbn(), book.getTitle());
    }
}