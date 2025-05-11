package com.inventory.service;

import com.inventory.model.InventoryItem;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    public void sendLowStockAlert(InventoryItem item) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo("heyitsazar@gmail.com"); // Replace with your email
            helper.setSubject("🚨 Low Stock Alert: " + item.getName());
            
            String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            // Read the template
            String template = Files.readString(Paths.get("src/main/resources/templates/email/low-stock-alert.html"));
            
            // Replace placeholders
            String htmlContent = template
                .replace("${itemName}", item.getName())
                .replace("${currentStock}", String.valueOf(item.getQuantity()))
                .replace("${minStockLevel}", String.valueOf(item.getMinStockLevel()))
                .replace("${unitPrice}", String.format("%.2f", item.getUnitPrice()))
                .replace("${description}", item.getDescription())
                .replace("${itemId}", String.valueOf(item.getId()))
                .replace("${timestamp}", currentTime);
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Low stock alert sent for item: {}", item.getName());
        } catch (MessagingException | IOException e) {
            logger.error("Failed to send email alert: {}", e.getMessage());
        }
    }

    public void sendRestockActionEmail(InventoryItem item, Integer restockQuantity) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo("heyitsazar@gmail.com");
            helper.setSubject("🔄 Restock Action: " + item.getName());
            
            String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            String template = Files.readString(Paths.get("src/main/resources/templates/email/restock-action.html"));
            
            String htmlContent = template
                .replace("${itemName}", item.getName())
                .replace("${currentStock}", String.valueOf(item.getQuantity()))
                .replace("${minStockLevel}", String.valueOf(item.getMinStockLevel()))
                .replace("${restockQuantity}", String.valueOf(restockQuantity))
                .replace("${unitPrice}", String.format("%.2f", item.getUnitPrice()))
                .replace("${description}", item.getDescription())
                .replace("${itemId}", String.valueOf(item.getId()))
                .replace("${timestamp}", currentTime);
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            logger.info("Restock action email sent for item: {}", item.getName());
        } catch (MessagingException | IOException e) {
            logger.error("Failed to send restock action email: {}", e.getMessage());
        }
    }
} 