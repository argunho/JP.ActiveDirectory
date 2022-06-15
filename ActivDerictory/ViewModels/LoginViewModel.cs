using System.ComponentModel.DataAnnotations;

namespace ActiveDirectory.ViewModels;

public class LoginViewModel
{
    [Required]
    public string Username { get; set; } = String.Empty;
    [Required]
    public string Password { get; set; } = String.Empty;
    [Required]
    public string Group { get; set; } = String.Empty;

    public LoginBlock Block { get; set; }
}

public class LoginBlock
{
    public string? Time { get; set; }
    public string? Username { get; set; }
}