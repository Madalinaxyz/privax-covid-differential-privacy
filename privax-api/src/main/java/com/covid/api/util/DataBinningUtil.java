package com.covid.api.util;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Utility class for data binning and thresholding operations.
 * Provides methods to bin numerical data into ranges and to suppress bins with small counts.
 */
public class DataBinningUtil {

    /**
     * Bins a list of numerical data into ranges (bins) of a specified size.
     *
     * @param data    the list of numerical values.
     * @param binSize the size of each bin.
     * @return a map where each key is a string representing the bin range and the value is the count of data points in that bin.
     */
    public static Map<String, Long> binData(List<Double> data, double binSize) {
        // Group each value by its corresponding bin range.
        return data.stream()
                .collect(Collectors.groupingBy(value -> {
                    long bin = (long) (value / binSize);
                    double lowerBound = bin * binSize;
                    double upperBound = lowerBound + binSize;
                    return String.format("[%.2f - %.2f)", lowerBound, upperBound);
                }, Collectors.counting()));
    }

    /**
     * Suppresses the counts for bins that do not meet the minimum threshold.
     * For bins with a count below the threshold, the count is replaced with a "Suppressed" string.
     *
     * @param binnedData a map of binned data where the key is the bin range and the value is the count.
     * @param threshold  the minimum count required for a bin to be reported.
     * @return a map where bins with counts below the threshold are marked as "Suppressed".
     */
    public static Map<String, String> suppressSmallGroups(Map<String, Long> binnedData, long threshold) {
        return binnedData.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue() < threshold ? "Suppressed" : String.valueOf(entry.getValue())
                ));
    }
}
