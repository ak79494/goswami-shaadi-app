package com.goswami.shaadi.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import java.nio.file.Paths;

@Configuration
public class UploadResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir}")
    String dir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry r) {

        String uploadLocation = Paths.get(dir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        if (!uploadLocation.endsWith("/")) {
            uploadLocation = uploadLocation + "/";
        }

        System.out.println("PHOTO RESOURCE DIRECTORY = " + uploadLocation);

        r.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);
    }
}