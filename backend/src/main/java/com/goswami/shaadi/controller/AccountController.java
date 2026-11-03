package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.AuthDtos.DeleteAccountRequest;
import com.goswami.shaadi.dto.AuthDtos.DeleteWithLoginRequest;
import com.goswami.shaadi.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {

    private final AccountService accounts;

    public AccountController(AccountService accounts) {
        this.accounts = accounts;
    }

    @PostMapping("/account/delete")
    public void delete(Authentication a, @Valid @RequestBody DeleteAccountRequest r) {
        accounts.deleteSignedIn((Long) a.getPrincipal(), r.password(), r.reason());
    }

    /** For the website's public deletion page: Google requires a way to do this without the app. */
    @PostMapping("/auth/delete-account")
    public void deleteWithLogin(@Valid @RequestBody DeleteWithLoginRequest r) {
        accounts.deleteWithLogin(r.email(), r.password(), r.reason());
    }
}
