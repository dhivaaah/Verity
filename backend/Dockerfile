# Build stage
FROM golang:1.20-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum* ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o verity-server main.go

# Production stage
FROM alpine:3.18

WORKDIR /root/

COPY --from=builder /app/verity-server .

EXPOSE 8080

CMD ["./verity-server"]
