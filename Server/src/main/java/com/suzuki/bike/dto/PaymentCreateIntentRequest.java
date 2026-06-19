package com.suzuki.bike.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public class PaymentCreateIntentRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 100)
    private String customerName;

    @NotBlank(message = "Phone is required")
    @Size(max = 20)
    private String phone;

    @Email
    @Size(max = 100)
    private String email;

    @NotBlank(message = "Address is required")
    @Size(max = 500)
    private String address;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<OrderItemDto> items;

    public PaymentCreateIntentRequest() {
    }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}
