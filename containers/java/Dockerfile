FROM eclipse-temurin:21-alpine

RUN addgroup -S runner && adduser -S runner -G runner

USER runner
WORKDIR /app

ENTRYPOINT ["java"]
