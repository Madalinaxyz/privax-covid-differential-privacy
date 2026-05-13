package com.covid.api.rest.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.covid.api.book.BookService;
import com.covid.api.user.UserService;

@RequiredArgsConstructor
@RestController
@RequestMapping("/public")
public class PublicController {

    private final UserService userService;
    private final BookService bookService;

    @GetMapping("/numberOfUsers")
    public Integer getNumberOfUsers() {
        return userService.getUsers().size();
    }

    @GetMapping("/numberOfBooks")
    public Integer getNumberOfBooks() {
        return bookService.getBooks().size();
    }
}
