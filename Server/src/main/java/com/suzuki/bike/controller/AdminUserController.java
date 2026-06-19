package com.suzuki.bike.controller;

import com.suzuki.bike.dto.UserDto;
import com.suzuki.bike.entity.enums.Role;
import com.suzuki.bike.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> findAll() {
        return ResponseEntity.ok(adminUserService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getById(id));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDto> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().build();
        }
        Role role = Role.valueOf(roleStr.toUpperCase());
        return ResponseEntity.ok(adminUserService.updateRole(id, role));
    }

    @PutMapping("/{id}/enable")
    public ResponseEntity<UserDto> updateEnabled(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean enabled = body.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(adminUserService.updateEnabled(id, enabled));
    }
}
