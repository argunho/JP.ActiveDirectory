using ActiveDirectory.Interface;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using ActiveDirectory.Extensions;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    //private readonly IHttpContextAccessor _contextAccessor;

    public AuthController(IActiveDirectoryProvider provider, IConfiguration config)//IHttpContextAccessor httpContextAccessor
    {
        _provider = provider;
        _config = config;
        //_contextAccessor = httpContextAccessor;
    }

    #region GET
    // Validate user access first with Windows authentication username when user started application
    [HttpGet]
    public JsonResult AccessValidation()
    {
        string? errorMessage = null;
        try
        {
            var name = Environment.UserName; // Get windows username;
            if (name == null) // If failed to get username, try other way to get windows username
            {
                var currentUser = WindowsIdentity.GetCurrent();
                if (currentUser != null)
                    name = currentUser?.Name.ToString().Split('\\')[1];
            }

            if (name?.Length > 0)
            {
                var user = _provider.FindUserByExtensionProperty(name); // Get user from Active Directory
                if (user != null && _provider.MembershipCheck(name, "Password Reset Students-EDU")) // Check user's membership
                {
                    // If user is found, create Jwt Token to get all other information and to get access to other functions
                    var token = CreateJwtToken(user);
                    return new JsonResult(new
                    {
                        access = true,
                        alert = "success",
                        token = token,
                        msg = "Din åtkomstbehörighet har bekräftats."
                    });
                }
            }
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
        }

        return new JsonResult(new
        {
            access = false,
            alert = "warning",
            msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord",
            errorMessage = errorMessage ?? "Inga windows-uppgifter kunde identifieras."
        });
    }

    // Save admin password
    [HttpGet("credential/{password}")]
    [Authorize]
    public JsonResult SetFullCredential(string password)
    {
        ProtectAccount();
        var errorMessage = "Felaktig lösenord.";

        // If the user is not locked, validate user's password
        UserCredentials.BlockTime = null;
        try
        {
            if (_provider.AccessValidation(UserCredentials.Username, password))
            {
                UserCredentials.Password = password;
                UserCredentials.Attempt = 0;
                return new JsonResult(new { success = true });
            }
        }
        catch (Exception ex)
        {
            errorMessage = "Fel: " + ex?.InnerException?.Message ?? ex.Message;
        }

        // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
        UserCredentials.Attempt += 1;
        if (UserCredentials.Attempt == 3)
        {
            UserCredentials.Attempt = 0;
            UserCredentials.BlockTime = DateTime.Now;
        }

        return new JsonResult(new { success = false, msg = errorMessage });
    }
    #endregion

    #region POST
    // Log in with another account if authentication with windows username is failed or to authorize another user
    [HttpPost]
    public JsonResult Post(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" }); //Forms filled out incorrectly
        try
        {
            ProtectAccount();

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model.Username, model.Password);
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                UserCredentials.Attempt += 1;
                if (UserCredentials.Attempt == 3)
                {
                    UserCredentials.Attempt = 0;
                    UserCredentials.BlockTime = DateTime.Now;
                }
                return new JsonResult(new { alert = "error", msg = "Felaktig användarnamn eller lösenord." }); //Incorrect username or password"
            }

            // Define and save a group in which members have the right to administer
            GroupNames.GroupToManage = (model.Group == "Politician") ? "IntuneUser-Politiker" : model.Group;

            // Define and save a group in which member/members will be managed in the current session
            GroupNames.PasswordResetGroup = (model.Group == "Students") ? "Password Reset Students-EDU" : "";

            // Check the logged user's right to administer
            if (_provider.MembershipCheck(model.Username, GroupNames.PasswordResetGroup))
            {
                var user = _provider.FindUserByExtensionProperty(model.Username);
                // If user is found, create Jwt Token to get all other information and to get access to other functions
                var token = CreateJwtToken(user, model.Password);
                return new JsonResult(new { access = true, alert = "success", token = token, msg = "Din åtkomstbehörighet har bekräftats." }); // Your access has been confirmed.
            }
        }
        catch (Exception ex)
        {
            return new JsonResult(new { alert = "warning", msg = "Något har gått snett. Felmeddelande visas i browser konsolen.", consoleMsg = ex.Message }); //Something went wrong, please try again later
        }

        var members = model.Group == "Students" ? "elevs" : "politikers";
        return new JsonResult(new { alert = "warning", msg = $"Åtkomst nekad! Du har inte behörighet att redigera {members} lösenord" }); // Failed! You do not have permission to edit a student's password
    }
    #endregion

    #region Helpers
    // Create Jwt Token for authenticating
    private string CreateJwtToken(UserPrincipalExtension user, string? password = null)
    {
        UserCredentials.Password = password;
        UserCredentials.Email = user.EmailAddress;
        UserCredentials.FullName = user.DisplayName;
        UserCredentials.Username = user.Name;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new IdentityOptions();

        var claims = new List<Claim>();
        claims.Add(new Claim(ClaimTypes.Name, user.Name));
        claims.Add(new Claim(ClaimTypes.Email, user.EmailAddress));
        claims.Add(new Claim("GroupToManage", GroupNames.GroupToManage));
        //foreach (var r in roles)
        //    claim.Add(new Claim(opt.ClaimsIdentity.RoleClaimType, r));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),
            Expires = DateTime.Now.AddDays(3),
            SigningCredentials = credentials
        };

        var encodeToken = new JwtSecurityTokenHandler();
        var securityToken = encodeToken.CreateToken(tokenDescriptor);
        var token = encodeToken.WriteToken(securityToken);

        return token;
    }

    // Protection against account blocking after several attempts to enter incorrect data
    public JsonResult? ProtectAccount()
    {
        // Check if the user is blocked from further attempts to enter incorrect data
        // Unclock time after 4 incorrect passwords
        if (UserCredentials.BlockTime != null)
        {
            // Current time - Block time to know is user unlocked or not
            var time = DateTime.Now.Ticks - UserCredentials.BlockTime?.AddMinutes(30).Ticks;
            // If the user until unlocked
            if (time < 0)
            {
                return new JsonResult(new
                {
                    success = false,
                    alert = "warning",
                    msg = $"Du har redan gjort 4 försök att logga in och för att undvika ditt konto blockering, bör du vänta {time?.ToString("HH:mm:ss")}"
                });
            }
        }

        return null;
    }
    #endregion
}


public static class UserCredentials // Class to save and use admin credentials
{
    public static string? Username { get; set; }
    public static string? FullName { get; set; }
    public static string? Email { get; set; }
    public static string? Password { get; set; }
    public static int Attempt { get; set; }
    public static Nullable<DateTime> BlockTime { get; set; }
}

public static class GroupNames
{
    public static string? PasswordResetGroup { get; set; }
    public static string? GroupToManage { get; set; }
}