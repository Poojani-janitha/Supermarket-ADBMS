CREATE TABLE IF NOT EXISTS unit_of_measure (
  unit_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO unit_of_measure (code, display_name) VALUES
  ('KG', 'Kilogram'),
  ('G', 'Gram'),
  ('L', 'Liter'),
  ('ML', 'Milliliter'),
  ('PACKET', 'Packet'),
  ('PIECE', 'Piece'),
  ('CAN', 'Can'),
  ('BOTTLE', 'Bottle');

ALTER TABLE product
  MODIFY unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'PIECE';



/*
Configuration added
In application.properties:
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.locations=classpath:db/migration

Dependency added
In pom.xml:
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>

<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
*/