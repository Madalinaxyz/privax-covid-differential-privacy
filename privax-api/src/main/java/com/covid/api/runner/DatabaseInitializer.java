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
    // private final BookService bookService;
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
    private static final int NUMBER_OF_REPORTS = 15_000;

    private final Random random = new Random();

    @Override
    public void run(String... args) {
        insertUsers();
        insertVaccines();
        insertVaccinationRecords();
        insertSideEffectReports();
        log.info("Database initialized");
        

        // // BOOKS
        // if (!userService.getUsers().isEmpty()) {
        //     return;
        // }
        // getBooks().forEach(bookService::saveBook);
    }

    // private List<Book> getBooks() {
    //     return Arrays.stream(BOOKS_STR.split("\n"))
    //             .map(bookInfoStr -> bookInfoStr.split(";"))
    //             .map(bookInfoArr -> new Book(bookInfoArr[0], bookInfoArr[1]))
    //             .collect(Collectors.toList());
    // }

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
                SeverityLevel severity = SeverityLevel.values()[random.nextInt(SeverityLevel.values().length)];
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


    // private static final String BOOKS_STR =
    //         """
    //                 9781603090773;Any Empire
    //                 9781603090698;August Moon
    //                 9781891830372;The Barefoot Serpent (softcover) by Scott Morse
    //                 9781603090292;BB Wolf and the 3 LP's
    //                 9781891830402;Beach Safari by Mawil
    //                 9781603094429;Belzebubs
    //                 9781891830563;Bighead by Jeffrey Brown
    //                 9781603094320;Bodycount
    //                 9781891830198;Box Office Poison
    //                 9780958578349;From Hell
    //                 9781603094221;Cat'n'Bat
    //                 9781603091008;Crater XV
    //                 9781891830815;Cry Yourself to Sleep by Jeremy Tinder
    //                 9781603092715;Dear Beloved Stranger
    //                 9781891830129;Dear Julia
    //                 9781891830921;Death by Chocolate - Redux
    //                 9781603090575;Dragon Puncher (Book 1)
    //                 9781603090858;Dragon Puncher (Book 2): Island
    //                 9781603093873;Eddie Campbell's Omnibox: The Complete ALEC and BACCHUS (3 Volume Slipcase)
    //                 9781603090360;Far Arden
    //                 9781603090537;Fingerprints
    //                 9781891830976;Fox Bunny Funny
    //                 9780958578349;From Hell
    //                 9781603093866;God Is Disappointed / Apocrypha Now — SLIPCASE SET
    //                 9781603090988;God Is Disappointed in You
    //                 9781603090087;Hieronymus B.
    //                 9781603094412;Highwayman
    //                 9781891830174;Hutch Owen (Vol 1): The Collected by Tom Hart
    //                 9781891830556;Hutch Owen (Vol 2): Unmarketable by Tom Hart
    //                 9781603090865;Hutch Owen (Vol 3): Let's Get Furious!
    //                 9781891830839;Infinite Kung Fu
    //                 9781891830655;The King by Rich Koslowski
    //                 9781603090001;The League of Extraordinary Gentlemen (Vol III): Century #1 - 1910
    //                 9781603090063;The League of Extraordinary Gentlemen (Vol III): Century #2 - 1969
    //                 9781603090070;The League of Extraordinary Gentlemen (Vol III): Century #3 - 2009
    //                 9781603094375;The League of Extraordinary Gentlemen (Vol III): Century
    //                 9781891830518;Less Than Heroes by David Yurkovich
    //                 9781603090704;Liar's Kiss
    //                 9781891830693;Lone Racer by Nicolas Mahler
    //                 9781603091527;The Lovely Horrible Stuff
    //                 9781603090094;Lower Regions
    //                 9781891830334;Magic Boy and the Robot Elf by James Kochalka
    //                 9781891830365;Monkey Vs. Robot (Vol 2): Crystal of Power by Koch.
    //                 9781603090759;Monster on the Hill (Book 1)
    //                 9781891830686;Mosquito by Dan James
    //                 9781603090490;Moving Pictures
    //                 9781603094092;Nate Powell's OMNIBOX
    //                 9781603090681;Okie Dokie Donuts (Story 1): Open for Business!
    //                 9781891830297;Pinky & Stinky by James Kochalka
    //                 9781603090711;Pirate Penguin vs Ninja Chicken (Book 1): Troublems with Frenemies
    //                 9781603093675;Pirate Penguin vs Ninja Chicken (Book 2): Escape from Skull-Fragment Island!
    //                 9781603094139;Return of the Dapper Men (Deluxe Edition)
    //                 9781603090896;Scene But Not Heard
    //                 9781603094450;A Shining Beacon
    //                 9781891830143;Speechless
    //                 9781891830501;Spiral-Bound by Aaron Renier
    //                 9781603090209;Sulk (Vol 1): Bighead and Friends
    //                 9781603090315;Sulk (Vol 2): Deadly Awesome
    //                 9781603090551;Sulk (Vol 3): The Kind of Strength...
    //                 9781891830969;Super Spy
    //                 9781603090438;Super Spy (Vol 2): The Lost Dossiers
    //                 9781603090339;Swallow Me Whole
    //                 9781603090056;That Salty Air
    //                 9781603094504;They Called Us Enemy
    //                 9781891830310;Three Fingers by Rich Koslowski
    //                 9781891830983;Too Cool to Be Forgotten
    //                 9781603090742;The Underwater Welder
    //                 9781603090889;Upside Down (Book 1): A Vampire Tale
    //                 9781603093712;Upside Down (Book 2): A Hat Full of Spells
    //                 9781891830723;Will You Still Love Me If I Wet the Bed by Liz Prince
    //                 9781603094405;Ye
    //                 """;
}
