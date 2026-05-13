package com.covid.api.exception;

/**
 * Exception thrown when a requested resource is not found.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructs a new ResourceNotFoundException with the specified detail message.
     *
     * @param message the detail message.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructs a new ResourceNotFoundException with a formatted detail message.
     *
     * @param resourceName the name of the resource.
     * @param fieldName    the name of the field.
     * @param fieldValue   the value of the field.
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
    }
}
