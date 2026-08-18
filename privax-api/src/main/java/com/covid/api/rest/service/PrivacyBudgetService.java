package com.covid.api.rest.service;

import com.covid.api.exception.BudgetExhaustedException;
import com.covid.api.exception.InvalidEpsilonException;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-researcher differential-privacy budget accounting for the interactive (authenticated) release
 * channel.
 * <p>
 * This is the counterpart to the public endpoints' one-shot memoized release. Under sequential
 * composition, answering k queries with privacy parameters ε₁..ε_k leaks at most Σεᵢ. So instead of
 * freezing a single value per secret, each researcher is given a fixed <b>total</b> budget
 * ({@link #TOTAL_EPSILON}); every query spends its ε from that budget and, crucially, receives
 * <b>fresh independent noise</b>. Repeated querying is safe not because the answers are identical,
 * but because the budget caps the total information any one identity can extract — after which
 * further queries are refused. This only works because the caller is authenticated: the budget is
 * charged to an accountable identity that cannot be rotated the way an anonymous IP can.
 * <p>
 * Budgets are held in memory and reset on restart (the demo DB reseeds on restart anyway).
 */
@Service
public class PrivacyBudgetService {

    /** Total cumulative epsilon a single researcher may spend, per server run. */
    public static final double TOTAL_EPSILON = 5.0;

    /** No single query may spend more than this, so one request can't drain the whole budget at once. */
    public static final double MAX_QUERY_EPSILON = 1.0;

    private final Map<String, Double> spent = new ConcurrentHashMap<>();

    /**
     * Atomically debits {@code epsilon} from the researcher's remaining budget.
     *
     * @return the researcher's remaining budget after this spend
     * @throws InvalidEpsilonException  if epsilon is non-positive, NaN, or above the per-query cap
     * @throws BudgetExhaustedException if the spend would exceed the researcher's total budget
     *                                  (the budget is left unchanged in that case)
     */
    public double spend(String researcher, double epsilon) {
        if (epsilon <= 0 || Double.isNaN(epsilon)) {
            throw new InvalidEpsilonException("epsilon must be a positive number");
        }
        if (epsilon > MAX_QUERY_EPSILON) {
            throw new InvalidEpsilonException("per-query epsilon may not exceed " + MAX_QUERY_EPSILON);
        }

        // merge() applies the remapping atomically; throwing inside it leaves the mapping unchanged,
        // so a rejected query never partially spends the budget.
        spent.merge(researcher, epsilon, (used, add) -> {
            double total = used + add;
            if (total > TOTAL_EPSILON + 1e-9) {
                throw new BudgetExhaustedException(String.format(
                    "Privacy budget exhausted: %.3f of %.3f already spent; this query needs %.3f. " +
                    "No further queries can be answered for this researcher.",
                    used, TOTAL_EPSILON, add));
            }
            return total;
        });

        return TOTAL_EPSILON - spent.get(researcher);
    }

    /** Remaining budget for a researcher (the full total if they have never queried). */
    public double remaining(String researcher) {
        return TOTAL_EPSILON - spent.getOrDefault(researcher, 0.0);
    }
}
