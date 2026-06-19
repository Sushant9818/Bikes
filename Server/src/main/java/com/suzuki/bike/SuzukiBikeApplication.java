package com.suzuki.bike;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class SuzukiBikeApplication {

    private static final Logger log = LoggerFactory.getLogger(SuzukiBikeApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(SuzukiBikeApplication.class, args);
    }

    @EventListener
    public void onWebServerReady(WebServerInitializedEvent event) {
        int port = event.getWebServer().getPort();
        log.info("Application started on port: {}", port);
    }
}
