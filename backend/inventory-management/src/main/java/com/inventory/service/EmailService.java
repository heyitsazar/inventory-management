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
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.DecimalFormat;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DecimalFormat priceFormat = new DecimalFormat("#,##0.00");
    
    private final JavaMailSender mailSender;
    
    public void sendLowStockAlert(InventoryItem item) {
        logger.info("Starting to send low stock alert for item: {}", item.getName());
        try {
            logger.info("Creating MimeMessage...");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            logger.info("Setting email properties...");
            helper.setTo("heyitsazar@gmail.com");
            helper.setSubject("🚨 Stock Level Alert: " + item.getName());
            
            String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            logger.info("Reading email template...");
            String template;
            try (InputStream is = new ClassPathResource("templates/email/low-stock-alert.html").getInputStream()) {
                template = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                logger.info("Template loaded successfully. Length: {}", template.length());
            } catch (IOException e) {
                logger.error("Failed to read template file: {}", e.getMessage(), e);
                throw e;
            }
            
            logger.info("Replacing template placeholders...");
            String htmlContent = template
                .replace("${itemName}", item.getName())
                .replace("${currentStock}", String.valueOf(item.getQuantity()))
                .replace("${minStockLevel}", String.valueOf(item.getMinStockLevel()))
                .replace("${safetyStock}", item.getSafetyStock() != null ? String.valueOf(item.getSafetyStock()) : "null")
                .replace("${unitPrice}", priceFormat.format(item.getUnitPrice()))
                .replace("${description}", item.getDescription())
                .replace("${itemId}", String.valueOf(item.getId()))
                .replace("${timestamp}", currentTime)
                .replace("${autoCalculationEnabled}", String.valueOf(item.getAutoCalculationEnabled()));
            
            logger.info("Setting email content...");
            helper.setText(htmlContent, true);
            
            logger.info("Attempting to send email...");
            mailSender.send(message);
            logger.info("✅ Stock level alert sent successfully for item: {}", item.getName());
        } catch (MessagingException e) {
            logger.error("❌ Failed to send email alert (MessagingException): {}", e.getMessage(), e);
            logger.error("Error details: {}", e.getCause() != null ? e.getCause().getMessage() : "No cause available");
        } catch (IOException e) {
            logger.error("❌ Failed to read template file: {}", e.getMessage(), e);
        } catch (Exception e) {
            logger.error("❌ Unexpected error while sending email: {}", e.getMessage(), e);
        }
    }

    public void sendRestockActionEmail(InventoryItem item, Integer restockQuantity) {
        logger.info("Starting to send restock action email for item: {}", item.getName());
        try {
            logger.info("Creating MimeMessage...");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            logger.info("Setting email properties...");
            helper.setTo("heyitsazar@gmail.com");
            helper.setSubject("🔄 Restock Order Placed: " + item.getName());
            
            String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            logger.info("Reading email template...");
            String template;
            try (InputStream is = new ClassPathResource("templates/email/restock-action.html").getInputStream()) {
                template = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                logger.info("Template loaded successfully. Length: {}", template.length());
            } catch (IOException e) {
                logger.error("Failed to read template file: {}", e.getMessage(), e);
                throw e;
            }
            
            double totalValue = item.getUnitPrice() * restockQuantity;
            
            logger.info("Replacing template placeholders...");
            String htmlContent = template
                .replace("${itemName}", item.getName())
                .replace("${currentStock}", String.valueOf(item.getQuantity()))
                .replace("${minStockLevel}", String.valueOf(item.getMinStockLevel()))
                .replace("${safetyStock}", item.getSafetyStock() != null ? String.valueOf(item.getSafetyStock()) : "null")
                .replace("${restockQuantity}", String.valueOf(restockQuantity))
                .replace("${unitPrice}", priceFormat.format(item.getUnitPrice()))
                .replace("${totalValue}", priceFormat.format(totalValue))
                .replace("${description}", item.getDescription())
                .replace("${itemId}", String.valueOf(item.getId()))
                .replace("${timestamp}", currentTime)
                .replace("${autoCalculationEnabled}", String.valueOf(item.getAutoCalculationEnabled()));
            
            logger.info("Setting email content...");
            helper.setText(htmlContent, true);
            
            logger.info("Attempting to send email...");
            mailSender.send(message);
            logger.info("✅ Restock order email sent successfully for item: {}", item.getName());
        } catch (MessagingException e) {
            logger.error("❌ Failed to send restock email (MessagingException): {}", e.getMessage(), e);
            logger.error("Error details: {}", e.getCause() != null ? e.getCause().getMessage() : "No cause available");
        } catch (IOException e) {
            logger.error("❌ Failed to read template file: {}", e.getMessage(), e);
        } catch (Exception e) {
            logger.error("❌ Unexpected error while sending email: {}", e.getMessage(), e);
        }
    }
} 