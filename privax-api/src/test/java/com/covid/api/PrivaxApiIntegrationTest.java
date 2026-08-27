package com.covid.api;

import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.repository.SideEffectReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests: the whole application is started against an in-memory H2 database
 * (the "test" profile), and requests go through the real controllers and the real
 * Spring Security rules. These check the behaviour the privacy design depends on:
 * access control, the block on self-assigning a privileged role, and memoization.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PrivaxApiIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private SideEffectReportRepository reportRepository;

    @BeforeEach
    void seedAFewReports() {
        reportRepository.deleteAll();
        for (int i = 0; i < 5; i++) {
            reportRepository.save(new SideEffectReport(
                    30, List.of("Fever"), SeverityLevel.MILD, "note",
                    LocalDateTime.now(), "Pfizer", "Cluj-Napoca"));
        }
    }

    @Test
    void publicStatsAreAccessibleWithoutLogin() throws Exception {
        mvc.perform(get("/public/stats")).andExpect(status().isOk());
    }

    @Test
    void theResearchConsoleRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/research/side-effects/count").param("epsilon", "1"))
           .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "bob", authorities = {"USER"})
    void theResearchConsoleIsForbiddenForANormalUser() throws Exception {
        mvc.perform(get("/api/research/side-effects/count").param("epsilon", "1"))
           .andExpect(status().isForbidden());
    }

    @Test
    void signupCannotSelfAssignTheAdminRole() throws Exception {
        String body = "{\"username\":\"eve\",\"password\":\"secret123\",\"name\":\"Eve\"," +
                "\"email\":\"eve@example.com\",\"role\":\"ADMIN\"}";
        mvc.perform(post("/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
           .andExpect(status().is2xxSuccessful())
           .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void publicAggregatesAreMemoizedSoRepeatedQueriesAreIdentical() throws Exception {
        MvcResult first = mvc.perform(get("/api/side-effects/grouped").param("vaccineName", "Pfizer"))
                             .andExpect(status().isOk()).andReturn();
        MvcResult second = mvc.perform(get("/api/side-effects/grouped").param("vaccineName", "Pfizer"))
                              .andExpect(status().isOk()).andReturn();
        String a = first.getResponse().getContentAsString();
        String b = second.getResponse().getContentAsString();
        // The released count is drawn once and cached, so the two answers must be byte-for-byte equal:
        // there is nothing for an averaging attack to cancel out.
        assertThat(a).isEqualTo(b);
    }
}
