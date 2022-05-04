using System.ComponentModel.DataAnnotations;

namespace ActiveDirectory.ViewModels;

public class UserViewModel
{
    public string Name { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string OldPassword { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string? AdminPassword { get; set; }

    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; } = string.Empty;

    public List<string> Users { get; set; } = new List<string>();
}
