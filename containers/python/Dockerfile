FROM python:3.11-alpine

RUN addgroup -S runner && adduser -S runner -G runner
USER runner

WORKDIR /app
ENTRYPOINT ["python"]
