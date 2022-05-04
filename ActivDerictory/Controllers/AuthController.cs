using ActiveDirectory.Interface;
using ActiveDirectory.Models;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider;
    private readonly IConfiguration _config;
    public AuthController(IActiveDirectoryProvider activeDirectory, IConfiguration config)
    {
        _provider = activeDirectory;
        _config = config;
    }

    #region GET
    // Validate user access first with Windows authentication username
    [HttpGet]
    public JsonResult AccessValidation()
    {
        var name = Environment.UserName;
        if (name == null)
        {
            var currentUser = WindowsIdentity.GetCurrent();
            if (currentUser != null)
                name = currentUser?.Name.ToString().Split('\\')[1];
        }

        var user = _provider.FindUserByName(name);

        if (user != null && _provider.MembershipCheck(name))
        {
            var token = CreateJwtToken(user);
            AccessCredintails.Username = name;
            return new JsonResult(new
            {
                access = true,
                alert = "success",
                token = token,
                msg = "Din åtkomst behörighet har bekräftats."
            });//Success! Your access has been confirmed.
        }

        return new JsonResult(new { access = false, alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord" }); //Failed! You do not have permission to edit a student's password
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
            var isAutheticated = _provider.AccessValidation(model.Username, model.Password);
            if (!isAutheticated)
                return new JsonResult(new { alert = "error", msg = "Felaktig användarnamn eller lösenord." }); //Incorrect username or password"

            if (_provider.MembershipCheck(model.Username))
            {
                var token = CreateJwtToken(_provider.FindUserByName(model.Username));
                AccessCredintails.Username = model.Username;
                AccessCredintails.Password = model.Password;
                return new JsonResult(new { access = true, alert = "success", token = token, msg = "Din åtkomst behörighet har bekräftats." }); // Your access has been confirmed.
            }
        }
        catch (Exception ex)
        {
            return new JsonResult(new { alert = "warning", msg = "Något har gått snett. Felmeddelande visas i browser konsolen.", consoleMsg = ex.Message }); //Something went wrong, please try again later
        }

        return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord" }); // Failed! You do not have permission to edit a student's password
    }

    #endregion

    #region Helpers
    // Create Jwt Token for authenticating
    private string CreateJwtToken(Principal user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new IdentityOptions();

        var claims = new List<Claim>();
        claims.Add(new Claim(ClaimTypes.Name, user.Name));
        claims.Add(new Claim("DisplayName", user.DisplayName));
        claims.Add(new Claim("Description", user.Description));
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
    #endregion
}


public static class AccessCredintails
{
    public static string Username { get; set; }
    public static string Password { get; set; }
}