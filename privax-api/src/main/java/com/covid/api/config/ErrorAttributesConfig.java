package com.covid.api.config;

import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.error.ErrorAttributeOptions.Include;
import org.springframework.boot.web.servlet.error.DefaultErrorAttributes;
import org.springframework.boot.web.servlet.error.ErrorAttributes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.WebRequest;

import java.util.Map;

@Configuration
public class ErrorAttributesConfig {

    @Bean
    ErrorAttributes errorAttributes() {
        return new DefaultErrorAttributes() {
            @Override
            public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
                // Include the message and validation binding errors (the UI uses these), but NOT
                // the exception class name — that leaks internal framework/implementation details.
                return super.getErrorAttributes(webRequest, options.including(Include.MESSAGE, Include.BINDING_ERRORS));
            }
        };
    }
}
