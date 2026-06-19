package com.suzuki.bike.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevPortLogger implements ApplicationListener<WebServerInitializedEvent> {

    private static final Logger log = LoggerFactory.getLogger(DevPortLogger.class);

    @Override
    public void onApplicationEvent(WebServerInitializedEvent event) {
        int port = event.getWebServer().getPort();
        log.info("");
        log.info("========================================");
        log.info("  DEV: API running at http://localhost:{}/api", port);
        log.info("  Set VITE_API_URL=http://localhost:{}/api in Client .env", port);
        log.info("========================================");
        log.info("");
    }
}
