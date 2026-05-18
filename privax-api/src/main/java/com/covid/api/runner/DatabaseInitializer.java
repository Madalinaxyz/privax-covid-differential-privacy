package com.covid.api.runner;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.covid.api.rest.model.SeverityLevel;
import com.covid.api.rest.model.SideEffectReport;
import com.covid.api.rest.model.VaccinationRecord;
import com.covid.api.rest.model.Vaccine;
import com.covid.api.rest.repository.SideEffectReportRepository;
import com.covid.api.rest.repository.VaccinationRecordRepository;
import com.covid.api.rest.repository.VaccineRepository;
import com.covid.api.security.SecurityConfig;
import com.covid.api.user.User;
import com.covid.api.user.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Slf4j
@RequiredArgsConstructor
@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private VaccinationRecordRepository vaccinationRecordRepository;
    private final SideEffectReportRepository sideEffectReportRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final VaccineRepository vaccineRepository;


    private static final String[] REGIONS = {
        "Bucharest", "Cluj", "Timisoara", "Iasi", "Constanta", "Brasov", "Oradea", "Craiova"
    };
    
    private static final String[] VACCINE_TYPES = {
        "Pfizer", "Moderna", "AstraZeneca", "Johnson & Johnson"
    };

    private static final List<String> SYMPTOMS = Arrays.asList(
            "Fever", "Headache", "Fatigue", "Muscle Pain", "Nausea", "Chills",
            "Dizziness", "Shortness of Breath", "Chest Pain", "Swelling"
    );

    private static final List<Vaccine> VACCINES = Arrays.asList(
        new Vaccine("Pfizer", "Pfizer Inc.", 10000),
        new Vaccine("Moderna", "Moderna, Inc.", 8000),
        new Vaccine("AstraZeneca", "AstraZeneca plc", 6000),
        new Vaccine("Johnson & Johnson", "Johnson & Johnson", 5000)
    );

    private static final int NUMBER_OF_RECORDS = 10_000;
    private static final int NUMBER_OF_REPORTS = 3_000;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        insertUsers();
        insertVaccines();
        insertVaccinationRecords();
        insertSideEffectReports();
        log.info("Database initialized");
    }

    private void insertUsers() {
        USERS.forEach(user -> {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userService.saveUser(user);
        });
    }

    private void insertVaccines() {
        if (vaccineRepository.count() == 0) {
            vaccineRepository.saveAll(VACCINES);
            log.info("Inserted predefined vaccines into the database.");
        } else {
            log.info("Vaccines already exist, skipping initialization.");
        }
    }

    private void insertVaccinationRecords() {
        if (vaccinationRecordRepository.count() == 0) {
            List<VaccinationRecord> records = new ArrayList<>();
            
            LocalDate startDate = LocalDate.of(2020, 1, 1);
            long daysBetween = LocalDate.now().toEpochDay() - startDate.toEpochDay();
            
            for (int i = 0; i < NUMBER_OF_RECORDS; i++) {
                int age = 16 + random.nextInt(60); // 16 to 100
                int numberOfDoses = 1 + random.nextInt(2);
                String region = REGIONS[random.nextInt(REGIONS.length)];
                String vaccineType = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
                LocalDate vaccinationDate = startDate.plusDays(random.nextInt((int) daysBetween + 1));
                VaccinationRecord record = new VaccinationRecord(age, region, vaccineType, numberOfDoses, vaccinationDate);
                records.add(record);
            }
            
            vaccinationRecordRepository.saveAll(records);
            System.out.println("Inserted " + NUMBER_OF_RECORDS + " random vaccination records.");
        } else {
            System.out.println("Vaccination records already exist, skipping data initialization.");
        }
    }

    private static final List<User> USERS = Arrays.asList(
            new User("admin", "admin", "Admin", "admin@mycompany.com", SecurityConfig.ADMIN),
            new User("user", "user", "User", "user@mycompany.com", SecurityConfig.USER)
    );


    // private void insertSideEffectReports() {
    //     if (sideEffectReportRepository.count() == 0) {
    //         List<SideEffectReport> reports = new ArrayList<>();

    //         LocalDateTime startDate = LocalDateTime.now().minusYears(3); // Reports from last 3 years
    //         long daysBetween = startDate.until(LocalDateTime.now(), java.time.temporal.ChronoUnit.DAYS);

    //         for (int i = 0; i < NUMBER_OF_REPORTS; i++) {
    //             int age = 16 + random.nextInt(85); // Random age between 16-100
    //             List<String> symptoms = generateRandomSymptoms();
    //             SeverityLevel severity = SeverityLevel.values()[random.nextInt(SeverityLevel.values().length)];
    //             String additionalInfo = random.nextBoolean() ? "Patient had mild symptoms but recovered quickly." : "";
    //             LocalDateTime reportedAt = startDate.plusDays(random.nextInt((int) daysBetween + 1))
    //                                                 .plusHours(random.nextInt(24))
    //                                                 .plusMinutes(random.nextInt(60));
    //             String vaccineName = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
    //             SideEffectReport report = new SideEffectReport(age, symptoms, severity, additionalInfo, reportedAt, vaccineName);
    //             reports.add(report);
    //         }

    //         sideEffectReportRepository.saveAll(reports);
    //         log.info("Inserted {} random side effect reports.", NUMBER_OF_REPORTS);
    //     } else {
    //         log.info("Side effect reports already exist, skipping initialization.");
    //     }
    // }

    private void insertSideEffectReports() {
        if (sideEffectReportRepository.count() == 0) {
            List<SideEffectReport> reports = new ArrayList<>();
    
            LocalDateTime startDate = LocalDateTime.now().minusYears(3); // Reports from last 3 years
            long daysBetween = startDate.until(LocalDateTime.now(), java.time.temporal.ChronoUnit.DAYS);
    
            List<String> cities = List.of(
                "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați",
                "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", "Sibiu", "Bacău", "Târgu Mureș",
                "Baia Mare", "Buzău", "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Botoșani",
                "Reșița", "Deva", "Slatina", "Focșani", "Vaslui", "Târgoviște", "Bistrița"
            );
    
            for (int i = 0; i < NUMBER_OF_REPORTS; i++) {
                int age = 16 + random.nextInt(85); // Random age between 16-100
                List<String> symptoms = generateRandomSymptoms();
                SeverityLevel severity = weightedRandomSeverity();
                String additionalInfo = random.nextBoolean() ? "Patient had mild symptoms but recovered quickly." : "";
                LocalDateTime reportedAt = startDate.plusDays(random.nextInt((int) daysBetween + 1))
                                                    .plusHours(random.nextInt(24))
                                                    .plusMinutes(random.nextInt(60));
                String vaccineName = VACCINE_TYPES[random.nextInt(VACCINE_TYPES.length)];
                String city = cities.get(random.nextInt(cities.size()));  // ✅ Assign a random city
    
                SideEffectReport report = new SideEffectReport(age, symptoms, severity, additionalInfo, reportedAt, vaccineName, city);
                reports.add(report);
            }
    
            sideEffectReportRepository.saveAll(reports);
            log.info("Inserted {} random side effect reports.", NUMBER_OF_REPORTS);
        } else {
            log.info("Side effect reports already exist, skipping initialization.");
        }
    }

    private List<String> generateRandomSymptoms() {
        int numberOfSymptoms = 1 + random.nextInt(3); // Randomly pick 1-3 symptoms
        List<String> selectedSymptoms = new ArrayList<>();
        for (int i = 0; i < numberOfSymptoms; i++) {
            String symptom = SYMPTOMS.get(random.nextInt(SYMPTOMS.size()));
            if (!selectedSymptoms.contains(symptom)) {
                selectedSymptoms.add(symptom);
            }
        }
        return selectedSymptoms;
    }

    /**
     * Realistic post-vaccine severity distribution.
     * Real-world vaccine adverse-event registries (VAERS, EudraVigilance) show
     * the vast majority of reports are mild, with fatalities being extraordinarily rare.
     *
     *   MILD     ~80%   (typical: arm soreness, fatigue, mild fever)
     *   MODERATE ~14%   (more pronounced symptoms, but resolved without hospitalization)
     *   SEVERE    ~5%   (hospitalization or persistent symptoms)
     *   FATAL     ~1%   (rare in real life — slightly elevated here so the data point exists)
     */
    private SeverityLevel weightedRandomSeverity() {
        double r = random.nextDouble();           // 0.0 inclusive, 1.0 exclusive
        if (r < 0.80) return SeverityLevel.MILD;       // 80%
        if (r < 0.94) return SeverityLevel.MODERATE;   // +14% → 94%
        if (r < 0.99) return SeverityLevel.SEVERE;     // +5%  → 99%
        return SeverityLevel.FATAL;                    // +1%  → 100%
    }

}
