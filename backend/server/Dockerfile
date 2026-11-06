# syntax=docker/dockerfile:1
# Copyright 2026 Tobias Hofmann
# SPDX-License-Identifier: Apache-2.0

FROM eclipse-temurin:25-jdk AS build
WORKDIR /build

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw -B dependency:go-offline

COPY src src
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:25-jre AS run
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar

# Database selection: h2 (default, zero-config, in-memory) | mysql | postgresql — see
# backend/server/src/main/resources/application-*.properties and the root README.md.
# Override at `docker run` time, e.g.:
#   docker run -e SPRING_PROFILES_ACTIVE=postgresql -e DB_HOST=... -e DB_PASSWORD=... sipoc-backend
ENV SPRING_PROFILES_ACTIVE=h2

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
