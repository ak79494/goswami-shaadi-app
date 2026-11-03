package com.goswami.shaadi.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Company and support details shown on the app's About, Help and Astro screens. */
@RestController
public class AppInfoController {

    public record AppInfo(String companyName, String founderName, String supportPhone,
                          String supportWhatsapp, String supportEmail, String astroWhatsapp) {}

    private final AppInfo info;

    public AppInfoController(
            @Value("${app.company.name:Goswami Shaadi}") String companyName,
            @Value("${app.company.founder:Arun Goswami}") String founder,
            @Value("${app.company.phone:7903508584}") String phone,
            @Value("${app.company.whatsapp:7903508584}") String whatsapp,
            @Value("${app.company.email:}") String email,
            @Value("${app.company.astro-whatsapp:7903508584}") String astroWhatsapp
    ) {
        this.info = new AppInfo(companyName, founder, phone, whatsapp, email, astroWhatsapp);
    }

    @GetMapping("/api/public/app-info")
    public AppInfo info() {
        return info;
    }
}
