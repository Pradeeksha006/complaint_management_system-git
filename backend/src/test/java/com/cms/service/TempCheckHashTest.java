package com.cms.service;

import com.cms.entity.User;
import com.cms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class TempCheckHashTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void check() {
        userRepository.findByUsername("admin").ifPresent(user -> {
            String hash = user.getPassword();
            System.out.println("Checking database hash: " + hash);
            String[] pwds = {"Pradhi@1234", "pradeeksha2006", "Pradhi@1234 ", "pradeeksha2006 "};
            for (String pw : pwds) {
                boolean match = passwordEncoder.matches(pw, hash);
                System.out.println("Password \"" + pw + "\": " + (match ? "MATCH" : "NO MATCH"));
            }
        });
    }
}
