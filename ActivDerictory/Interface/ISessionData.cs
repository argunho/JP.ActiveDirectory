namespace ActiveDirectory.Interface;

public interface ISessionData
{
    string? Username { get; set; } 
    string? FullName { get; set; }
    string? Email { get; set; }
    string? Password { get; set; }
    string? PasswordResetGroup { get; set; }
    string? GroupToManage { get; set; }
}
