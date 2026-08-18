package com.covid.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a researcher's cumulative differential-privacy budget is spent and a further query
 * would exceed it. Maps to HTTP 429 (Too Many Requests): the request is well-formed but refused
 * because answering it would leak more than the allotted total privacy loss.
 */
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class BudgetExhaustedException extends RuntimeException {
    public BudgetExhaustedException(String message) {
        super(message);
    }
}
