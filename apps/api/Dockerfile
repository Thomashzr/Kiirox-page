FROM ghcr.io/gleam-lang/gleam:v1.18.1-erlang-alpine AS build

WORKDIR /app

# Copy dependency specifications
COPY gleam.toml manifest.toml ./

# Download dependencies
RUN gleam deps download

# Copy source code
COPY . .

# Build Erlang shipment
RUN gleam export erlang-shipment

# Runtime stage
FROM erlang:28-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy compiled shipment from builder
COPY --from=build /app/build/erlang-shipment /app

RUN chown -R app:app /app && chmod +x /app/entrypoint.sh

USER app

EXPOSE 4000

ENV PORT=4000

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
CMD ["run"]
