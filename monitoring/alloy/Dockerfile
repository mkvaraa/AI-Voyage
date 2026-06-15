FROM grafana/alloy:latest

COPY config.alloy /etc/alloy/config.alloy

# Railway sets $PORT for the HTTP listener. Alloy's UI listens on 12345 by default;
# we bind it to 0.0.0.0:$PORT so Railway's health checks (if enabled) can hit it.
ENV ALLOY_DEPLOY_MODE=docker

ENTRYPOINT ["/bin/sh", "-c", "alloy run --server.http.listen-addr=0.0.0.0:${PORT:-12345} /etc/alloy/config.alloy"]
