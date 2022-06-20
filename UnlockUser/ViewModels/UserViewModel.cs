using System.ComponentModel.DataAnnotations;

namespace UnlockUser.ViewModels;

public class UserViewModel
{
    public string Name { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string OldPassword { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    public string ConfirmPassword { get; set; } = string.Empty;
    public UserCredentials? Credentials { get; set; } = null;
    public string? Group { get; set; }

    public List<UserViewModel> Users { get; set; } = new List<UserViewModel>();
}

public class UserCredentials {
    public string? Username { get; set; }
    public string? Password { get; set; }
}