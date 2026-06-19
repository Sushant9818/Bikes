#!/usr/bin/env bash

set -euo pipefail

PORT="${SERVER_PORT:-8082}"
PROFILE="${SPRING_PROFILES_ACTIVE:-dev}"

echo "Using port: ${PORT}"
echo "Using Spring profile: ${PROFILE}"

if ! command -v lsof >/dev/null 2>&1; then
  echo "Error: lsof not found. Please install lsof and retry." >&2
  exit 1
fi

CURRENT_USER="$(id -un)"

echo "Checking for processes owned by '${CURRENT_USER}' listening on port ${PORT}..."

PIDS="$(lsof -tiTCP:${PORT} -sTCP:LISTEN -u "${CURRENT_USER}" 2>/dev/null || true)"

if [ -n "${PIDS}" ]; then
  echo "Found the following PIDs on port ${PORT} (owned by ${CURRENT_USER}): ${PIDS}"
  for pid in ${PIDS}; do
    if ps -p "${pid}" -o user= | grep -q "^${CURRENT_USER}\$"; then
      echo "Terminating PID ${pid}..."
      kill "${pid}" || true
    else
      echo "Skipping PID ${pid} (not owned by ${CURRENT_USER})"
    fi
  done
  echo "Waiting for port ${PORT} to be freed..."
  sleep 2
else
  echo "No processes owned by '${CURRENT_USER}' are listening on port ${PORT}."
fi

echo "Starting Spring Boot (mvn spring-boot:run) with profile '${PROFILE}'..."
exec mvn spring-boot:run -Dspring-boot.run.profiles="${PROFILE}"

