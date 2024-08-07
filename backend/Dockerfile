FROM gradle:jdk21-jammy AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN ./gradlew bootJar --no-daemon 

FROM amazoncorretto:21-alpine

EXPOSE 8081

RUN mkdir /app

COPY --from=build /home/gradle/src/build/libs/*.jar /app/backend-1.0.jar

ENTRYPOINT java $JAVA_OPTS -jar /app/backend-1.0.jar
