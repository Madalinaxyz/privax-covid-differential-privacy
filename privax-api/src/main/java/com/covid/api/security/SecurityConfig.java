package com.covid.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authorizeHttpRequests -> authorizeHttpRequests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/public/**", "/auth/**").permitAll()
                        // The compare endpoint returns the RAW (un-noised) count next to the noisy
                        // one — useful only for demonstrating the trade-off, never for the public.
                        .requestMatchers("/api/vaccinations/region/compare").hasAuthority(ADMIN)
                        .requestMatchers("/api/vaccinations/**").permitAll()
                        .requestMatchers(HttpMethod.GET,    "/api/blog/**").permitAll()
                        .requestMatchers(HttpMethod.POST,   "/api/blog/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT,    "/api/blog/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/blog/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.POST,   "/api/side-effects/clinician").hasAuthority(DOCTOR)
                        .requestMatchers(HttpMethod.GET,    "/api/side-effects/clinician/**").hasAuthority(DOCTOR)
                        // Reading reports + the aggregated map is public (the project's showcase).
                        // Note: clinician GETs are matched above, so they stay DOCTOR-only.
                        // Submitting a report (POST /api/side-effects) still requires a login via anyRequest() below.
                        .requestMatchers(HttpMethod.GET,    "/api/side-effects", "/api/side-effects/**").permitAll()
                        // User management is ADMIN-only. /me is the one exception: any
                        // authenticated user may look up their own account.
                        .requestMatchers(HttpMethod.GET,    "/api/users/me").authenticated()
                        .requestMatchers("/api/users", "/api/users/**").hasAuthority(ADMIN)
                        // Researcher API: interactive DP queries against a per-user epsilon budget.
                        // Any authenticated user acts as a researcher; the budget is charged to their
                        // username (a dedicated RESEARCHER authority would be a one-line extension).
                        .requestMatchers("/api/research/**").authenticated()
                        // Catalogue + appointment mutations are ADMIN-only (reads stay open to
                        // any authenticated user). Without this, any logged-in user could add,
                        // edit, or delete vaccines and appointments.
                        .requestMatchers(HttpMethod.POST,   "/api/vaccines", "/api/vaccines/**", "/api/appointments", "/api/appointments/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT,    "/api/vaccines/**", "/api/appointments/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/vaccines/**", "/api/appointments/**").hasAuthority(ADMIN)
                        .requestMatchers("/", "/error", "/csrf", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .sessionManagement(sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    public static final String ADMIN  = "ADMIN";
    public static final String USER   = "USER";
    public static final String DOCTOR = "DOCTOR";
}
