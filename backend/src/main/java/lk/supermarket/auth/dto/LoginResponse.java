package lk.supermarket.auth.dto;

public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private AuthUserDto user;

    public LoginResponse() {
    }

    public LoginResponse(String token, AuthUserDto user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public AuthUserDto getUser() {
        return user;
    }

    public void setUser(AuthUserDto user) {
        this.user = user;
    }
}
