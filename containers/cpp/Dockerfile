FROM alpine:3.19

RUN apk add --no-cache g++ musl-dev && \
    addgroup -S runner && adduser -S runner -G runner

USER runner
WORKDIR /app

ENTRYPOINT ["sh", "-c", "g++ -O2 \"$1\" -o /tmp/a.out && /tmp/a.out", "--"]
