using ActiveDirectory.Extensions;
using ActiveDirectory.Interface;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config; // Implementation of configuration file => ActiveDerictory/appsettings.json

    public AuthController(IActiveDirectoryProvider provider, IConfiguration config)
    {
        _provider = provider;
        _config = config;
    }

    #region GET

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
            if(model.Block != null && model.Username == model.Block?.Username)
            {
                Login.BlockTime = Convert.ToDateTime(model.Block?.Time);
            }

            ProtectAccount(model.Username);

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model.Username, model.Password);
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                Login.Attempt += 1;
                if (Login.Attempt > 3)
                {
                    Login.Attempt = 0;
                    Login.BlockTime = DateTime.Now; 
                    ProtectAccount(model.Username);
                }
                return new JsonResult(new { alert = "error", msg = "Felaktig användarnamn eller lösenord." }); //Incorrect username or password"
            }

            // Define and save a group in which member/members will be managed in the current session
            GroupNames.GroupToManage = (model.Group == "Politician") ? "Ciceron-Assistentanvändare" : model.Group;

            // Define and save a group in which members have the right to administer this group which was defined above
            GroupNames.PasswordResetGroup = (model.Group == "Students") ? "Password Reset Students-EDU" : "Password Reset Politiker";

            // Check the logged user's right to administer
            if (_provider.MembershipCheck(model.Username, GroupNames.PasswordResetGroup))
            {
                var user = _provider.FindUserByExtensionProperty(model.Username);
                // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
                var token = CreateJwtToken(user, model.Password);
                return new JsonResult(new { alert = "success", token = token, msg = "Din åtkomstbehörighet har bekräftats." }); // Your access has been confirmed.
            } else
                return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att ändra lösenord." }); // Failed! You do not have permission to edit a student's password
        }
        catch (Exception ex)
        {
            return new JsonResult(new { alert = "warning", msg = "Något har gått snett. Var vänlig försök igen.", errorMesssage = ex.Message ?? String.Empty }); //Something went wrong, please try again later
        }
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
        claims.Add(new Claim("DisplayName", user.DisplayName));
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
    public JsonResult? ProtectAccount(string username)
    {
        // Check if the user is blocked from further attempts to enter incorrect data
        // Unclock time after 4 incorrect passwords
        if (Login.BlockTime != null)
        {
            // Current time - Block time to know is user unlocked or not
            var time = DateTime.Now.Ticks - Login.BlockTime?.AddMinutes(30).Ticks;

            // If the user until unlocked
            if (time < 0)
            {
                return new JsonResult(new
                {
                    alert = "warning",
                    msg = $"Du har redan gjort 4 försök att logga in och för att undvika ditt konto blockering, bör du vänta {time?.ToString("HH:mm:ss")}",
                    blockTimeStamp = Login.BlockTime,
                    username = username
                });
            }
        }

        return null;
    }
    #endregion
}

public static class UserCredentials // Class to save and use admin credentials into current session
{
    public static string? Username { get; set; }
    public static string? FullName { get; set; }
    public static string? Email { get; set; }
    public static string? Password { get; set; }
}

public static class Login
{
    public static int Attempt { get; set; }
    public static Nullable<DateTime> BlockTime { get; set; }
} // Account blocking protection

public static class GroupNames
{
    public static string? PasswordResetGroup { get; set; }
    public static string? GroupToManage { get; set; }
} // Class to save and use GroupName into current session