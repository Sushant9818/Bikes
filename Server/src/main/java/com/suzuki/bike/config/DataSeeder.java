package com.suzuki.bike.config;

import com.suzuki.bike.entity.Offer;
import com.suzuki.bike.entity.Part;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.entity.Vehicle;
import com.suzuki.bike.entity.enums.PartType;
import com.suzuki.bike.entity.enums.Role;
import com.suzuki.bike.entity.enums.VehicleType;
import com.suzuki.bike.repository.OfferRepository;
import com.suzuki.bike.repository.PartRepository;
import com.suzuki.bike.repository.UserRepository;
import com.suzuki.bike.repository.VehicleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final PartRepository partRepository;
    private final OfferRepository offerRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      VehicleRepository vehicleRepository,
                      PartRepository partRepository,
                      OfferRepository offerRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.partRepository = partRepository;
        this.offerRepository = offerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@suzuki.local")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            admin.setPhoneNumber("9800000001");
            admin.setPhoneVerified(true);
            admin.setEnabled(true);
            admin.setEmailVerifiedAt(java.time.Instant.now());
            userRepository.save(admin);

            User client = User.builder()
                    .username("client")
                    .email("client@suzuki.local")
                    .password(passwordEncoder.encode("client123"))
                    .role(Role.CLIENT)
                    .build();
            client.setPhoneNumber("9800000002");
            client.setPhoneVerified(true);
            client.setEnabled(true);
            client.setEmailVerifiedAt(java.time.Instant.now());
            userRepository.save(client);
        }

        seedCatalogVehicles();

        if (partRepository.count() == 0) {
            Part p1 = Part.builder()
                    .type(PartType.BIKE_PART)
                    .partName("Clutch Assembly - Gixxer SF")
                    .compatibleModel("Gixxer SF 250")
                    .price(4500.0)
                    .quantity(20)
                    .build();
            p1.setImageUrl("/assets/images/parts/part-1.jpg");
            partRepository.save(p1);

            Part p2 = Part.builder()
                    .type(PartType.BIKE_PART)
                    .partName("Air Filter - V-Strom")
                    .compatibleModel("V-Strom SX")
                    .price(850.0)
                    .quantity(50)
                    .build();
            p2.setImageUrl("/assets/images/parts/part-2.jpg");
            partRepository.save(p2);

            Part p3 = Part.builder()
                    .type(PartType.SCOOTER_PART)
                    .partName("CVT Belt - Access 125")
                    .compatibleModel("Access 125")
                    .price(1200.0)
                    .quantity(30)
                    .build();
            p3.setImageUrl("/assets/images/parts/part-3.jpg");
            partRepository.save(p3);

            Part p4 = Part.builder()
                    .type(PartType.SCOOTER_PART)
                    .partName("Brake Pad Set - Burgman")
                    .compatibleModel("Burgman Street")
                    .price(650.0)
                    .quantity(40)
                    .build();
            p4.setImageUrl("/assets/images/parts/part-4.jpg");
            partRepository.save(p4);

            Part p5 = Part.builder()
                    .type(PartType.SCOOTER_PART)
                    .partName("Spark Plug - Avenis")
                    .compatibleModel("Avenis 125")
                    .price(180.0)
                    .quantity(100)
                    .build();
            p5.setImageUrl("/assets/images/parts/part-5.jpg");
            partRepository.save(p5);
        }

        if (offerRepository.count() == 0) {
            Offer o1 = new Offer();
            o1.setTitle("Festival Offer - 10% Off on Parts");
            o1.setDescription("Get 10% discount on all Suzuki genuine parts this festival season. Limited time offer.");
            o1.setDiscountPercent(10.0);
            o1.setStartDate(LocalDate.now());
            o1.setEndDate(LocalDate.now().plusMonths(1));
            offerRepository.save(o1);

            Offer o2 = new Offer();
            o2.setTitle("Free Test Drive - Gixxer SF 250");
            o2.setDescription("Book a test drive for Gixxer SF 250 and experience the thrill. No obligation.");
            o2.setStartDate(LocalDate.now());
            o2.setEndDate(LocalDate.now().plusMonths(3));
            offerRepository.save(o2);
        }
    }

    /**
     * Idempotent seed: adds each Suzuki catalog vehicle if not already present (brand + modelName).
     * Seeded in list order so serial numbers (ORDER BY id ASC) match catalog order on fresh DB.
     */
    private void seedCatalogVehicles() {
        final int year = 2024;
        final String brand = "Suzuki";

        // Scooters (serial 1–3 on fresh database)
        seedVehicle(brand, VehicleType.SCOOTER, "Access 125FI", year, 94_500.0, 12,
                "/assets/images/scooters/scooter-1.jpg",
                "Fuel-injected 125cc Suzuki scooter with comfortable city riding and excellent mileage.");
        seedVehicle(brand, VehicleType.SCOOTER, "Burgman Street 125FI", year, 114_000.0, 10,
                "/assets/images/scooters/scooter-2.jpg",
                "Premium maxi-scooter styling with 125FI performance and ample under-seat storage.");
        seedVehicle(brand, VehicleType.SCOOTER, "Avenis 125FI", year, 98_500.0, 8,
                "/assets/images/scooters/scooter-3.jpg",
                "Sporty urban scooter with FI engine, LED lighting, and agile handling.");

        // Motorcycles (serial 4–8 on fresh database)
        seedVehicle(brand, VehicleType.BIKE, "Gixxer 155 Fi", year, 229_000.0, 15,
                "/assets/images/bikes/bike-1.jpg",
                "Naked street bike with 155cc fuel-injected engine for daily commuting and weekend rides.");
        seedVehicle(brand, VehicleType.BIKE, "Gixxer SF 155", year, 249_000.0, 12,
                "/assets/images/bikes/bike-2.jpg",
                "Fully-faired 155 sport commuter with aggressive design and responsive handling.");
        seedVehicle(brand, VehicleType.BIKE, "Gixxer 250", year, 319_000.0, 10,
                "/assets/images/bikes/bike-3.jpg",
                "250cc naked sport motorcycle with strong mid-range power and modern features.");
        seedVehicle(brand, VehicleType.BIKE, "Gixxer SF 250", year, 359_000.0, 10,
                "/assets/images/bikes/bike-4.jpg",
                "Sport faired Gixxer 250 with track-inspired styling and balanced street performance.");
        seedVehicle(brand, VehicleType.BIKE, "V-Strom SX 250", year, 289_000.0, 8,
                "/assets/images/bikes/bike-5.jpg",
                "Adventure-styled 250 tourer built for city streets and light touring comfort.");
    }

    private void seedVehicle(String brand, VehicleType type, String modelName, int year,
                           double price, int quantity, String imageUrl, String description) {
        if (vehicleRepository.existsByBrandAndModelName(brand, modelName)) {
            return;
        }
        Vehicle vehicle = Vehicle.builder()
                .type(type)
                .modelName(modelName)
                .brand(brand)
                .year(year)
                .price(price)
                .quantity(quantity)
                .build();
        vehicle.setImageUrl(imageUrl);
        vehicle.setDescription(description);
        vehicleRepository.save(vehicle);
    }
}
