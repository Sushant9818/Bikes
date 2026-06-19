package com.suzuki.bike.service;

import com.suzuki.bike.dto.ContactDto;
import com.suzuki.bike.entity.ContactRequest;
import com.suzuki.bike.repository.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @Transactional
    public ContactRequest submit(ContactDto dto) {
        ContactRequest req = new ContactRequest();
        req.setName(dto.getName());
        req.setEmail(dto.getEmail());
        req.setPhone(dto.getPhone());
        req.setSubject(dto.getSubject());
        req.setMessage(dto.getMessage());
        return contactRepository.save(req);
    }
}
