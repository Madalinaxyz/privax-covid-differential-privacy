package com.covid.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;

// Serialize Page responses via the stable DTO shape ({ content, page: { size, number,
// totalElements, totalPages } }) instead of the raw PageImpl, whose JSON structure Spring does not
// guarantee across versions. Applies to the paginated /api/side-effects and /api/blog endpoints.
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.VIA_DTO)
@SpringBootApplication
public class MainApplication {

    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }
}
