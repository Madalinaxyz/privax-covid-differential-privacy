package com.covid.api.book;

import com.covid.api.rest.dto.CreateBookRequest;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "books")
public class Book {

    @Id
    private String isbn;

    private String title;

    public static Book from(CreateBookRequest createBookRequest) {
        return new Book(createBookRequest.isbn(), createBookRequest.title());
    }
}
