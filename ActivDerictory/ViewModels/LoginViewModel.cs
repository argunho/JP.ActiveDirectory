using System.ComponentModel.DataAnnotations;

namespace ActiveDirectory.ViewModels;

public class LoginViewModel
{
    [Required]
    public string Username { get; set; } = String.Empty;
    [Required]
    public string Password { get; set; } = String.Empty;
}
