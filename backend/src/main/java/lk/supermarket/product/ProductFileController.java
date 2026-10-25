package lk.supermarket.product;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/product-images")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductFileController {
    private static final Path UPLOAD_DIRECTORY = Path.of("uploads", "products");

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestPart("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Please select a valid image file");
        }
        Files.createDirectories(UPLOAD_DIRECTORY);
        String originalName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
                : "";
        String fileName = UUID.randomUUID() + extension;
        Files.copy(file.getInputStream(), UPLOAD_DIRECTORY.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        return Map.of("imageUrl", "/uploads/products/" + fileName);
    }
}
