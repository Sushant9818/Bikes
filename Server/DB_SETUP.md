# PostgreSQL Setup (macOS)

## 1. Install PostgreSQL

**Using Homebrew:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Or using Postgres.app:**  
Download from https://postgresapp.com and start the app.

## 2. Create the Database

```bash
# Connect to default postgres
psql postgres

# Create database
CREATE DATABASE suzuki_bike_db;

# Exit
\q
```

## 3. Verify Connection

```bash
psql -U postgres -d suzuki_bike_db -c "SELECT 1;"
```

## 4. Update Credentials (if needed)

Edit `src/main/resources/application.yml` or use env vars:

```bash
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_password
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/suzuki_bike_db
mvn spring-boot:run
```
