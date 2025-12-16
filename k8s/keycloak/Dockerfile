# Custom Keycloak with Optimal Theme
FROM quay.io/keycloak/keycloak:23.0

# Copy Optimal theme
COPY themes/optimal /opt/keycloak/themes/optimal

# Set environment variables
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Build optimized Keycloak
RUN /opt/keycloak/bin/kc.sh build

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
