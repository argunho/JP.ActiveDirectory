namespace ActiveDirectory.Models;

public class User
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Office { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsLocked { get; set; }  
    public Nullable<DateTime> Date { get; set; }
}
