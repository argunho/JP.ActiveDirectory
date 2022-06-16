using ActiveDirectory.Interface;

namespace ActiveDirectory.Repository;

public class SessionData : ISessionData
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private ISession _session => _httpContextAccessor.HttpContext.Session;

    //public SessionData(HttpContext context)
    //{
    //    _context = context;
    //}

    //private string? _username { get; set; }
    //private string? _fullName { get; set; }
    //private string? _email { get; set; }
    //private string? _password { get; set; }
    //private string? _passwordResetGroup { get; set; }
    //private string? _groupToManage { get; set; }

    public string? Username { get => _session.GetString("Username"); set => _session.GetString("Username"); }
    public string? FullName { get => _session.GetString("FullName"); set => _session.GetString("FullName"); }
    public string? Email { get => _session.GetString("Email"); set => _session.GetString("Email"); }
    public string? Password { get => _session.GetString("Password"); set => _session.GetString("Password"); }
    public string? PasswordResetGroup { get => _session.GetString("PasswordResetGroup"); set => _session.GetString("PasswordResetGroup"); }
    public string? GroupToManage { get => _session.GetString("GroupToManage"); set => value = "_session.GetString(GroupToMange)"; }
    
}
