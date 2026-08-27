package com.covid.api.rest.service;

import com.covid.api.exception.BudgetExhaustedException;
import com.covid.api.exception.InvalidEpsilonException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the researcher privacy-budget accounting. These run with no Spring
 * context and no database: they test the composition logic in isolation.
 */
class PrivacyBudgetServiceTest {

    @Test
    void aNewResearcherHasTheFullBudget() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        assertThat(service.remaining("alice")).isEqualTo(PrivacyBudgetService.TOTAL_EPSILON);
    }

    @Test
    void spendingReducesTheRemainingBudget() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        double left = service.spend("alice", 0.4);
        assertThat(left).isCloseTo(PrivacyBudgetService.TOTAL_EPSILON - 0.4, org.assertj.core.data.Offset.offset(1e-9));
        assertThat(service.remaining("alice")).isCloseTo(4.6, org.assertj.core.data.Offset.offset(1e-9));
    }

    @Test
    void aQueryAboveThePerQueryCapIsRejected() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        assertThatThrownBy(() -> service.spend("alice", PrivacyBudgetService.MAX_QUERY_EPSILON + 0.1))
                .isInstanceOf(InvalidEpsilonException.class);
        // a rejected query must not spend anything
        assertThat(service.remaining("alice")).isEqualTo(PrivacyBudgetService.TOTAL_EPSILON);
    }

    @Test
    void aNonPositiveOrNaNEpsilonIsRejected() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        assertThatThrownBy(() -> service.spend("alice", 0)).isInstanceOf(InvalidEpsilonException.class);
        assertThatThrownBy(() -> service.spend("alice", -1)).isInstanceOf(InvalidEpsilonException.class);
        assertThatThrownBy(() -> service.spend("alice", Double.NaN)).isInstanceOf(InvalidEpsilonException.class);
    }

    @Test
    void theBudgetIsExhaustedAfterEnoughQueriesAndFurtherQueriesAreRefused() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        // spend the whole budget of 5.0 in five queries of 1.0
        for (int i = 0; i < 5; i++) {
            service.spend("alice", 1.0);
        }
        assertThat(service.remaining("alice")).isCloseTo(0.0, org.assertj.core.data.Offset.offset(1e-9));
        // the sixth query must be refused
        assertThatThrownBy(() -> service.spend("alice", 1.0)).isInstanceOf(BudgetExhaustedException.class);
    }

    @Test
    void aRefusedOverBudgetQueryDoesNotPartiallySpend() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        service.spend("alice", 1.0);           // remaining 4.0
        service.spend("alice", 1.0);           // remaining 3.0 (total spent 2.0)
        // 4.0 would exceed the remaining 3.0 -> refused, and it is also over the per-query cap,
        // so use several allowed spends then one that would overshoot:
        service.spend("alice", 1.0);           // remaining 2.0
        service.spend("alice", 1.0);           // remaining 1.0
        assertThatThrownBy(() -> service.spend("alice", 1.0 + 1e-6)).isInstanceOf(InvalidEpsilonException.class);
        // the failed attempt left the budget untouched
        assertThat(service.remaining("alice")).isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-9));
    }

    @Test
    void differentResearchersHaveIndependentBudgets() {
        PrivacyBudgetService service = new PrivacyBudgetService();
        service.spend("alice", 1.0);
        assertThat(service.remaining("alice")).isCloseTo(4.0, org.assertj.core.data.Offset.offset(1e-9));
        assertThat(service.remaining("bob")).isEqualTo(PrivacyBudgetService.TOTAL_EPSILON);
    }
}
