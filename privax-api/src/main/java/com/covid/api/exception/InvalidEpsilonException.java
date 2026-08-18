package com.covid.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a researcher supplies an epsilon that is not a usable per-query privacy cost
 * (non-positive, NaN, or larger than the per-query cap). Maps to HTTP 400.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidEpsilonException extends RuntimeException {
    public InvalidEpsilonException(String message) {
        super(message);
    }
}
