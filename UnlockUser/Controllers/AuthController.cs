using UnlockUser.Extensions;
using UnlockUser.Interface;
using UnlockUser.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace UnlockUser.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    private readonly IConfiguration _config; // Implementation of configuration file => ActiveDerictory/appsettings.json
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly ISession _session;

    public AuthController(IActiveDirectoryProvider provider, IConfiguration config, IHttpContextAccessor contextAccessor)
    {
        _provider = provider;
        _config = config;
        _contextAccessor = contextAccessor;
        _session = _contextAccessor.HttpContext.Session;
    }

    #region GET
    // Logout
    [HttpGet("logout")]
    public JsonResult Logout()
    {
        try
        {
            var _session = HttpContext.Session;
            _session.Remove("Username");
            _session.Remove("FullName");
            _session.Remove("Email");
            _session.Remove("Password");
            _session.Remove("GroupToManage");
            _session.Remove("PasswordResetGroup");
            _session.Remove("LoginAttempt");
            _session.Remove("LoginBlockTime");
        }
        catch (Exception ex)
        {
            return new JsonResult(new { errorMessage = ex.Message });
        }

        return new JsonResult(true);
    }
    #endregion

    #region POST
    // Log in with another account if authentication with windows username is failed or to authorize another user
    [HttpPost]
    public JsonResult Post(LoginViewModel model)
    {
        if (!ModelState.IsValid)// Forms filled out incorrectly
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" });

        try
        {
            int loginAttempt = _session?.GetInt32("LoginAttempt") ?? 0;
            var response = ProtectAccount(loginAttempt, model?.BlockTime);
            if (response != null) return response;

            // Validate username and password
            var isAutheticated = _provider.AccessValidation(model?.Username, model?.Password);
            if (!isAutheticated)
            {
                // If the user tried to put in a wrong password, save this like +1 a wrong attempt and the max is 4 attempts
                _session?.SetInt32("LoginAttempt", loginAttempt += 1);

                if (loginAttempt >= 4)
                {
                    response = ProtectAccount(loginAttempt, model?.BlockTime);
                    if (response != null) return response;
                }

                return new JsonResult(new
                {
                    alert = "error",
                    loginAttempt = loginAttempt,
                    msg = $"<b>Felaktig användarnamn eller lösenord.</b><br/> {4 - loginAttempt} försök kvar."
                }); //Incorrect username or password
            }

            _session?.Remove("LoginAttempt");
            _session?.Remove("LoginBlockTime");

            // Define and save a group in which member/members will be managed in the current session
            var groupToManage = (model?.Group == "Politician") ? "Ciceron-Assistentanvändare" : model?.Group ?? "";

            // Define and save a group in which members have the right to administer this group which was defined above
            var administrationGroup = (model?.Group == "Students") ? "Password Reset Students-EDU" : "Password Reset Politiker";

            // Check the logged user's right to administer
            if (_provider.MembershipCheck(model?.Username, administrationGroup))
            {
                // If the logged user is found, create Jwt Token to get all other information and to get access to other functions
                var token = CreateJwtToken(_provider.FindUserByExtensionProperty(model?.Username ?? ""), model?.Password ?? "", groupToManage);
                return new JsonResult(new { alert = "success", token = token, msg = "Din åtkomstbehörighet har bekräftats." }); // Your access has been confirmed.
            }
            else
                return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att ändra lösenord." }); // Failed! You do not have permission to edit a student's password
        }
        catch (Exception ex)
        {
            // Activate a button in the user interface for sending an error message to the system developer if the same error is repeated more than two times during the same session
            var repeated = _session?.GetInt32("RepeatedError") ?? 0;
            _session?.SetInt32("RepeatedError", repeated += 1);
            return new JsonResult(new
            {
                alert = "warning",
                msg = "Något har gått snett. Var vänlig försök igen.",
                repeatedError = repeated,
                errorMessage = ex.Message
            }); // Something went wrong, please try again later
        }
    }
    #endregion

    #region Helpers
    // Create Jwt Token for authenticating
    private string CreateJwtToken(UserPrincipalExtension user, string password, string group)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new IdentityOptions();

        _session.SetString("Password", password);
        _session.SetString("Username", user.Name);
        _session.SetString("DisplayName", user.DisplayName);
        _session.SetString("Email", user.EmailAddress);

        var claims = new List<Claim>();
        claims.Add(new Claim(ClaimTypes.Name, user.Name));
        claims.Add(new Claim("Email", user.EmailAddress));
        claims.Add(new Claim("DisplayName", user.DisplayName));
        claims.Add(new Claim("GroupToManage", group));

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

    // Protection against account blocking after several unsuccessful attempts to authenticate
    public JsonResult? ProtectAccount(int attempt, string? savedBlockTime)
    {
        var blockTime = _session?.GetString("LoginBlockTime") ?? null;

        if (attempt >= 4)
        {
            _session?.SetString("LoginBlockTime", DateTime.Now.ToString());
            _session?.SetInt32("LoginAttempt", 0);
        }
        else if (savedBlockTime != null)
            _session?.SetString("LoginBlockTime", Convert.ToDateTime(savedBlockTime).ToString());
        else if (blockTime == null)
            return null;

        // Check if the user is blocked from further attempts to enter incorrect data
        // Unclock time after 4 incorrect passwords
        blockTime = blockTime ?? _session?.GetString("LoginBlockTime");

        DateTime blockTimeStamp = Convert.ToDateTime(blockTime);
        var timeLeftTicks = DateTime.Now.Ticks - blockTimeStamp.AddMinutes(30).Ticks;

        if (timeLeftTicks > 0) return null;

        var timeLeft = new DateTime(Math.Abs(timeLeftTicks));

        return new JsonResult(new
        {
            alert = "warning",
            msg = $"Vänta {timeLeft.ToString("HH:mm:ss")} minuter innan du försöker igen.",
            timeLeft = timeLeft.ToString("HH:mm:ss"),
            blockTime = blockTimeStamp
        });
    }
    #endregion
}